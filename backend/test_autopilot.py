import time as real_time

import autopilot as ap_mod
from autopilot import BASE, UavAutopilot, distance_m

ROUTE = [(21.030, 105.850), (21.031, 105.852), (21.029, 105.854)]


class FakeClock:
    """Đồng hồ giả để tua nhanh (quan sát 45 giây, sạc pin...) mà không phải chờ thật."""
    def __init__(self):
        self.now = 1_000_000.0
    def time(self):
        return self.now
    gmtime = staticmethod(real_time.gmtime)
    strftime = staticmethod(real_time.strftime)


def run(ap, seconds, clock, dt=0.5):
    for _ in range(int(seconds / dt)):
        clock.now += dt
        ap.tick(dt)


def make(battery=100.0):
    clock = FakeClock()
    ap_mod.time = clock
    return UavAutopilot(1, ROUTE, BASE, battery), clock


def test_patrols_route_in_loop():
    ap, clock = make()
    run(ap, 200, clock)
    assert ap.mode == "patrol" and ap.alt > 90
    assert ap.laps >= 1  # đã đi hết lộ trình ít nhất 1 vòng


def test_threat_orbit_then_resume():
    ap, clock = make()
    run(ap, 60, clock)
    target = (21.0305, 105.8525)
    assert ap.report_threat(target, "người")
    assert ap.mode == "investigate"
    run(ap, 30, clock)  # bay tới + đang vòng quan sát
    assert abs(distance_m(ap.pos, target) - ap_mod.ORBIT_RADIUS_M) < 2
    assert not ap.report_threat(target)  # đang quan sát -> bỏ qua báo trùng
    run(ap, ap_mod.INVESTIGATE_S + 5, clock)
    assert ap.mode == "patrol"
    assert not ap.report_threat(target)  # cùng chỗ trong thời gian nghỉ -> không soi lại


def test_threat_outside_geofence_only_logged():
    ap, clock = make()
    far = (21.10, 105.95)  # cách vùng tuần tra ~10 km
    assert not ap.report_threat(far)
    assert ap.mode == "patrol" and ap.events[0]["kind"] == "ignored"


def test_low_battery_returns_home_charges_and_resumes():
    ap, clock = make(battery=ap_mod.RTB_BATTERY + 1)
    run(ap, 30, clock)
    assert ap.mode == "rtb" and ap.resume_after_charge
    assert not ap.report_threat((21.0305, 105.8525))  # đang về vì pin yếu -> không đi soi
    run(ap, 60, clock)
    assert ap.mode == "landed" and ap.alt == 0 and distance_m(ap.pos, BASE) < 1
    run(ap, 60, clock)
    assert ap.mode == "landed"  # chưa đủ 95% -> vẫn nằm sạc
    run(ap, 120, clock)  # sạc 0.5%/s -> đủ pin
    assert ap.mode == "patrol" and not ap.resume_after_charge


def test_operator_commands():
    ap, clock = make()
    run(ap, 20, clock)
    ap.command("pause")
    pos = ap.pos
    run(ap, 20, clock)
    assert ap.mode == "hold" and distance_m(pos, ap.pos) < 0.01 and ap.telemetry()["speed_kmh"] == 0
    ap.command("resume")
    assert ap.mode == "patrol"
    ap.command("rtb")
    assert ap.mode == "rtb" and not ap.resume_after_charge  # về theo lệnh -> không tự bay lại
    try:
        ap.command("resume")
        assert False, "resume khi đang rtb phải bị từ chối"
    except ValueError:
        pass


def test_operator_pause_cancels_investigation():
    ap, clock = make()
    run(ap, 60, clock)
    assert ap.report_threat((21.0305, 105.8525))
    ap.command("pause")
    assert ap.investigation is None and ap.state()["investigation"] is None
    ap.command("resume")
    assert ap.mode == "patrol" and ap.investigation is None


def test_one_way_route_returns_home_at_end():
    clock = FakeClock()
    ap_mod.time = clock
    ap = UavAutopilot(1, ROUTE, ROUTE[0], 100.0, on_finish="rtb")
    run(ap, 200, clock)
    assert ap.laps == 1 and ap.mode in ("rtb", "landed") and not ap.resume_after_charge
    run(ap, 300, clock)
    assert ap.mode == "landed"  # về theo kế hoạch -> không tự cất cánh lại


def test_reroute_while_flying_keeps_altitude_and_log():
    clock = FakeClock()
    ap_mod.time = clock
    pilot = ap_mod.Autopilot.__new__(ap_mod.Autopilot)  # không chạy luồng nền
    pilot.lock, pilot.uavs, pilot.on_mode_change, pilot._modes = ap_mod.threading.Lock(), {}, None, {}
    pilot.start(1, ROUTE, BASE, 100.0)
    run(pilot.uavs[1], 60, clock)
    alt = pilot.uavs[1].alt
    new_route = [(21.026, 105.856), (21.027, 105.858)]
    pilot.start(1, new_route, pilot.uavs[1].pos, 90.0)
    ap = pilot.uavs[1]
    assert ap.route == new_route and ap.alt == alt and ap.mode == "patrol"
    assert len(ap.events) >= 2  # nhật ký cũ được giữ


def test_refuses_start_with_low_battery():
    pilot = ap_mod.Autopilot.__new__(ap_mod.Autopilot)
    pilot.lock, pilot.uavs, pilot.on_mode_change, pilot._modes = ap_mod.threading.Lock(), {}, None, {}
    try:
        pilot.start(1, ROUTE, BASE, ap_mod.MIN_START_BATTERY - 1)
        assert False, "phải từ chối khi pin thấp"
    except ValueError as e:
        assert "Pin chỉ còn" in str(e)
    assert 1 not in pilot.uavs


if __name__ == "__main__":
    n = 0
    for k, f in list(globals().items()):
        if k.startswith("test_"):
            f(); n += 1
    print(n, "tests passed")
