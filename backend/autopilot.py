"""Chế độ AI tự lái tuần tra — bộ điều khiển bay GIẢ LẬP.

Mỗi UAV bật tự lái có 1 máy trạng thái:
    patrol      bay lần lượt các điểm của lộ trình nhiệm vụ, hết thì lặp lại
    investigate AI báo mục tiêu nguy hiểm -> bay tới, bay vòng quan sát, hết giờ thì về lại lộ trình
    rtb         về căn cứ (pin yếu hoặc người giám sát ra lệnh) rồi hạ cánh
    landed      đã hạ cánh ở căn cứ; đang sạc — đủ pin thì tự cất cánh tuần tra tiếp (nếu về vì pin yếu)
    hold        người giám sát tạm dừng: đứng yên giữ độ cao

Vị trí/pin/độ cao do module này tính (thay cho quỹ đạo tròn giả lập trong telemetry.py).
ponytail: vật lý đơn giản (bay thẳng tốc độ đều, mặt đất phẳng, không gió). Khi có UAV thật: giữ
nguyên máy trạng thái, thay phần _move/tick bằng lệnh MAVLink (goto/orbit/RTL) + đọc telemetry thật.
Trạng thái nằm trong RAM — khởi động lại backend thì UAV về chế độ điều khiển tay.
"""

import math
import threading
import time
from collections import deque

BASE = (21.0285, 105.8542)  # căn cứ, trùng tâm bản đồ các trang khác

CRUISE_MPS = 12.0            # ~43 km/h
CLIMB_MPS = 3.0
PATROL_ALT_M = 100.0
WAYPOINT_REACHED_M = 15.0
ORBIT_RADIUS_M = 60.0
INVESTIGATE_S = 45.0
THREAT_COOLDOWN_S = 60.0     # không quay lại soi cùng 1 chỗ liên tục
THREAT_SAME_SPOT_M = 150.0
GEOFENCE_MARGIN_M = 300.0    # mục tiêu ngoài vùng tuần tra + biên này: chỉ báo, không bay tới
RTB_BATTERY = 25.0           # dưới mức này tự về căn cứ, ưu tiên hơn mọi chế độ khác
RESUME_BATTERY = 95.0
MIN_START_BATTERY = RTB_BATTERY + 5  # thấp hơn thì vừa bật đã phải quay về -> từ chối ngay cho rõ
DRAIN_PCT_PER_S = 0.08       # ~17 phút bay từ 100% xuống 20%
CHARGE_PCT_PER_S = 0.5
TICK_S = 0.5

MODE_LABEL = {
    "patrol": "Đang tuần tra",
    "investigate": "Quan sát mục tiêu",
    "rtb": "Đang về căn cứ",
    "landed": "Đã hạ cánh",
    "hold": "Tạm dừng",
}


def _m_per_deg(lat):
    return 111_320.0, 111_320.0 * math.cos(math.radians(lat))


def distance_m(a, b):
    my, mx = _m_per_deg((a[0] + b[0]) / 2)
    return math.hypot((b[0] - a[0]) * my, (b[1] - a[1]) * mx)


def _offset(p, dx_m, dy_m):
    my, mx = _m_per_deg(p[0])
    return (p[0] + dy_m / my, p[1] + dx_m / mx)


