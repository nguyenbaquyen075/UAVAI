import hashlib
import math
import threading
import time
from collections import defaultdict, deque

# ponytail: GPS/pin/tốc độ/độ cao đều GIẢ LẬP (chưa nối MAVLink thật). Mỗi UAV
# có 1 "seed" suy từ id nên quỹ đạo/số liệu khác nhau mà không cần lưu state
# riêng — thay bằng đọc telemetry thật khi có UAV thật (Giai đoạn 3).
CENTER_LAT = 21.0285  # TODO: đổi theo khu vực tuần tra thật
CENTER_LON = 105.8542
RADIUS_DEG = 0.001
PERIOD_S = 60
BATTERY_CYCLE_S = 1800


def _seed(uav_id):
    return int(hashlib.md5(str(uav_id).encode()).hexdigest(), 16) % 1000


def simulate(uav_id):
    t = time.time()
    seed = _seed(uav_id)
    angle = ((t + seed) % PERIOD_S) / PERIOD_S * 2 * math.pi
    battery = round(max(8, 100 - (((t + seed) % BATTERY_CYCLE_S) / BATTERY_CYCLE_S) * 92), 1)
    return {
        "lat": CENTER_LAT + RADIUS_DEG * math.sin(angle) + seed * 2e-5,
        "lon": CENTER_LON + RADIUS_DEG * math.cos(angle) + seed * 2e-5,
        # hướng tiếp tuyến của quỹ đạo tròn giả lập — dùng làm heading UAV giả lập
        "heading_deg": round((math.degrees(angle) + 90) % 360, 1),
        "battery_pct": battery,
        "speed_kmh": round(30 + 15 * math.sin(angle * 2), 1),
        "altitude_m": round(100 + 20 * math.sin(angle * 3), 1),
        "signal": "Strong" if int(t + seed) % 20 < 15 else "Weak",
    }


def estimate_target_position(uav_lat, uav_lon, uav_heading_deg, bbox_center_x, frame_width, distance_m, fov_deg=60):
    """Ước tính toạ độ mục tiêu từ GPS+heading UAV (giả lập) + khoảng cách (thật, từ bbox)
    + độ lệch ngang của bbox trong khung hình (thật). Không có heading gimbal thật nên
    đây LUÔN LÀ SỐ ƯỚC TÍNH — hiển thị phải ghi rõ, không trình bày như toạ độ đo được.
    """
    offset_ratio = (bbox_center_x - frame_width / 2) / (frame_width / 2) if frame_width else 0
    bearing = (uav_heading_deg + offset_ratio * (fov_deg / 2)) % 360

    r = 6371000
    brng = math.radians(bearing)
    lat1 = math.radians(uav_lat)
    d_r = distance_m / r
    lat2 = math.asin(math.sin(lat1) * math.cos(d_r) + math.cos(lat1) * math.sin(d_r) * math.cos(brng))
    lon2 = math.radians(uav_lon) + math.atan2(
        math.sin(brng) * math.sin(d_r) * math.cos(lat1),
        math.cos(d_r) - math.sin(lat1) * math.sin(lat2),
    )
    return math.degrees(lat2), math.degrees(lon2), round(bearing, 1)


class TelemetryHub:
    """Nền: mỗi giây snapshot vị trí giả lập của mọi UAV trong fleet, giữ trail cho Map."""

    def __init__(self, get_uav_ids):
        self.get_uav_ids = get_uav_ids
        self.trails = defaultdict(lambda: deque(maxlen=500))
        self.running = True
        self.thread = threading.Thread(target=self._loop, daemon=True)

    def start(self):
        self.thread.start()

    def _loop(self):
        while self.running:
            for uav_id in self.get_uav_ids():
                self.trails[uav_id].append(simulate(uav_id))
            time.sleep(1)

    def position(self, uav_id):
        return simulate(uav_id)

    def get_trail(self, uav_id):
        return list(self.trails[uav_id])
