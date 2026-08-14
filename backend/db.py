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
            created_at TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS missions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL DEFAULT '',
            uav_id INTEGER NOT NULL,
            waypoints TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            priority TEXT NOT NULL DEFAULT 'medium',
            notes TEXT NOT NULL DEFAULT '',
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
    conn.commit()
    conn.close()


def list_uavs():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("SELECT * FROM uavs ORDER BY id").fetchall()
    conn.close()
    return [dict(r) for r in rows]


UAV_EDITABLE_FIELDS = ("name", "video_source", "status", "type", "serial", "zone")


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


MISSION_EDITABLE_FIELDS = ("name", "description", "status", "priority", "notes", "frozen_pct")


def update_mission(mission_id, patch):
    fields = {k: v for k, v in patch.items() if k in MISSION_EDITABLE_FIELDS}
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
