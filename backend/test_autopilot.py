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


if __name__ == "__main__":
    n = 0
    for k, f in list(globals().items()):
        if k.startswith("test_"):
            f(); n += 1
    print(n, "tests passed")
