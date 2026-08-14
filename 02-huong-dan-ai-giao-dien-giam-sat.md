# Tài liệu 2: Hướng dẫn AI Xây dựng Giao diện Giám sát (Dashboard)

**Dự án:** Hệ thống UAV tuần tra — giao diện theo dõi và quản lý
**Mục tiêu:** Giao diện chuyên nghiệp, đầy đủ nghiệp vụ để người vận hành theo dõi real-time, xem lại lịch sử, chỉnh sửa cấu hình.

---

## 1. Lựa chọn công nghệ (phù hợp ngân sách, dễ triển khai)

| Thành phần | Đề xuất | Lý do |
|---|---|---|
| Backend | **FastAPI** (Python) | Nhẹ, dễ tích hợp trực tiếp với pipeline YOLOv8 đã viết bằng Python, hỗ trợ WebSocket cho real-time |
| Frontend | **React** (web-based) | Chạy trên trình duyệt, không cần cài đặt riêng cho từng máy vận hành, dễ mở rộng |
| Truyền dữ liệu real-time | **WebSocket** | Đẩy kết quả detection/khoảng cách/cảnh báo về giao diện ngay khi có, độ trễ thấp hơn polling |
| Video hiển thị | **MJPEG stream** qua HTTP endpoint, hoặc frame đã annotate gửi qua WebSocket dạng base64 | Đơn giản, không cần hạ tầng video streaming phức tạp/tốn kém |
| Lưu trữ log | **SQLite** (giai đoạn đầu, miễn phí) → nâng cấp PostgreSQL nếu mở rộng sau này | Tiết kiệm chi phí hạ tầng ban đầu |

> Nếu ưu tiên tốc độ phát triển hơn là web-based, có thể thay React bằng **PyQt/PySide** để làm ứng dụng desktop — phù hợp nếu chỉ cần chạy trên 1 máy ground station cố định, không cần truy cập từ xa.

---

## 2. Các màn hình / module nghiệp vụ cần có

### 2.1 Màn hình chính — Live Monitoring (Giám sát trực tiếp)
- Khung hiển thị video real-time có overlay: bounding box, tên class, khoảng cách ước lượng (mét), track ID
- Panel trạng thái kết nối UAV: đang kết nối / mất kết nối / độ trễ hiện tại (ms)
- Panel cảnh báo trực tiếp: hiện nổi bật (màu đỏ/vàng theo mức độ) khi có đối tượng vượt ngưỡng khoảng cách
- Bộ đếm nhanh: số người / số phương tiện đang phát hiện trong khung hình hiện tại

### 2.2 Bảng theo dõi đối tượng (Object Tracking Table)
- Danh sách các đối tượng đang được track (track ID, class, khoảng cách hiện tại, thời gian xuất hiện đầu tiên, trạng thái: bình thường/cảnh báo)
- Cập nhật real-time theo track ID (không tạo dòng mới liên tục cho cùng 1 đối tượng đang track)
- Cho phép click vào 1 dòng để xem lịch sử di chuyển/khoảng cách của đối tượng đó

### 2.3 Lịch sử & Nhật ký (History / Log Viewer)
- Bảng log tất cả sự kiện cảnh báo: thời gian, class, khoảng cách tại thời điểm cảnh báo, ảnh chụp frame (snapshot)
- Bộ lọc theo: khoảng thời gian, loại đối tượng, mức độ cảnh báo
- Chức năng export log (CSV/Excel) để báo cáo

### 2.4 Bản đồ giám sát (Map View) — nếu UAV có GPS
- Hiển thị vị trí UAV hiện tại trên bản đồ (dùng thư viện như Leaflet.js, miễn phí)
- Vẽ lộ trình tuần tra đã bay
- Đánh dấu vị trí ước lượng của các cảnh báo (nếu tính được tọa độ đối tượng từ GPS UAV + góc camera + khoảng cách)

### 2.5 Cấu hình hệ thống (Settings — phần "chỉnh sửa" quan trọng)
- Chỉnh ngưỡng cảnh báo khoảng cách (theo từng class nếu cần khác nhau)
- Chỉnh nguồn video (URL RTSP/RTMP/UDP)
- Bật/tắt class cần theo dõi (person, car, motorcycle, truck, bus...)
- Cấu hình kênh gửi cảnh báo (Telegram bot token, danh sách người nhận — đồng bộ cách làm với dự án PPE detection)
- Điều chỉnh `MAX_ACCEPTABLE_DELAY` (ngưỡng bỏ frame trễ)

### 2.6 Quản lý người dùng (nếu nhiều người vận hành)
- Đăng nhập cơ bản, phân quyền xem-only vs quyền chỉnh sửa cấu hình
- Có thể bỏ qua ở giai đoạn đầu nếu chỉ 1 người vận hành, thêm sau khi cần mở rộng

---

## 3. Luồng dữ liệu giữa Backend xử lý AI và Giao diện

```
[Pipeline YOLOv8 + Tracking + Distance]
        │
        ├── Frame đã annotate (ảnh) ──► WebSocket ──► Frontend hiển thị video
        │
        └── Kết quả detection (JSON: track_id, class, distance, timestamp)
                    │
                    ├──► WebSocket ──► Frontend cập nhật bảng tracking + cảnh báo
                    ├──► Lưu vào SQLite (nếu vượt ngưỡng cảnh báo) ──► Log Viewer
                    └──► Gửi Telegram/email nếu vượt ngưỡng
```

### Ví dụ format JSON gửi qua WebSocket

```json
{
  "timestamp": "2026-08-13T15:30:00Z",
  "objects": [
    {
      "track_id": 12,
      "class": "person",
      "distance_m": 8.4,
      "bbox": [340, 120, 410, 300],
      "alert": true
    },
    {
      "track_id": 15,
      "class": "car",
      "distance_m": 25.1,
      "bbox": [500, 200, 650, 320],
      "alert": false
    }
  ],
  "uav_status": {
    "connection": "ok",
    "latency_ms": 180
  }
}
```

---

## 4. Yêu cầu về mặt thiết kế UI (định hướng chuyên nghiệp)

- Bố cục dạng dashboard: video chiếm khu vực chính, panel cảnh báo và bảng tracking ở bên cạnh — không che khuất video
- Màu sắc cảnh báo rõ ràng: xanh (bình thường) / vàng (cảnh báo nhẹ) / đỏ (nguy hiểm) — nhất quán trên toàn bộ giao diện
- Hiển thị trạng thái kết nối UAV luôn ở vị trí dễ thấy (góc trên) — người vận hành cần biết ngay khi mất tín hiệu
- Responsive cơ bản nếu cần xem trên tablet tại hiện trường

---

## 5. Checklist khi giao việc này cho AI

- [ ] Đã chọn công nghệ frontend (web React hay desktop PyQt) — ảnh hưởng cách AI viết code
- [ ] Đã xác định có cần bản đồ GPS hay không (phụ thuộc UAV có GPS/telemetry hay không)
- [ ] Đã xác định có cần quản lý nhiều người dùng/phân quyền hay chỉ 1 người vận hành
- [ ] Đã có format dữ liệu JSON thống nhất giữa backend xử lý AI và giao diện (dùng mẫu ở mục 3)
- [ ] Đã xác định ngưỡng màu cảnh báo (vàng/đỏ ở khoảng cách bao nhiêu mét)

