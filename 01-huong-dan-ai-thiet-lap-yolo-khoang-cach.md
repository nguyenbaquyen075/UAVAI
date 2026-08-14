# Tài liệu 1: Hướng dẫn AI Thiết lập YOLO — Nhận diện Mục tiêu và Đo khoảng cách

**Dự án:** Hệ thống UAV tuần tra — nhận diện người/phương tiện, đo khoảng cách, cảnh báo
**Ngữ cảnh:** Kinh phí hạn chế → xử lý tại ground station (không xử lý on-board trên UAV), nhận video qua kết nối không dây, luôn ưu tiên frame mới nhất để giảm độ trễ.

---

## 1. Môi trường & cài đặt

```bash
pip install ultralytics opencv-python
```

- Model dùng: **YOLOv8n** (nano) — ưu tiên tốc độ vì xử lý real-time trên ground station không có GPU chuyên dụng mạnh (phù hợp ngân sách hạn chế)
- Nếu ground station có GPU rời (kể cả GPU tầm trung), có thể nâng lên `yolov8s` để tăng độ chính xác mà vẫn giữ tốc độ chấp nhận được

```python
from ultralytics import YOLO
model = YOLO("yolov8n.pt")  # pretrained COCO, không cần train từ đầu
```

---

## 2. Cấu hình nhận diện mục tiêu

### 2.1 Class sử dụng (từ COCO, có sẵn — không cần train riêng)

```python
TARGET_CLASSES = {
    0: "person",
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck",
}
```

```python
results = model.track(
    frame,
    persist=True,
    tracker="bytetrack.yaml",
    classes=list(TARGET_CLASSES.keys())
)
```

### 2.2 Khi nào cần fine-tune thêm

Chỉ cần train riêng nếu có phương tiện/đối tượng đặc thù không nằm trong COCO (ví dụ xe công trình chuyên dụng). Nếu chưa có nhu cầu này, **bỏ qua bước train**, dùng thẳng pretrained để tiết kiệm thời gian và chi phí thu thập dữ liệu.

---

## 3. Nhận luồng video từ UAV (ground station xử lý)

Áp dụng nguyên tắc **"chỉ lấy frame mới nhất, bỏ frame cũ"** để giảm độ trễ do UAV di chuyển nhanh:

```python
import cv2
import threading
import time

class LowLatencyVideoStream:
    def __init__(self, source):
        self.source = source
        self.cap = cv2.VideoCapture(source, cv2.CAP_FFMPEG)
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
                self.cap = cv2.VideoCapture(self.source, cv2.CAP_FFMPEG)
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
```

**Nguồn video có thể là:** `rtsp://...` (camera FPV WiFi hỗ trợ RTSP), `rtmp://...` (điện thoại stream RTMP), hoặc `udp://...` (analog FPV qua capture card).

### 3.1 Lọc frame quá cũ (chống trễ)

```python
MAX_ACCEPTABLE_DELAY = 0.3  # giây — điều chỉnh theo tốc độ bay thực tế

frame, ts = stream.read()
if frame is not None and (time.time() - ts) <= MAX_ACCEPTABLE_DELAY:
    # xử lý frame này
    pass
else:
    # bỏ qua, chờ frame mới hơn
    pass
```

---

## 4. Đo khoảng cách (Distance Estimation)

Do ngân sách hạn chế → dùng **camera đơn (monocular)**, không cần stereo/depth camera đắt tiền.

### 4.1 Công thức cơ bản

```
khoảng_cách = (kích_thước_thực_tế × tiêu_cự_camera_px) / kích_thước_pixel_trên_ảnh
```

### 4.2 Calibrate tiêu cự (thực hiện 1 lần, trước khi triển khai)

