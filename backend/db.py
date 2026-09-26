import csv
import io
import json
import sqlite3
import time
from pathlib import Path

DB_PATH = Path(__file__).parent / "uav_patrol.db"

LOG_FIELDS = ["id", "timestamp", "track_id", "class", "distance_m", "severity", "uav_id"]


def _now():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS alert_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            track_id INTEGER,
            class TEXT,
            distance_m REAL,
            severity TEXT,
            uav_id INTEGER,
            snapshot BLOB
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS uavs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            video_source TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'ready',
            type TEXT NOT NULL DEFAULT '',
            serial TEXT NOT NULL DEFAULT '',
            zone TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            flying_since TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS missions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL DEFAULT '',
            name TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            uav_id INTEGER NOT NULL,
            waypoints TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            priority TEXT NOT NULL DEFAULT 'medium',
            notes TEXT NOT NULL DEFAULT '',
            target_count INTEGER DEFAULT 0,
            area_size TEXT DEFAULT '',
            creator TEXT DEFAULT 'admin',
            started_at TEXT NOT NULL,
            expected_end_at TEXT NOT NULL,
            created_at TEXT NOT NULL,
            frozen_pct REAL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS targets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            track_id INTEGER NOT NULL,
            uav_id INTEGER NOT NULL,
            class TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'new',
            threat_level TEXT NOT NULL DEFAULT 'low',
            distance_m REAL,
            lat REAL,
            lon REAL,
            heading_deg REAL,
            first_seen TEXT NOT NULL,
            last_seen TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS target_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            label TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS target_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            target_id INTEGER NOT NULL,
            author TEXT NOT NULL,
            text TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS pois (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT '',
            lat REAL NOT NULL,
            lon REAL NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL DEFAULT '',
            tags TEXT NOT NULL DEFAULT '[]',
            uav_id INTEGER,
            mission_id INTEGER,
            starred INTEGER NOT NULL DEFAULT 0,
            author TEXT NOT NULL DEFAULT 'admin',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    # Migration checks for columns
    cols = [c[1] for c in conn.execute("PRAGMA table_info(missions)").fetchall()]
    if "code" not in cols:
        conn.execute("ALTER TABLE missions ADD COLUMN code TEXT DEFAULT ''")
    if "target_count" not in cols:
        conn.execute("ALTER TABLE missions ADD COLUMN target_count INTEGER DEFAULT 0")
    if "area_size" not in cols:
        conn.execute("ALTER TABLE missions ADD COLUMN area_size TEXT DEFAULT ''")
    if "creator" not in cols:
        conn.execute("ALTER TABLE missions ADD COLUMN creator TEXT DEFAULT 'admin'")

    m_count = conn.execute("SELECT COUNT(*) FROM missions").fetchone()[0]
    if m_count == 0:
        now_ts = time.time()
        def iso(ts):
            return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(ts))

        seed_missions = [
            ("MSN_20240513_001", "Tuần tra khu vực biên giới A", "Tuần tra và theo dõi các mục tiêu nghi vấn trong khu vực biên giới A", 2, json.dumps([{"lat": 21.028, "lon": 105.854}, {"lat": 21.031, "lon": 105.857}, {"lat": 21.033, "lon": 105.852}, {"lat": 21.030, "lon": 105.849}, {"lat": 21.026, "lon": 105.851}, {"lat": 21.025, "lon": 105.853}]), "active", "high", "", 6, "Khu vực A (12.5 km²)", "admin", iso(now_ts - 2700), iso(now_ts + 900), _now()),
            ("MSN_20240513_002", "Giám sát khu công nghiệp", "Giám sát an ninh và rà soát khu vực kho xưởng", 1, json.dumps([{"lat": 21.025, "lon": 105.850}, {"lat": 21.028, "lon": 105.852}, {"lat": 21.027, "lon": 105.855}]), "active", "medium", "", 4, "Khu CN Biên Hòa (8.2 km²)", "admin", iso(now_ts - 1620), iso(now_ts + 1980), _now()),
            ("MSN_20240512_008", "Tìm kiếm cứu nạn khu vực B", "Tìm kiếm và hỗ trợ nạn nhân vùng thiên tai", 3, json.dumps([{"lat": 21.032, "lon": 105.848}, {"lat": 21.035, "lon": 105.851}]), "completed", "high", "", 8, "Rừng Nam Cát Tiên (15.0 km²)", "admin", iso(now_ts - 86400), iso(now_ts - 81000), _now()),
            ("MSN_20240512_007", "Kiểm tra đường ống dẫn dầu", "Kiểm tra sự cố rò rỉ nhiệt đường ống 01", 4, json.dumps([{"lat": 21.020, "lon": 105.840}, {"lat": 21.022, "lon": 105.845}]), "completed", "low", "", 5, "Tuyến đường ống 01 (20 km)", "admin", iso(now_ts - 95000), iso(now_ts - 90000), _now()),
            ("MSN_20240511_006", "Giám sát cháy rừng", "Cảnh báo khói và nguy cơ ngọn lửa phát tán", 5, json.dumps([{"lat": 21.036, "lon": 105.860}, {"lat": 21.038, "lon": 105.863}]), "failed", "high", "", 3, "Khu bảo tồn C (10.0 km²)", "admin", iso(now_ts - 172800), iso(now_ts - 168000), _now()),
            ("MSN_20240511_005", "Tuần tra ven biển", "Giám sát mật độ giao thông đường thủy ven bờ", 1, json.dumps([{"lat": 21.015, "lon": 105.860}, {"lat": 21.018, "lon": 105.865}]), "completed", "medium", "", 7, "Vùng biển A2 (30.0 km²)", "admin", iso(now_ts - 180000), iso(now_ts - 174000), _now()),
        ]
        for m in seed_missions:
            conn.execute(
                "INSERT INTO missions (code, name, description, uav_id, waypoints, status, priority, notes, target_count, area_size, creator, started_at, expected_end_at, created_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                m
            )
        # Set frozen_pct=30 for failed mission
        conn.execute("UPDATE missions SET frozen_pct = 30 WHERE code = 'MSN_20240511_006'")
    conn.commit()
    conn.close()


