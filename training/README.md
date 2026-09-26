# Train YOLO trên VisDrone

Mục tiêu: bắt người/xe **từ góc nhìn drone** chính xác hơn model COCO gốc (`yolov8n.pt`).
Giao diện (khung bắt mục tiêu, khoảng cách, cảnh báo) giữ nguyên: 10 class VisDrone được quy về
5 loại cũ trong `backend/config.py` (`CLASS_ALIASES`).

| VisDrone | Hệ thống |
|---|---|
| pedestrian, people | person (Người) |
| car, van | car (Ô tô) |
| motor, tricycle, awning-tricycle | motorcycle (Xe máy) |
| bus | bus |
| truck | truck |
| bicycle | bỏ qua (giống model cũ) |

## Train (khuyên dùng Google Colab — GPU miễn phí)

1. Mở [colab.research.google.com](https://colab.research.google.com) → File → Upload notebook → `train_visdrone_colab.ipynb`.
2. Runtime → Change runtime type → **T4 GPU** → Runtime → Run all. Cho phép truy cập Google Drive khi được hỏi.
3. Chờ ~4–5 giờ (100 epoch yolov8n). Bị ngắt thì Run all lại — tự train tiếp từ checkpoint trên Drive.
4. Ô cuối tự tải `visdrone_best.pt` về máy.

Không nên train trên Mac này: đo thực tế ~2,3 giờ/epoch trên CPU M1 → ~10 ngày cho 100 epoch, máy rất nóng.

Có máy GPU riêng thì chạy thẳng: `python train_visdrone.py` (tự copy model sang backend).
Kiểm tra nhanh quy trình trên CPU (vài phút, model không dùng thật): `python train_visdrone.py --smoke`.

## Dùng model

Chép `visdrone_best.pt` vào `backend/models/visdrone_best.pt` rồi khởi động lại backend — tự dùng model này.
Muốn quay về model cũ: xoá/đổi tên file đó, hoặc chạy backend với `YOLO_MODEL=yolov8n.pt`.