```python
# Đặt vật mẫu (người, cao 1.7m) ở khoảng cách đã biết trước, ví dụ 5 mét
# Đo chiều cao bounding box trên ảnh (pixel), ví dụ 340px
KNOWN_DISTANCE = 5.0       # mét
KNOWN_HEIGHT_REAL = 1.7    # mét
BBOX_HEIGHT_AT_KNOWN_DIST = 340  # px, đo thực tế lúc calibrate

FOCAL_LENGTH = (BBOX_HEIGHT_AT_KNOWN_DIST * KNOWN_DISTANCE) / KNOWN_HEIGHT_REAL
```

### 4.3 Ước lượng khoảng cách theo class

```python
REFERENCE_SIZES = {
    "person": 1.7,       # chiều cao trung bình, mét
    "car": 1.5,          # chiều cao trung bình xe con, mét
    "motorcycle": 1.2,
    "truck": 2.5,
    "bus": 3.0,
}

def estimate_distance(bbox_height_px, class_name, focal_length=FOCAL_LENGTH):
    ref_height = REFERENCE_SIZES.get(class_name)
    if not ref_height or bbox_height_px == 0:
        return None
    return (ref_height * focal_length) / bbox_height_px
```

### 4.4 Lưu ý quan trọng khi UAV bay (góc nghiêng)

Nếu UAV chụp từ góc nghiêng (không thẳng đứng từ trên xuống), chiều cao bounding box trên ảnh bị biến dạng theo góc nghiêng camera → nên:
- Ghi lại góc nghiêng camera (pitch angle) nếu gimbal cho biết, dùng để hiệu chỉnh công thức
- Hoặc giới hạn cảnh báo khoảng cách chỉ áp dụng khi UAV bay ở độ cao/góc tương đối ổn định, tránh sai số lớn khi góc thay đổi liên tục

---

## 5. Kết hợp Detection + Tracking + Distance + Cảnh báo

```python
ALERT_THRESHOLD_M = 10.0  # mét — điều chỉnh theo thực tế dự án

stream = LowLatencyVideoStream("rtsp://<uav_camera_stream>")
time.sleep(1)

while True:
    frame, ts = stream.read()
    if frame is None or (time.time() - ts) > MAX_ACCEPTABLE_DELAY:
        continue

    results = model.track(frame, persist=True, tracker="bytetrack.yaml",
                           classes=list(TARGET_CLASSES.keys()))

    for box in results[0].boxes:
        cls_id = int(box.cls[0])
        class_name = TARGET_CLASSES.get(cls_id)
        track_id = int(box.id[0]) if box.id is not None else None
        x1, y1, x2, y2 = box.xyxy[0]
        bbox_height = y2 - y1

        distance = estimate_distance(bbox_height, class_name)

        if distance is not None and distance <= ALERT_THRESHOLD_M:
            # kích hoạt cảnh báo — xem Tài liệu 3 (kiến trúc & tích hợp)
            pass

    annotated = results[0].plot()
    cv2.imshow("UAV Patrol", annotated)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

stream.stop()
cv2.destroyAllWindows()
```

---

## 6. Tối ưu tốc độ (khi cần, không bắt buộc ban đầu)

- Convert model sang ONNX hoặc TensorRT nếu ground station có GPU NVIDIA hỗ trợ, giúp tăng tốc inference
- Frame skipping: chỉ detect 1 trong mỗi 2-3 frame nếu FPS gốc quá cao so với nhu cầu thực tế
- Giảm resolution input về 640x640 (mặc định YOLOv8) thay vì full HD nếu tốc độ chưa đạt yêu cầu

---

## 7. Checklist khi giao việc này cho AI

- [ ] Đã cung cấp: loại kết nối video (RTSP/RTMP/UDP) và URL/format cụ thể
- [ ] Đã cung cấp: ngưỡng cảnh báo khoảng cách (mét)
- [ ] Đã thực hiện calibrate focal length với camera thực tế đang dùng
- [ ] Đã xác định danh sách class cần theo dõi (mặc định: person, car, motorcycle, truck, bus)
- [ ] Đã xác định `MAX_ACCEPTABLE_DELAY` phù hợp với tốc độ bay UAV thực tế

