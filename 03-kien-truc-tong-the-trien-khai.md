# Tài liệu 3: Kiến trúc Tổng thể & Triển khai Hệ thống UAV Tuần tra

**Mục tiêu:** Tổng hợp toàn bộ hệ thống (Tài liệu 1: AI detection/khoảng cách + Tài liệu 2: giao diện) thành 1 bức tranh thống nhất, dùng làm ngữ cảnh chính khi giao việc cho AI phát triển từng phần.

---

## 1. Sơ đồ kiến trúc tổng thể

```
┌─────────────┐     Video (RTSP/RTMP/UDP)     ┌──────────────────────────────┐
│   UAV +     │ ─────────────────────────────► │      Ground Station          │
│  Camera FPV │        qua WiFi/4G             │                               │
└─────────────┘                                 │  ┌─────────────────────┐    │
                                                 │  │ LowLatencyVideoStream│   │
                                                 │  │  (chỉ lấy frame mới) │   │
                                                 │  └──────────┬──────────┘    │
                                                 │             │                │
                                                 │  ┌──────────▼──────────┐    │
                                                 │  │  YOLOv8 + ByteTrack  │    │
                                                 │  │  + Distance Estimate │    │
                                                 │  └──────────┬──────────┘    │
                                                 │             │                │
                                                 │  ┌──────────▼──────────┐    │
                                                 │  │   FastAPI Backend    │    │
                                                 │  │  (WebSocket + REST)  │    │
                                                 │  └──┬────────────────┬─┘    │
                                                 │     │                │       │
                                                 │  ┌──▼───┐      ┌────▼────┐  │
                                                 │  │SQLite│      │ Telegram│  │
                                                 │  │ Log  │      │  Alert  │  │
                                                 │  └──────┘      └─────────┘  │
                                                 │             │                │
                                                 │  ┌──────────▼──────────┐    │
                                                 │  │   React Dashboard    │    │
                                                 │  │  (Live view, table,  │    │
                                                 │  │   log, settings)     │    │
                                                 │  └──────────────────────┘   │
                                                 └──────────────────────────────┘
```

---

## 2. Danh sách tài liệu của dự án

| # | Tài liệu | Nội dung | File |
|---|---|---|---|
| 1 | Thiết lập YOLO & đo khoảng cách | Cấu hình model, tracking, ước lượng khoảng cách, xử lý luồng video low-latency | `01-huong-dan-ai-thiet-lap-yolo-khoang-cach.md` |
| 2 | Giao diện giám sát | Dashboard, các module nghiệp vụ, luồng dữ liệu backend-frontend | `02-huong-dan-ai-giao-dien-giam-sat.md` |
| 3 | Kiến trúc tổng thể & triển khai | Tài liệu này — bức tranh toàn hệ thống, thứ tự triển khai | `03-kien-truc-tong-the-trien-khai.md` |
| 4 | Đặc tả dự án gốc | Bảng câu hỏi chi tiết về bài toán, phần cứng, dữ liệu, ràng buộc | `tai-lieu-du-an-uav-giam-sat-nguoi-phuong-tien.md` (đã tạo trước đó) |

---

## 3. Nguyên tắc thiết kế xuyên suốt (áp dụng cho mọi phần)

1. **Ưu tiên chi phí thấp**: dùng thư viện/công cụ miễn phí hoặc mã nguồn mở (YOLOv8, FastAPI, React, SQLite, Leaflet.js) — tránh dịch vụ trả phí trừ khi thực sự cần
2. **Ưu tiên độ trễ thấp**: mọi tầng xử lý (đọc video, inference, truyền dữ liệu tới giao diện) đều áp dụng nguyên tắc "dữ liệu mới nhất thắng", không dồn queue
3. **Tách rời xử lý AI và giao diện**: backend AI (Tài liệu 1) hoạt động độc lập, giao tiếp với giao diện (Tài liệu 2) qua JSON chuẩn hóa — giúp có thể đổi frontend sau này mà không ảnh hưởng phần detection
4. **Đồng nhất với dự án PPE detection đã có**: dùng lại pattern ByteTrack, Telegram alert, cấu trúc code tương tự để tận dụng kinh nghiệm/code đã có sẵn

---

## 4. Thứ tự triển khai đề xuất (theo giai đoạn, phù hợp ngân sách)

### Giai đoạn 1 — Xác thực pipeline cơ bản (chi phí ~0, dùng thiết bị sẵn có)
- Test detection + tracking + distance estimation bằng webcam/điện thoại quay tay (theo Tài liệu 1)
- Chưa cần giao diện, chỉ cần `cv2.imshow` để kiểm tra độ chính xác

### Giai đoạn 2 — Backend + Giao diện tối thiểu (MVP)
- Dựng FastAPI backend nhận kết quả detection, đẩy qua WebSocket
- Dựng giao diện React tối thiểu: chỉ có Live Monitoring (mục 2.1 trong Tài liệu 2)
- Test với video giả lập (chưa cần UAV thật)

### Giai đoạn 3 — Tích hợp UAV thật
- Kết nối camera FPV thực tế trên UAV, test độ trễ thực tế ngoài trời
- Điều chỉnh `MAX_ACCEPTABLE_DELAY` và ngưỡng cảnh báo dựa trên dữ liệu thực tế

### Giai đoạn 4 — Hoàn thiện nghiệp vụ
- Thêm Log Viewer, Settings, Object Tracking Table (mục 2.2, 2.3, 2.5 trong Tài liệu 2)
- Thêm Map View nếu UAV có GPS

### Giai đoạn 5 — Mở rộng (nếu cần sau này)
- Quản lý người dùng/phân quyền
- Nâng cấp SQLite → PostgreSQL nếu dữ liệu lớn
- Cân nhắc xử lý on-board nếu ngân sách cho phép nâng cấp sau

---

## 5. Cách dùng bộ tài liệu này khi làm việc với AI

- Khi cần AI viết phần detection/khoảng cách → đưa **Tài liệu 1**
- Khi cần AI viết phần giao diện → đưa **Tài liệu 2**
- Khi cần AI hiểu bức tranh tổng thể hoặc quyết định thứ tự làm gì trước → đưa **Tài liệu 3** (tài liệu này)
- Khi bắt đầu 1 tính năng hoàn toàn mới, chưa rõ yêu cầu → đưa **Tài liệu đặc tả gốc** để điền thêm thông tin còn thiếu trước khi code

