# UAV Patrol — MVP (Giai đoạn 2)

Backend FastAPI (YOLOv8n + ByteTrack + ước lượng khoảng cách) + Frontend React (Live Monitoring).
Theo lộ trình Giai đoạn 2 của `03-kien-truc-tong-the-trien-khai.md`: chỉ màn Live Monitoring, test bằng video file (chưa cần UAV thật).

## Chạy backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

Đặt video test vào `backend/sample_video.mp4` — UAV_01 mặc định được tạo trỏ tới file này khi chạy lần đầu. Thêm UAV khác (nguồn video khác) ở trang "UAV" trong giao diện.

```bash
uvicorn main:app --reload --port 8001
```

Kiểm tra logic đo khoảng cách (không cần model/video):

```bash
python3 test_distance.py
```

## Chạy frontend

```bash
cd frontend
npm install
npm run dev
```

Mở http://localhost:5174

## Trước khi triển khai thật

- Calib lại `FOCAL_LENGTH` trong `backend/config.py` với camera UAV thực tế (Tài liệu 1 mục 4.2).
- Đổi `VIDEO_SOURCE` sang stream RTSP/RTMP/UDP thật.
- Điều chỉnh `ALERT_THRESHOLD_M` / `WARNING_THRESHOLD_M` / `MAX_ACCEPTABLE_DELAY` theo thực tế bay.

## Các trang trong dashboard

- **Tổng quan**: stat card (UAV/nhiệm vụ/mục tiêu/cảnh báo), video panel + crosshair overlay, panel trạng thái UAV đang chọn, điều khiển camera, mission card + mini-map, ticker cảnh báo
- **UAV**: danh sách UAV (thêm/xoá/chọn kích hoạt giám sát trực tiếp) — chỉ 1 UAV chạy YOLO detection thật tại 1 thời điểm vì ground station **CPU-only** (không GPU rời)
- **Nhiệm vụ**: tạo nhiệm vụ (tên, UAV, ưu tiên, mô tả, waypoint click trên bản đồ, hạn dự kiến), lọc/tìm kiếm/phân trang, chi tiết + tạm dừng/tiếp tục/huỷ, tiến độ (vòng tròn %), dòng thời gian sự kiện (cất cánh/đến điểm/cảnh báo)
- **Mục tiêu**: danh sách mục tiêu đã/đang phát hiện (không chỉ khung hình hiện tại — lưu SQLite, còn sau khi mục tiêu rời khung hình), lọc theo trạng thái/mức nguy hiểm, chi tiết + đánh dấu đã xác định/đã xử lý, ảnh liên quan, ghi chú, bản đồ vị trí ước tính, phân loại + mức nguy hiểm dạng donut chart, hoạt động gần đây
- **Giám sát trực tiếp**: video full-screen + cảnh báo trực tiếp + bộ đếm
- **Bản đồ**: vị trí UAV qua Leaflet
- **Cảnh báo**: log lưu SQLite (`backend/uav_patrol.db`), lọc theo loại/mức/thời gian, xem ảnh snapshot, export CSV
- **Cài đặt**: ngưỡng cảnh báo đỏ/vàng, ngưỡng bỏ frame trễ, bật/tắt class — lưu `backend/settings.json`, áp dụng ngay

## Dữ liệu nào là thật, dữ liệu nào đang giả lập

- **Thật**: detection/tracking/khoảng cách/cảnh báo của UAV đang active (gắn kèm uav_id để đối chiếu với nhiệm vụ/mục tiêu), log SQLite, snapshot ảnh, trạng thái/tạm dừng/huỷ nhiệm vụ, trạng thái xác định/xử lý mục tiêu, ghi chú
- **Tính theo lịch, không phải đo thật**: % tiến độ nhiệm vụ (thời gian trôi qua / kế hoạch, đóng băng khi tạm dừng), thời điểm "đến waypoint N" trong dòng thời gian (nội suy tuyến tính, không đối chiếu GPS thật), "Tổng thời gian bay" ở stat card (cộng dồn thời lượng kế hoạch của nhiệm vụ đã hoàn thành)
- **Ước tính (một phần thật + một phần giả lập)**: vị trí GPS của mục tiêu trên bản đồ "Mục tiêu" — kết hợp khoảng cách thật (từ bbox) + độ lệch ngang thật (bbox trong khung hình) với GPS/hướng bay UAV **giả lập** và FOV camera giả định (`config.CAMERA_FOV_DEG`) — không phải toạ độ đo được, chỉ mang tính minh hoạ cho đến khi có heading gimbal thật
- **Giả lập** (chưa nối UAV/MAVLink thật — `backend/telemetry.py`): GPS, hướng bay, pin, tốc độ, độ cao, tín hiệu của MỌI uav (kể cả uav active)
- **Chỉ là UI, chưa nối phần cứng**: nút điều khiển camera EO/IR, joystick pan/tilt/zoom, "Quay video" ở trang Tổng quan — riêng "Chụp ảnh" hoạt động thật (tải frame hiện tại)

## Chưa làm (đợt sau)

Telegram alert, đăng nhập/phân quyền nhiều người dùng, telemetry/MAVLink thật, điều khiển gimbal thật, chạy detection song song nhiều UAV (cần GPU), "Lịch nhiệm vụ" dạng calendar và "Mẫu nhiệm vụ" (template) ở trang Nhiệm vụ — trang tham khảo có 2 tab này nhưng chưa dựng, hiện chỉ có danh sách.
