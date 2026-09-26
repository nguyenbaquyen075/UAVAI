import os
import threading
import time
from collections import deque

import cv2
from ultralytics import YOLO

import db
from config import CAMERA_FOV_DEG, FOCAL_LENGTH, MODEL_PATH, REFERENCE_SIZES, model_class_map
from settings_store import settings
from telemetry import estimate_target_position

TARGET_FLUSH_INTERVAL_S = 2.0  # ponytail: throttle ghi DB target, không cần độ chính xác dưới giây
THREAT_BY_SEVERITY = {"red": "high", "yellow": "medium", "green": "low", "none": "low"}


class LowLatencyVideoStream:
    """Chỉ giữ frame mới nhất, tự reconnect khi mất nguồn (theo Tài liệu 1 mục 3)."""

    def __init__(self, source):
        self.source = int(source) if str(source).isdigit() else source  # "0" = webcam
        self.cap = cv2.VideoCapture(source)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        self.frame = None
        self.frame_timestamp = None
        self.running = True
        self.thread = threading.Thread(target=self._reader, daemon=True)
        self.thread.start()

    def _reader(self):
        # ponytail: file video không tự giới hạn tốc độ đọc như camera/RTSP thật — cv2 sẽ decode
        # nhanh hết mức CPU cho phép (dễ >>fps gốc), khiến hiển thị bị "tua nhanh". Pace theo FPS
        # gốc của file để phát mượt đúng tốc độ thật; nguồn RTSP/camera (fps=0/không xác định) thì
        # bỏ qua, giữ hành vi cũ vì đã tự nhiên đến theo nhịp mạng.
        fps = self.cap.get(cv2.CAP_PROP_FPS) or 0
        frame_interval = 1.0 / fps if fps > 0 else 0
        while self.running:
            t0 = time.time()
            ret, frame = self.cap.read()
            if not ret:
                self.cap.release()
                time.sleep(1)
                self.cap = cv2.VideoCapture(self.source)
                self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                fps = self.cap.get(cv2.CAP_PROP_FPS) or 0
                frame_interval = 1.0 / fps if fps > 0 else 0
                continue
            self.frame = frame
            self.frame_timestamp = time.time()
            if frame_interval:
                sleep_left = frame_interval - (time.time() - t0)
                if sleep_left > 0:
                    time.sleep(sleep_left)
        self.cap.release()

    def read(self):
        return self.frame, self.frame_timestamp

    def stop(self):
        self.running = False
        self.thread.join()
        self.cap.release()


class FeedPool:
    """Màn đa khung: mỗi UAV đang được xem có 1 DetectionPipeline riêng (YOLO + tracking + ghi cảnh báo)
    chạy song song, mở khi có người xem và tự đóng khi bỏ xem. UAV chính (pipeline của /video, /ws)
    không nằm trong pool."""

    IDLE_CLOSE_S = 20
    TILE_WIDTH = 640  # thu nhỏ trước khi mã hoá JPEG, đỡ CPU/băng thông khi nhiều khung

    def __init__(self, telemetry=None):
        self.telemetry = telemetry
        self.lock = threading.Lock()
        self.pipelines = {}  # uav_id -> [source, DetectionPipeline, last_access]

    def get(self, uav_id, source):
        now = time.time()
        with self.lock:
            entry = self.pipelines.get(uav_id)
            if entry and entry[0] != source:  # đổi nguồn video -> mở lại
                self._close(self.pipelines.pop(uav_id)[1])
                entry = None
            if entry is None:
                p = DetectionPipeline()
                p.telemetry = self.telemetry
                p.set_active_uav(uav_id, source)
                p.start()
                entry = self.pipelines[uav_id] = [source, p, now]
            entry[2] = now
            for k in [k for k, e in self.pipelines.items() if now - e[2] > self.IDLE_CLOSE_S]:
                self._close(self.pipelines.pop(k)[1])
            return entry[1]

    def peek(self, uav_id):
        with self.lock:
            entry = self.pipelines.get(uav_id)
            return entry[1] if entry else None

    def close(self, uav_id):
        with self.lock:
            entry = self.pipelines.pop(uav_id, None)
        if entry:
            self._close(entry[1])

    @staticmethod
    def _close(p):
        threading.Thread(target=p.stop, daemon=True).start()  # stop() join thread đọc video, không chặn request


SEVERITY_BGR = {"red": (68, 68, 239), "yellow": (11, 158, 245), "green": (128, 222, 74), "none": (128, 222, 74)}


