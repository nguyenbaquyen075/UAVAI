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
