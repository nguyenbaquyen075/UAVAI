import os
from pathlib import Path

# Tên class của model -> 5 loại mục tiêu của hệ thống. Model COCO (yolov8n.pt) và model train trên
# VisDrone (10 class góc nhìn drone) đều quy về cùng 5 loại, nên giao diện/cảnh báo/thống kê/DB
# không phải đổi gì khi thay model. Class không có ở đây (vd COCO "dog") bị bỏ qua.
CLASS_ALIASES = {
    # COCO
    "person": "person",
    "car": "car",
    "motorcycle": "motorcycle",
    "bus": "bus",
    "truck": "truck",
    # VisDrone
    "pedestrian": "person",
    "people": "person",
    "van": "car",
    "motor": "motorcycle",
    # ponytail: xe ba bánh gộp vào "motorcycle" (hiển thị "Xe máy") để giữ nguyên 5 loại. Xe đạp cố ý
    # không map (COCO cũng có "bicycle" — map sẽ đổi hành vi model cũ); thêm loại riêng khi cần.
    "tricycle": "motorcycle",
    "awning-tricycle": "motorcycle",
}


def model_class_map(model_names):
    """{class_id của model: tên loại hệ thống} từ model.names."""
    return {int(i): CLASS_ALIASES[n] for i, n in model_names.items() if n in CLASS_ALIASES}


# Model dùng để nhận diện: YOLO_MODEL=... nếu đặt, không thì ưu tiên model đã train trên VisDrone
# (training/README.md), cuối cùng mới về model COCO gốc.
_HERE = Path(__file__).parent
_VISDRONE_MODEL = _HERE / "models" / "visdrone_best.pt"
MODEL_PATH = os.environ.get("YOLO_MODEL") or (str(_VISDRONE_MODEL) if _VISDRONE_MODEL.exists() else "yolov8n.pt")

REFERENCE_SIZES = {
    "person": 1.7,
    "car": 1.5,
    "motorcycle": 1.2,
    "truck": 2.5,
    "bus": 3.0,
}

# Calibrate theo Tài liệu 1 mục 4.2 — giá trị mẫu, TODO: đo lại với camera UAV thật trước khi triển khai.
# Không cho chỉnh qua Settings UI vì đây là hằng số vật lý của camera, không phải tham số vận hành.
KNOWN_DISTANCE = 5.0
KNOWN_HEIGHT_REAL = 1.7
BBOX_HEIGHT_AT_KNOWN_DIST = 340
FOCAL_LENGTH = (BBOX_HEIGHT_AT_KNOWN_DIST * KNOWN_DISTANCE) / KNOWN_HEIGHT_REAL

# FOV ngang camera, dùng để ước tính vị trí mục tiêu trên bản đồ — giá trị giả định.
# TODO: đo FOV camera UAV thật rồi thay số này.
CAMERA_FOV_DEG = 60