def draw_objects(frame, objects, frame_w, frame_h):
    """Vẽ box YOLO mới nhất lên frame video gốc — video mượt theo tốc độ camera, box cập nhật theo tốc độ nhận diện."""
    if not objects:
        return frame
    frame = frame.copy()
    h, w = frame.shape[:2]
    sx, sy = w / (frame_w or w), h / (frame_h or h)
    for o in objects:
        x1, y1, x2, y2 = o["bbox"]
        p1, p2 = (int(x1 * sx), int(y1 * sy)), (int(x2 * sx), int(y2 * sy))
        color = SEVERITY_BGR.get(o.get("severity"), SEVERITY_BGR["none"])
        cv2.rectangle(frame, p1, p2, color, 2)
        dist = f" {o['distance_m']}m" if o.get("distance_m") is not None else ""
        label = f"#{o['track_id']} {o['class']}{dist}" if o.get("track_id") is not None else f"{o['class']}{dist}"
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        cv2.rectangle(frame, (p1[0], p1[1] - th - 6), (p1[0] + tw + 6, p1[1]), color, -1)
        cv2.putText(frame, label, (p1[0] + 3, p1[1] - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (15, 15, 15), 1, cv2.LINE_AA)
    return frame


def encode_tile(frame, width):
    if frame is None:
        return None
    h, w = frame.shape[:2]
    if w > width:
        frame = cv2.resize(frame, (width, int(h * width / w)), interpolation=cv2.INTER_AREA)
    ok, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
    return buf.tobytes() if ok else None


def estimate_distance(bbox_height_px, class_name, focal_length=FOCAL_LENGTH):
    ref_height = REFERENCE_SIZES.get(class_name)
    if not ref_height or bbox_height_px <= 0:
        return None
    return (ref_height * focal_length) / bbox_height_px


def severity(distance_m, alert_threshold, warning_threshold):
    if distance_m is None:
        return "none"
    if distance_m <= alert_threshold:
        return "red"
    if distance_m <= warning_threshold:
        return "yellow"
    return "green"


class DetectionPipeline:
    """Detection + tracking + distance chạy nền, expose state mới nhất cho FastAPI đọc."""

    def __init__(self):
        # NO_YOLO=1: chạy backend không nhận diện (vẫn có video gốc + dữ liệu), đỡ tốn CPU khi chỉ làm giao diện
        self.model = None if os.environ.get("NO_YOLO") else YOLO(MODEL_PATH)
        self.class_map = model_class_map(self.model.names) if self.model else {}
        self.stream = None
        self.active_uav_id = None
        self.lock = threading.Lock()
        self.latest_jpeg = None
        self.latest_payload = None
        self.track_history = {}  # track_id -> deque[{timestamp, distance_m, class}]
        self._was_alerting = {}
        self._target_ids = {}  # track_id -> db target id (reset khi đổi UAV active)
        self._target_last_flush = {}
        self.running = True
        self.thread = threading.Thread(target=self._loop, daemon=True)
        self.telemetry = None  # gán từ main.py (TelemetryHub)

    def start(self):
        self.thread.start()

    def set_active_uav(self, uav_id, video_source):
        """Đổi UAV/nguồn video cho pipeline này (mỗi pipeline 1 UAV; nhiều UAV song song xem FeedPool)."""
        old_stream = self.stream
        self.stream = LowLatencyVideoStream(video_source)
        self.active_uav_id = uav_id
        self.track_history = {}
        self._was_alerting = {}
        self._target_ids = {}
        self._target_last_flush = {}
        if old_stream:
            old_stream.stop()

    def get_track_history(self, track_id):
        with self.lock:
            return list(self.track_history.get(track_id, []))

    def _update_target(self, track_id, class_name, distance_m, severity_level, x1, x2, frame_width, now_iso):
        threat = THREAT_BY_SEVERITY[severity_level]
        gps = self.telemetry.position(self.active_uav_id) if self.telemetry else None
        lat = lon = heading = None
        if gps and distance_m is not None:
            lat, lon, heading = estimate_target_position(
                gps["lat"], gps["lon"], gps["heading_deg"], (x1 + x2) / 2, frame_width, distance_m, CAMERA_FOV_DEG
            )

        target_id = self._target_ids.get(track_id)
        if target_id is None:
            target_id = db.create_target(track_id, self.active_uav_id, class_name, threat, distance_m, lat, lon, heading, now_iso)
            self._target_ids[track_id] = target_id
            self._target_last_flush[track_id] = time.time()
        elif time.time() - self._target_last_flush.get(track_id, 0) >= TARGET_FLUSH_INTERVAL_S:
            db.touch_target(target_id, threat, distance_m, lat, lon, heading, now_iso)
            self._target_last_flush[track_id] = time.time()

    def _loop(self):
        while self.running:
            if self.stream is not None and self.model is None:
                # Không YOLO: vẫn phát payload tối thiểu để giao diện biết UAV nào đang live + GPS
                with self.lock:
                    self.latest_payload = {
                        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                        "active_uav_id": self.active_uav_id,
                        "objects": [],
                        "uav_status": {
                            "connection": "ok",
                            "gps": self.telemetry.position(self.active_uav_id) if self.telemetry else None,
                        },
                    }
                time.sleep(0.2)
                continue
            if self.stream is None:
                time.sleep(0.05)
                continue

            cfg = settings.get()
            frame, ts = self.stream.read()
            if frame is None or ts is None or (time.time() - ts) > cfg["max_acceptable_delay"]:
                time.sleep(0.01)
                continue

            enabled_ids = [cid for cid, name in self.class_map.items() if name in cfg["enabled_classes"]]
            results = self.model.track(
                frame,
                persist=True,
                tracker="bytetrack.yaml",
                classes=enabled_ids,
                verbose=False,
                # imgsz mặc định (640) — ưu tiên độ chính xác bắt mục tiêu hơn tốc độ; /video giờ
                # stream frame gốc tách riêng (xem get_live_frame) nên inference chậm không làm lag video.
            )

            now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            objects = []
            for box in results[0].boxes:
                cls_id = int(box.cls[0])
                class_name = self.class_map.get(cls_id)
                track_id = int(box.id[0]) if box.id is not None else None
                x1, y1, x2, y2 = [float(v) for v in box.xyxy[0]]
                distance = estimate_distance(y2 - y1, class_name)
                distance_m = round(distance, 1) if distance is not None else None
                sev = severity(distance_m, cfg["alert_threshold_m"], cfg["warning_threshold_m"])

                objects.append({
                    "track_id": track_id,
                    "class": class_name,
                    "distance_m": distance_m,
                    "bbox": [x1, y1, x2, y2],
                    "alert": sev in ("red", "yellow"),
                    "severity": sev,
                })

                if track_id is not None:
                    with self.lock:
                        hist = self.track_history.setdefault(track_id, deque(maxlen=200))
                        hist.append({"timestamp": now_iso, "distance_m": distance_m, "class": class_name})
                    self._update_target(track_id, class_name, distance_m, sev, x1, x2, frame.shape[1], now_iso)

            annotated = results[0].plot()
            ok, buf = cv2.imencode(".jpg", annotated)
            jpeg_bytes = buf.tobytes() if ok else None

            # Chỉ ghi log khi 1 track vừa CHUYỂN sang trạng thái cảnh báo, tránh flood DB mỗi 100ms
            for obj in objects:
                tid = obj["track_id"]
                if tid is None:
                    continue
                was_alerting = self._was_alerting.get(tid, False)
                if obj["alert"] and not was_alerting and jpeg_bytes:
                    db.insert_alert(now_iso, tid, obj["class"], obj["distance_m"], obj["severity"], self.active_uav_id, jpeg_bytes)
                self._was_alerting[tid] = obj["alert"]

            payload = {
                "timestamp": now_iso,
                "active_uav_id": self.active_uav_id,
                "objects": objects,
                "uav_status": {
                    "connection": "ok",
                    "latency_ms": round((time.time() - ts) * 1000, 1),
                    "gps": self.telemetry.position(self.active_uav_id) if self.telemetry else None,
                    "frame_width": frame.shape[1],
                    "frame_height": frame.shape[0],
                },
            }

            with self.lock:
                if jpeg_bytes:
                    self.latest_jpeg = jpeg_bytes
                self.latest_payload = payload

    def get_frame(self):
        """Frame ĐÃ vẽ box detection — dùng cho snapshot tải xuống, không dùng cho stream trực tiếp
        vì tốc độ bị khoá theo tốc độ inference (chậm nếu ưu tiên độ chính xác)."""
        with self.lock:
            return self.latest_jpeg

    def get_live_frame(self):
        """Frame gốc mới nhất, JPEG hoá riêng — tách khỏi tốc độ inference để /video luôn mượt
        dù model chạy chậm hơn để bắt mục tiêu chính xác hơn. Không có box detection vẽ sẵn."""
        if self.stream is None:
            return None
        frame, _ = self.stream.read()
        if frame is None:
            return None
        ok, buf = cv2.imencode(".jpg", frame)
        return buf.tobytes() if ok else None

    def get_live_tile(self, width):
        """Frame mới nhất (đã vẽ box) thu nhỏ cho màn đa khung. Mã hoá JPEG 1 lần cho mỗi frame video +
        mỗi lượt nhận diện, request lặp lại (khung poll ~25 hình/s) dùng lại bản đã mã hoá -> đỡ CPU."""
        if self.stream is None:
            return None
        frame, frame_ts = self.stream.read()
        if frame is None:
            return None
        payload = self.get_payload() or {}
        key = (frame_ts, payload.get("timestamp"), len(payload.get("objects") or []), width)
        cached = getattr(self, "_tile_cache", None)
        if cached and cached[0] == key:
            return cached[1]
        status = payload.get("uav_status") or {}
        frame = draw_objects(frame, payload.get("objects"), status.get("frame_width"), status.get("frame_height"))
        jpeg = encode_tile(frame, width)
        self._tile_cache = (key, jpeg)
        return jpeg

    def get_payload(self):
        with self.lock:
            return self.latest_payload

    def stop(self):
        self.running = False
        if self.stream:
            self.stream.stop()
