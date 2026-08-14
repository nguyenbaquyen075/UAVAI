import threading
import time
from collections import deque

import cv2
from ultralytics import YOLO

import db
from config import CAMERA_FOV_DEG, FOCAL_LENGTH, REFERENCE_SIZES, TARGET_CLASSES
from settings_store import settings
from telemetry import estimate_target_position

TARGET_FLUSH_INTERVAL_S = 2.0  # ponytail: throttle ghi DB target, không cần độ chính xác dưới giây
THREAT_BY_SEVERITY = {"red": "high", "yellow": "medium", "green": "low", "none": "low"}


class LowLatencyVideoStream:
    """Chỉ giữ frame mới nhất, tự reconnect khi mất nguồn (theo Tài liệu 1 mục 3)."""

    def __init__(self, source):
        self.source = source
        self.cap = cv2.VideoCapture(source)
        self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        self.frame = None
        self.frame_timestamp = None
        self.running = True
        self.thread = threading.Thread(target=self._reader, daemon=True)
        self.thread.start()

    def _reader(self):
        while self.running:
            ret, frame = self.cap.read()
            if not ret:
                self.cap.release()
                time.sleep(1)
                self.cap = cv2.VideoCapture(self.source)
                self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
                continue
            self.frame = frame
            self.frame_timestamp = time.time()

    def read(self):
        return self.frame, self.frame_timestamp

    def stop(self):
        self.running = False
        self.thread.join()
        self.cap.release()


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
        self.model = YOLO("yolov8n.pt")
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
        """Chỉ 1 UAV chạy detection thật tại 1 thời điểm (ground station CPU-only)."""
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
            if self.stream is None:
                time.sleep(0.05)
                continue

            cfg = settings.get()
            frame, ts = self.stream.read()
            if frame is None or ts is None or (time.time() - ts) > cfg["max_acceptable_delay"]:
                time.sleep(0.01)
                continue

            enabled_ids = [cid for cid, name in TARGET_CLASSES.items() if name in cfg["enabled_classes"]]
            results = self.model.track(
                frame,
                persist=True,
                tracker="bytetrack.yaml",
                classes=enabled_ids,
                verbose=False,
            )

            now_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            objects = []
            for box in results[0].boxes:
                cls_id = int(box.cls[0])
                class_name = TARGET_CLASSES.get(cls_id)
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
        with self.lock:
            return self.latest_jpeg

    def get_payload(self):
        with self.lock:
            return self.latest_payload

    def stop(self):
        self.running = False
        if self.stream:
            self.stream.stop()
