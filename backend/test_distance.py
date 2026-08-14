from pipeline import estimate_distance, severity
from settings_store import DEFAULTS

ALERT_THRESHOLD_M = DEFAULTS["alert_threshold_m"]
WARNING_THRESHOLD_M = DEFAULTS["warning_threshold_m"]


def test_estimate_distance_matches_calibration_point():
    # Đúng điểm calib (5m, bbox 340px cho person) phải trả về ~5.0m
    d = estimate_distance(340, "person")
    assert abs(d - 5.0) < 0.05, d


def test_estimate_distance_unknown_class_returns_none():
    assert estimate_distance(300, "bicycle") is None


def test_estimate_distance_zero_bbox_returns_none():
    assert estimate_distance(0, "person") is None


def test_severity_thresholds():
    assert severity(ALERT_THRESHOLD_M, ALERT_THRESHOLD_M, WARNING_THRESHOLD_M) == "red"
    assert severity(ALERT_THRESHOLD_M + 0.1, ALERT_THRESHOLD_M, WARNING_THRESHOLD_M) == "yellow"
    assert severity(WARNING_THRESHOLD_M, ALERT_THRESHOLD_M, WARNING_THRESHOLD_M) == "yellow"
    assert severity(WARNING_THRESHOLD_M + 0.1, ALERT_THRESHOLD_M, WARNING_THRESHOLD_M) == "green"
    assert severity(None, ALERT_THRESHOLD_M, WARNING_THRESHOLD_M) == "none"


if __name__ == "__main__":
    test_estimate_distance_matches_calibration_point()
    test_estimate_distance_unknown_class_returns_none()
    test_estimate_distance_zero_bbox_returns_none()
    test_severity_thresholds()
    print("OK")