def list_uavs():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM uavs ORDER BY id").fetchall()
    conn.close()
    return [dict(r) for r in rows]


UAV_EDITABLE_FIELDS = ("name", "video_source", "status", "type", "serial", "zone", "flying_since")


def create_uav(name, video_source, status="ready", type_="", serial="", zone=""):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.execute(
        "INSERT INTO uavs (name, video_source, status, type, serial, zone, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (name, video_source, status, type_, serial, zone, _now()),
    )
    conn.commit()
    uav_id = cur.lastrowid
    conn.close()
    return uav_id


def update_uav(uav_id, patch):
    fields = {k: v for k, v in patch.items() if k in UAV_EDITABLE_FIELDS}
    if not fields:
        return
    conn = sqlite3.connect(DB_PATH)
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    conn.execute(f"UPDATE uavs SET {set_clause} WHERE id = ?", (*fields.values(), uav_id))
    conn.commit()
    conn.close()


def delete_uav(uav_id):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM uavs WHERE id = ?", (uav_id,))
    conn.commit()
    conn.close()


def list_missions():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM missions ORDER BY id DESC").fetchall()
    conn.close()
    missions = [dict(r) for r in rows]
    for m in missions:
        m["waypoints"] = json.loads(m["waypoints"])
    return missions


def create_mission(name, uav_id, waypoints, started_at, expected_end_at, description="", priority="medium", notes=""):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.execute(
        "INSERT INTO missions (name, description, uav_id, waypoints, priority, notes, started_at, expected_end_at, created_at) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (name, description, uav_id, json.dumps(waypoints), priority, notes, started_at, expected_end_at, _now()),
    )
    conn.commit()
    mission_id = cur.lastrowid
    conn.close()
    return mission_id


