TARGET_CLASSES = {
    0: "person",
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck",
}

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