class UavAutopilot:
    def __init__(self, uav_id, route, start, battery, mission_id=None, altitude_m=PATROL_ALT_M, speed_mps=CRUISE_MPS,
                 on_finish="loop", start_alt=0.0, route_kind="draw"):
        self.uav_id = uav_id
        self.route_kind = route_kind  # "draw" vẽ tay | "sweep" quét vùng đan chéo | "mission" theo nhiệm vụ
        self.on_finish = on_finish  # "loop": lặp lại lộ trình | "rtb": bay hết 1 lượt rồi về căn cứ
        self.route = [tuple(p) for p in route]
        self.mission_id = mission_id
        self.pos = tuple(start)
        self.alt = start_alt  # đổi đường khi đang bay thì giữ nguyên độ cao hiện tại
        self.target_alt = altitude_m
        self.speed = speed_mps
        self.heading = 0.0
        self.battery = battery
        self.mode = "patrol"
        self.wp = 0
        self.laps = 0
        self.investigation = None       # {"center", "until", "angle", "orbiting"}
        self.resume_after_charge = False
        self.recent_threats = deque(maxlen=20)  # (thời điểm, vị trí) đã soi
        self.events = deque(maxlen=50)
        self._geofence = self._make_geofence()
        self.log("start", f"Bật tự lái, {len(self.route)} điểm, hết đường thì " + ("lặp lại" if on_finish == "loop" else "về căn cứ"))

    # --- tiện ích ---
    def log(self, kind, text):
        self.events.appendleft({"time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "kind": kind, "text": text})

    def _make_geofence(self):
        lats = [p[0] for p in self.route]
        lons = [p[1] for p in self.route]
        lo = _offset((min(lats), min(lons)), -GEOFENCE_MARGIN_M, -GEOFENCE_MARGIN_M)
        hi = _offset((max(lats), max(lons)), GEOFENCE_MARGIN_M, GEOFENCE_MARGIN_M)
        return (lo, hi)

    def in_geofence(self, p):
        (lat0, lon0), (lat1, lon1) = self._geofence
        return lat0 <= p[0] <= lat1 and lon0 <= p[1] <= lon1

    @property
    def flying(self):
        return self.mode != "landed"

    def _move_towards(self, dest, dt):
        """Bay thẳng tới dest; trả về khoảng cách còn lại (m)."""
        d = distance_m(self.pos, dest)
        if d < 1e-6:
            return 0.0
        my, mx = _m_per_deg(self.pos[0])
        dy, dx = (dest[0] - self.pos[0]) * my, (dest[1] - self.pos[1]) * mx
        self.heading = (math.degrees(math.atan2(dx, dy)) + 360) % 360
        step = min(d, self.speed * dt)
        self.pos = _offset(self.pos, dx / d * step, dy / d * step)
        return d - step

    # --- sự kiện từ ngoài ---
    def report_threat(self, target, label="mục tiêu"):
        """AI phát hiện mục tiêu nguy hiểm tại target=(lat, lon)."""
        now = time.time()
        if self.mode in ("rtb", "landed", "hold"):
            return False  # đang về/đang sạc/đang bị người giám sát giữ -> chỉ cảnh báo, không đổi hướng
        if self.mode == "investigate":
            return False
        if any(now - t < THREAT_COOLDOWN_S and distance_m(p, target) < THREAT_SAME_SPOT_M for t, p in self.recent_threats):
            return False
        if not self.in_geofence(target):
            self.log("ignored", f"Phát hiện {label} ngoài vùng tuần tra — chỉ ghi cảnh báo")
            self.recent_threats.append((now, tuple(target)))
            return False
        self.recent_threats.append((now, tuple(target)))
        self.investigation = {"center": tuple(target), "until": None, "angle": 0.0}
        self.mode = "investigate"
        self.log("threat", f"AI phát hiện {label} nguy hiểm — rời lộ trình tới quan sát")
        return True

    def command(self, action):
        if action == "pause" and self.flying:
            self.mode = "hold"
            self.investigation = None  # lệnh người giám sát huỷ việc đang quan sát
            self.log("operator", "Người giám sát: tạm dừng, giữ vị trí")
        elif action == "resume" and self.mode in ("hold", "landed"):
            if self.mode == "landed" and self.battery < RTB_BATTERY + 5:
                raise ValueError(f"Pin mới {self.battery:.0f}%, chưa đủ để cất cánh")
            self.mode = "patrol"
            self.resume_after_charge = False
            self.log("operator", "Người giám sát: tiếp tục tuần tra")
        elif action == "rtb" and self.flying:
            self.mode = "rtb"
            self.investigation = None
            self.resume_after_charge = False
            self.log("operator", "Người giám sát: về căn cứ")
        else:
            raise ValueError(f"Không thực hiện được lệnh '{action}' khi đang ở chế độ {MODE_LABEL[self.mode]}")

    # --- vòng điều khiển ---
    def tick(self, dt):
        # pin
        if self.flying:
            self.battery = max(0.0, self.battery - DRAIN_PCT_PER_S * dt)
        else:
            self.battery = min(100.0, self.battery + CHARGE_PCT_PER_S * dt)

        # an toàn trước hết: pin yếu -> về căn cứ, đè mọi chế độ khác
        if self.flying and self.mode != "rtb" and self.battery < RTB_BATTERY:
            self.mode = "rtb"
            self.resume_after_charge = True
            self.investigation = None
            self.log("battery", f"Pin còn {self.battery:.0f}% — tự về căn cứ sạc")

        # độ cao
        want_alt = 0.0 if (self.mode == "rtb" and distance_m(self.pos, BASE) < 10) or self.mode == "landed" else self.target_alt
        if abs(self.alt - want_alt) > 0.01:
            self.alt += max(-CLIMB_MPS * dt, min(CLIMB_MPS * dt, want_alt - self.alt))

        if self.mode == "patrol":
            if self._move_towards(self.route[self.wp], dt) < WAYPOINT_REACHED_M:
                self.wp = (self.wp + 1) % len(self.route)
                if self.wp == 0:
                    self.laps += 1
                    if self.on_finish == "rtb":
                        self.mode = "rtb"
                        self.resume_after_charge = False
                        self.log("done", "Đã bay hết đường — về căn cứ")
                    else:
                        self.log("lap", f"Hoàn thành vòng tuần tra thứ {self.laps}")

        elif self.mode == "investigate":
            inv = self.investigation
            center = inv["center"]
            if inv["until"] is None:  # đang bay tới mép vòng quan sát
                if distance_m(self.pos, center) <= ORBIT_RADIUS_M + 5:
                    my, mx = _m_per_deg(center[0])
                    inv["angle"] = math.atan2((self.pos[0] - center[0]) * my, (self.pos[1] - center[1]) * mx)
                    inv["until"] = time.time() + INVESTIGATE_S
                    self.log("orbit", f"Bắt đầu bay vòng quan sát {int(INVESTIGATE_S)} giây")
                else:
                    self._move_towards(center, dt)
            else:
                inv["angle"] += self.speed / ORBIT_RADIUS_M * dt
                prev = self.pos
                self.pos = _offset(center, ORBIT_RADIUS_M * math.cos(inv["angle"]), ORBIT_RADIUS_M * math.sin(inv["angle"]))
                my, mx = _m_per_deg(prev[0])
                self.heading = (math.degrees(math.atan2((self.pos[1] - prev[1]) * mx, (self.pos[0] - prev[0]) * my)) + 360) % 360
                if time.time() >= inv["until"]:
                    self.mode = "patrol"
                    self.investigation = None
                    self.recent_threats.append((time.time(), center))  # thời gian nghỉ tính từ lúc quan sát xong
                    self.log("resume", "Quan sát xong — quay lại lộ trình tuần tra")

        elif self.mode == "rtb":
            remaining = self._move_towards(BASE, dt)
            if remaining < 1 and self.alt <= 0.5:
                self.alt = 0.0
                self.mode = "landed"
                self.log("landed", "Đã hạ cánh tại căn cứ" + (" — đang sạc, đủ pin sẽ tự tuần tra tiếp" if self.resume_after_charge else ""))

        elif self.mode == "landed":
            if self.resume_after_charge and self.battery >= RESUME_BATTERY:
                self.mode = "patrol"
                self.resume_after_charge = False
                self.log("takeoff", "Đã sạc đủ — tự cất cánh tuần tra tiếp")

    def telemetry(self):
        return {
            "lat": self.pos[0],
            "lon": self.pos[1],
            "heading_deg": round(self.heading, 1),
            "battery_pct": round(self.battery, 1),
            "speed_kmh": round(self.speed * 3.6, 1) if self.flying and self.mode != "hold" else 0.0,
            "altitude_m": round(self.alt, 1),
            "signal": "Strong",
        }

    def state(self):
        return {
            "uav_id": self.uav_id,
            "mission_id": self.mission_id,
            "on_finish": self.on_finish,
            "route_kind": self.route_kind,
            "mode": self.mode,
            "mode_label": MODE_LABEL[self.mode],
            "waypoint_index": self.wp,
            "waypoint_total": len(self.route),
            "laps": self.laps,
            "route": [{"lat": p[0], "lon": p[1]} for p in self.route],
            "geofence": [{"lat": p[0], "lon": p[1]} for p in self._geofence],
            "investigation": (
                {"lat": self.investigation["center"][0], "lon": self.investigation["center"][1], "radius_m": ORBIT_RADIUS_M,
                 "seconds_left": max(0, round(self.investigation["until"] - time.time())) if self.investigation["until"] else None}
                if self.investigation else None
            ),
            "resume_after_charge": self.resume_after_charge,
            "telemetry": self.telemetry(),
            "events": list(self.events),
        }


class Autopilot:
    """Quản lý tự lái cho cả đội UAV + luồng tick nền."""

    def __init__(self, on_mode_change=None):
        self.lock = threading.Lock()
        self.uavs = {}
        self.on_mode_change = on_mode_change  # (uav_id, mode) -> cập nhật trạng thái UAV trong DB
        self._modes = {}
        self.running = True
        threading.Thread(target=self._loop, daemon=True).start()

    def start(self, uav_id, route, start_pos, battery, mission_id=None, altitude_m=PATROL_ALT_M, speed_kmh=None, on_finish="loop",
              route_kind="draw"):
        if len(route) < 2:
            raise ValueError("Lộ trình cần ít nhất 2 điểm")
        if on_finish not in ("loop", "rtb"):
            raise ValueError("on_finish phải là 'loop' hoặc 'rtb'")
        if battery < MIN_START_BATTERY:
            raise ValueError(f"Pin chỉ còn {battery:.0f}% — cần từ {MIN_START_BATTERY:.0f}% trở lên để bắt đầu tự lái (sạc hoặc điều khiển tay)")
        speed = (float(speed_kmh) / 3.6) if speed_kmh else CRUISE_MPS
        with self.lock:
            prev = self.uavs.get(uav_id)
            # đang tự lái mà đổi đường: bay tiếp từ vị trí/độ cao hiện tại, giữ nhật ký cũ
            start_alt = prev.alt if prev and prev.flying else 0.0
            ap = UavAutopilot(uav_id, route, start_pos, battery, mission_id, altitude_m, speed, on_finish, start_alt, route_kind)
            if prev:
                ap.events.extend(list(prev.events)[: ap.events.maxlen - 1])
            self.uavs[uav_id] = ap
        self._notify(uav_id)

    def stop(self, uav_id):
        with self.lock:
            ap = self.uavs.pop(uav_id, None)
        if ap and self.on_mode_change:
            self._modes.pop(uav_id, None)
            self.on_mode_change(uav_id, None)
        return ap

    def command(self, uav_id, action):
        with self.lock:
            ap = self.uavs.get(uav_id)
            if ap is None:
                raise KeyError(uav_id)
            ap.command(action)
        self._notify(uav_id)

    def report_threat(self, uav_id, target, label="mục tiêu"):
        with self.lock:
            ap = self.uavs.get(uav_id)
            return ap.report_threat(target, label) if ap else False

    def telemetry(self, uav_id):
        with self.lock:
            ap = self.uavs.get(uav_id)
            return ap.telemetry() if ap else None

    def get(self, uav_id):
        with self.lock:
            ap = self.uavs.get(uav_id)
            return ap.state() if ap else None

    def all_states(self):
        with self.lock:
            return {uid: ap.state() for uid, ap in self.uavs.items()}

    def _notify(self, uav_id):
        with self.lock:
            ap = self.uavs.get(uav_id)
            mode = ap.mode if ap else None
        if self.on_mode_change and self._modes.get(uav_id) != mode:
            self._modes[uav_id] = mode
            self.on_mode_change(uav_id, mode)

    def _loop(self):
        last = time.time()
        while self.running:
            time.sleep(TICK_S)
            now = time.time()
            dt, last = now - last, now
            with self.lock:
                ids = list(self.uavs)
                for ap in self.uavs.values():
                    ap.tick(dt)
            for uid in ids:
                self._notify(uid)