MISSION_EDITABLE_FIELDS = ("name", "description", "status", "priority", "notes", "frozen_pct", "uav_id", "expected_end_at", "waypoints")


def update_mission(mission_id, patch):
    fields = {k: v for k, v in patch.items() if k in MISSION_EDITABLE_FIELDS}
    if "waypoints" in fields:
        fields["waypoints"] = json.dumps(fields["waypoints"])
    if not fields:
        return
    conn = sqlite3.connect(DB_PATH)
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    conn.execute(f"UPDATE missions SET {set_clause} WHERE id = ?", (*fields.values(), mission_id))
    conn.commit()
    conn.close()


def update_mission_status(mission_id, status):
    update_mission(mission_id, {"status": status})


def delete_mission(mission_id):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM missions WHERE id = ?", (mission_id,))
    conn.commit()
    conn.close()


def insert_alert(timestamp, track_id, class_name, distance_m, severity, uav_id, snapshot_jpeg):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT INTO alert_events (timestamp, track_id, class, distance_m, severity, uav_id, snapshot) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (timestamp, track_id, class_name, distance_m, severity, uav_id, snapshot_jpeg),
    )
    conn.commit()
    conn.close()


def query_logs(start=None, end=None, class_=None, severity=None, uav_id=None):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    q = f"SELECT {', '.join(LOG_FIELDS)} FROM alert_events WHERE 1=1"
    params = []
    if start:
        q += " AND timestamp >= ?"
        params.append(start)
    if end:
        q += " AND timestamp <= ?"
        params.append(end)
    if class_:
        q += " AND class = ?"
        params.append(class_)
    if severity:
        q += " AND severity = ?"
        params.append(severity)
    if uav_id is not None:
        q += " AND uav_id = ?"
        params.append(uav_id)
    q += " ORDER BY id DESC LIMIT 500"
    rows = conn.execute(q, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def logs_to_csv(start=None, end=None, class_=None, severity=None):
    rows = query_logs(start, end, class_, severity)
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=LOG_FIELDS)
    writer.writeheader()
    writer.writerows(rows)
    return buf.getvalue()


def get_snapshot(event_id):
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute("SELECT snapshot FROM alert_events WHERE id = ?", (event_id,)).fetchone()
    conn.close()
    return row[0] if row else None


# --- Targets ---

def list_targets():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM targets ORDER BY last_seen DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_target(target_id):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM targets WHERE id = ?", (target_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def find_target_by_track(track_id, uav_id):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute(
        "SELECT * FROM targets WHERE track_id = ? AND uav_id = ?", (track_id, uav_id)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def create_target(track_id, uav_id, class_name, threat_level, distance_m, lat, lon, heading_deg, timestamp):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.execute(
        "INSERT INTO targets (track_id, uav_id, class, threat_level, distance_m, lat, lon, heading_deg, first_seen, last_seen) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (track_id, uav_id, class_name, threat_level, distance_m, lat, lon, heading_deg, timestamp, timestamp),
    )
    conn.commit()
    target_id = cur.lastrowid
    conn.close()
    insert_target_event(target_id, "detected", "Mới phát hiện", timestamp)
    return target_id


def touch_target(target_id, threat_level, distance_m, lat, lon, heading_deg, timestamp):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "UPDATE targets SET status = CASE WHEN status = 'new' THEN 'tracking' ELSE status END, "
        "threat_level = ?, distance_m = ?, lat = ?, lon = ?, heading_deg = ?, last_seen = ? WHERE id = ?",
        (threat_level, distance_m, lat, lon, heading_deg, timestamp, target_id),
    )
    conn.commit()
    conn.close()


TARGET_EDITABLE_FIELDS = ("status",)


