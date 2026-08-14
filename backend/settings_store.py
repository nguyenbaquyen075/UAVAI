import json
import threading
from pathlib import Path

SETTINGS_PATH = Path(__file__).parent / "settings.json"

DEFAULTS = {
    "video_source": "sample_video.mp4",
    "enabled_classes": ["person", "car", "motorcycle", "bus", "truck"],
    "alert_threshold_m": 10.0,
    "warning_threshold_m": 15.0,
    "max_acceptable_delay": 0.3,
    # Thông tin hệ thống — chỉ hiển thị/mô tả, không ảnh hưởng pipeline, nhưng lưu thật vào settings.json
    "system_name": "UAV Control - Hệ thống quản lý UAV",
    "system_description": "Hệ thống giám sát và quản lý UAV phục vụ cho các nhiệm vụ giám sát, tuần tra, khảo sát.",
    "timezone": "UTC+07:00 Bangkok, Hanoi, Jakarta",
    "date_format": "DD/MM/YYYY",
    "time_format": "24h",
    "distance_unit": "m",
    "speed_unit": "km/h",
}


def _load():
    if SETTINGS_PATH.exists():
        with open(SETTINGS_PATH) as f:
            return {**DEFAULTS, **json.load(f)}
    return dict(DEFAULTS)


class SettingsStore:
    """Cấu hình runtime, chỉnh được qua Settings UI, lưu ra settings.json để giữ khi restart."""

    def __init__(self):
        self._lock = threading.Lock()
        self._data = _load()

    def get(self):
        with self._lock:
            return dict(self._data)

    def update(self, patch):
        with self._lock:
            for key in patch:
                if key in DEFAULTS:
                    self._data[key] = patch[key]
            with open(SETTINGS_PATH, "w") as f:
                json.dump(self._data, f, indent=2)
            return dict(self._data)


settings = SettingsStore()