def update_target(target_id, patch):
    fields = {k: v for k, v in patch.items() if k in TARGET_EDITABLE_FIELDS}
    if not fields:
        return
    conn = sqlite3.connect(DB_PATH)
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    conn.execute(f"UPDATE targets SET {set_clause} WHERE id = ?", (*fields.values(), target_id))
    conn.commit()
    conn.close()


def insert_target_event(target_id, type_, label, timestamp):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT INTO target_events (target_id, type, label, timestamp) VALUES (?, ?, ?, ?)",
        (target_id, type_, label, timestamp),
    )
    conn.commit()
    conn.close()


def list_target_events(target_id, limit=50):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT * FROM target_events WHERE target_id = ? ORDER BY id DESC LIMIT ?", (target_id, limit)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def list_recent_target_events(limit=10):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        """
        SELECT target_events.*, targets.track_id, targets.class
        FROM target_events JOIN targets ON targets.id = target_events.target_id
        ORDER BY target_events.id DESC LIMIT ?
        """,
        (limit,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def list_target_notes(target_id):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT * FROM target_notes WHERE target_id = ? ORDER BY id DESC", (target_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def add_target_note(target_id, author, text):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT INTO target_notes (target_id, author, text, created_at) VALUES (?, ?, ?, ?)",
        (target_id, author, text, _now()),
    )
    conn.commit()
    conn.close()


def list_target_snapshots(track_id, uav_id, limit=8):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT id, timestamp FROM alert_events WHERE track_id = ? AND uav_id = ? ORDER BY id DESC LIMIT ?",
        (track_id, uav_id, limit),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# --- POI (điểm quan tâm trên bản đồ) ---

def list_pois():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM pois ORDER BY id DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def create_poi(name, type_, lat, lon):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.execute(
        "INSERT INTO pois (name, type, lat, lon, created_at) VALUES (?, ?, ?, ?, ?)",
        (name, type_, lat, lon, _now()),
    )
    conn.commit()
    poi_id = cur.lastrowid
    conn.close()
    return poi_id


def delete_poi(poi_id):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM pois WHERE id = ?", (poi_id,))
    conn.commit()
    conn.close()


# --- Notes (ghi chép) ---

def list_notes():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM notes ORDER BY id DESC").fetchall()
    conn.close()
    notes = [dict(r) for r in rows]
    for n in notes:
        n["tags"] = json.loads(n["tags"])
        n["starred"] = bool(n["starred"])
    return notes


def get_note(note_id):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
    conn.close()
    if row is None:
        return None
    note = dict(row)
    note["tags"] = json.loads(note["tags"])
    note["starred"] = bool(note["starred"])
    return note


def create_note(title, content="", tags=None, uav_id=None, mission_id=None, author="admin"):
    now = _now()
    conn = sqlite3.connect(DB_PATH)
    cur = conn.execute(
        "INSERT INTO notes (title, content, tags, uav_id, mission_id, starred, author, created_at, updated_at) "
        "VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?)",
        (title, content, json.dumps(tags or []), uav_id, mission_id, author, now, now),
    )
    conn.commit()
    note_id = cur.lastrowid
    conn.close()
    return note_id


NOTE_EDITABLE_FIELDS = ("title", "content", "tags", "uav_id", "mission_id", "starred")


def update_note(note_id, patch):
    fields = {k: v for k, v in patch.items() if k in NOTE_EDITABLE_FIELDS}
    if not fields:
        return
    if "tags" in fields:
        fields["tags"] = json.dumps(fields["tags"])
    if "starred" in fields:
        fields["starred"] = 1 if fields["starred"] else 0
    fields["updated_at"] = _now()
    conn = sqlite3.connect(DB_PATH)
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    conn.execute(f"UPDATE notes SET {set_clause} WHERE id = ?", (*fields.values(), note_id))
    conn.commit()
    conn.close()


def delete_note(note_id):
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
    conn.commit()
    conn.close()
