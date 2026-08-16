import asyncio
import json
import time
from collections import Counter

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse

import db
from pipeline import DetectionPipeline
from settings_store import settings
from telemetry import TelemetryHub

app = FastAPI()
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

pipeline = DetectionPipeline()
telemetry = TelemetryHub(get_uav_ids=lambda: [u["id"] for u in db.list_uavs()])
pipeline.telemetry = telemetry


# ponytail: dữ liệu demo để giao diện có nội dung ngay lần chạy đầu (chỉ chèn khi DB rỗng).
# Chỉ UAV[0] thật sự chạy detection (pipeline.set_active_uav) — các UAV khác "flying" chỉ là
# trạng thái demo, telemetry vẫn giả lập như mọi UAV không active khác (đã ghi rõ trong README).
DEMO_UAVS = [
    ("UAV_01", "Falcon 8X", "flying", "Khu vực A"),
    ("UAV_02", "Eagle Pro", "flying", "Khu vực B"),
    ("UAV_03", "SkyEye 4K", "flying", "Khu vực C"),
    ("UAV_04", "Phantom 4 RTK", "ready", "Căn cứ"),
    ("UAV_05", "Matrice 300 RTK", "offline", ""),
    ("UAV_06", "Autel EVO II", "maintenance", "Căn cứ"),
]
DEMO_MISSIONS = [
    ("Tuần tra khu vực A", 0, [{"lat": 21.030, "lon": 105.850}, {"lat": 21.031, "lon": 105.852}, {"lat": 21.029, "lon": 105.854}], -45, 15),
    ("Giám sát biên giới", 1, [{"lat": 21.027, "lon": 105.856}, {"lat": 21.026, "lon": 105.858}], -27, 33),
    ("Theo dõi mục tiêu", 2, [{"lat": 21.031, "lon": 105.849}, {"lat": 21.032, "lon": 105.847}], -36, 24),
]


def _iso_offset(minutes):
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() + minutes * 60))


def _seed_demo_data():
    video_source = settings.get()["video_source"]
    ids = [db.create_uav(name, video_source, status=status, type_=type_, zone=zone) for name, type_, status, zone in DEMO_UAVS]
    for name, uav_idx, waypoints, start_off, end_off in DEMO_MISSIONS:
        db.create_mission(name, ids[uav_idx], waypoints, _iso_offset(start_off), _iso_offset(end_off), priority="high")


@app.on_event("startup")
def startup():
    db.init_db()
    if not db.list_uavs():
        _seed_demo_data()
    first = db.list_uavs()[0]
    db.update_uav(first["id"], {"status": "flying", "flying_since": _now_iso()})
    pipeline.set_active_uav(first["id"], first["video_source"])
    pipeline.start()
    telemetry.start()


@app.on_event("shutdown")
def shutdown():
    pipeline.stop()


async def _mjpeg_frames():
    while True:
        frame = pipeline.get_live_frame()
        if frame is not None:
            yield b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
        await asyncio.sleep(0.03)


@app.get("/video")
async def video():
    return StreamingResponse(
        _mjpeg_frames(), media_type="multipart/x-mixed-replace; boundary=frame"
    )


@app.get("/api/snapshot")
def snapshot():
    frame = pipeline.get_frame()
    if frame is None:
        raise HTTPException(status_code=404, detail="Chưa có frame nào")
    filename = f"snapshot_{time.strftime('%Y%m%d_%H%M%S')}.jpg"
    return Response(
        content=frame,
        media_type="image/jpeg",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@app.websocket("/ws")
async def ws_detections(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            payload = pipeline.get_payload()
            if payload:
                await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        pass


@app.get("/api/settings")
def get_settings():
    return settings.get()


@app.put("/api/settings")
def update_settings(patch: dict):
    return settings.update(patch)


@app.get("/api/logs")
def get_logs(start: str | None = None, end: str | None = None, class_: str | None = None, severity: str | None = None, uav_id: int | None = None):
    return db.query_logs(start, end, class_, severity, uav_id)


@app.get("/api/logs/export.csv")
def export_logs_csv(start: str | None = None, end: str | None = None, class_: str | None = None, severity: str | None = None):
    csv_text = db.logs_to_csv(start, end, class_, severity)
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=alerts.csv"},
    )


@app.get("/api/logs/{event_id}/snapshot")
def get_log_snapshot(event_id: int):
    jpeg = db.get_snapshot(event_id)
    if jpeg is None:
        raise HTTPException(status_code=404)
    return Response(content=jpeg, media_type="image/jpeg")


@app.get("/api/tracks/{track_id}/history")
def get_track_history(track_id: int):
    return pipeline.get_track_history(track_id)


# --- UAV fleet ---

@app.get("/api/uavs")
def list_uavs():
    return db.list_uavs()


@app.post("/api/uavs")
def create_uav(body: dict):
    uav_id = db.create_uav(
        body["name"],
        body["video_source"],
        body.get("status", "ready"),
        body.get("type", ""),
        body.get("serial", ""),
        body.get("zone", ""),
    )
    return {"id": uav_id}


@app.patch("/api/uavs/{uav_id}")
def patch_uav(uav_id: int, body: dict):
    uavs = {u["id"]: u for u in db.list_uavs()}
    uav = uavs.get(uav_id)
    if uav is None:
        raise HTTPException(status_code=404)
    if "status" in body and body["status"] != uav["status"]:
        if body["status"] == "flying":
            body = {**body, "flying_since": _now_iso()}
        elif uav["status"] == "flying":
            body = {**body, "flying_since": None}
    db.update_uav(uav_id, body)
    return {"ok": True}


@app.delete("/api/uavs/{uav_id}")
def delete_uav(uav_id: int):
    if pipeline.active_uav_id == uav_id:
        raise HTTPException(status_code=400, detail="Không thể xoá UAV đang được giám sát trực tiếp")
    db.delete_uav(uav_id)
    return {"ok": True}


@app.post("/api/uavs/{uav_id}/activate")
def activate_uav(uav_id: int):
    uavs = {u["id"]: u for u in db.list_uavs()}
    if uav_id not in uavs:
        raise HTTPException(status_code=404, detail="Không tìm thấy UAV")
    if pipeline.active_uav_id is not None and pipeline.active_uav_id in uavs:
        db.update_uav(pipeline.active_uav_id, {"status": "ready", "flying_since": None})
    db.update_uav(uav_id, {"status": "flying", "flying_since": _now_iso()})
    pipeline.set_active_uav(uav_id, uavs[uav_id]["video_source"])
    return {"active_uav_id": uav_id}


@app.get("/api/uavs/{uav_id}/telemetry")
def get_uav_telemetry(uav_id: int):
    return telemetry.position(uav_id)


@app.get("/api/uavs/{uav_id}/trail")
def get_uav_trail(uav_id: int):
    return telemetry.get_trail(uav_id)


# --- Missions ---
# ponytail: tiến độ tính theo % thời gian đã trôi qua so với kế hoạch (started_at -> expected_end_at),
# không đối chiếu GPS thật với waypoint vì vị trí UAV hiện đang giả lập, đối chiếu sẽ cho số liệu sai lệch.
# Khi chuyển khỏi trạng thái "active" (tạm dừng/huỷ/thất bại), % được "đóng băng" tại frozen_pct thay vì
# tiếp tục chạy theo đồng hồ — nếu không, nhiệm vụ tạm dừng vẫn sẽ tự nhảy lên 100% theo thời gian trôi qua.

def _now_iso():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _parse(iso_str):
    return time.mktime(time.strptime(iso_str, "%Y-%m-%dT%H:%M:%SZ"))


def _mission_progress(mission):
    if mission["status"] == "completed":
        pct = 100
    elif mission["frozen_pct"] is not None:
        pct = mission["frozen_pct"]
    else:
        started, ended, now = mission["started_at"], mission["expected_end_at"], _now_iso()
        if now <= started:
            pct = 0
        elif now >= ended:
            pct = 100
        else:
            total = _parse(ended) - _parse(started)
            done = _parse(now) - _parse(started)
            pct = round(min(100, max(0, done / total * 100)), 1) if total > 0 else 100
    total_wp = len(mission["waypoints"])
    reached = int(pct / 100 * total_wp)
    return pct, reached


@app.get("/api/missions")
def list_missions():
    missions = db.list_missions()
    for m in missions:
        pct, reached = _mission_progress(m)
        m["progress_pct"] = pct
        m["waypoints_reached"] = reached
        if m["status"] == "active" and pct >= 100:
            db.update_mission_status(m["id"], "completed")
            m["status"] = "completed"
    return missions


@app.post("/api/missions")
def create_mission(body: dict):
    mission_id = db.create_mission(
        body["name"], body["uav_id"], body["waypoints"], body["started_at"], body["expected_end_at"],
        body.get("description", ""), body.get("priority", "medium"), body.get("notes", ""),
    )
    return {"id": mission_id}


@app.patch("/api/missions/{mission_id}")
def patch_mission(mission_id: int, body: dict):
    missions = {m["id"]: m for m in db.list_missions()}
    mission = missions.get(mission_id)
    if mission is None:
        raise HTTPException(status_code=404)
    if "status" in body:
        if body["status"] == "active":
            body = {**body, "frozen_pct": None}
        elif body["status"] != "completed":
            pct, _ = _mission_progress(mission)
            body = {**body, "frozen_pct": pct}
    db.update_mission(mission_id, body)
    return {"ok": True}


@app.delete("/api/missions/{mission_id}")
def delete_mission(mission_id: int):
    db.delete_mission(mission_id)
    return {"ok": True}


@app.get("/api/missions/{mission_id}/timeline")
def get_mission_timeline(mission_id: int):
    missions = {m["id"]: m for m in db.list_missions()}
    mission = missions.get(mission_id)
    if mission is None:
        raise HTTPException(status_code=404)

    _, reached = _mission_progress(mission)
    started = _parse(mission["started_at"])
    ended = _parse(mission["expected_end_at"])
    duration = max(ended - started, 1)
    total_wp = len(mission["waypoints"])

    events = [
        {"time": mission["created_at"], "type": "created", "label": "Nhiệm vụ được tạo"},
        {"time": mission["started_at"], "type": "start", "label": "UAV cất cánh"},
    ]
    # ponytail: thời điểm "đến điểm N" nội suy tuyến tính theo lịch, không phải GPS thật khớp waypoint
    for i in range(min(reached, total_wp)):
        t = started + duration * (i + 1) / total_wp
        events.append({
            "time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(t)),
            "type": "waypoint",
            "label": f"Đến điểm {i + 1}",
        })

    for a in db.query_logs(start=mission["started_at"], uav_id=mission["uav_id"]):
        events.append({
            "time": a["timestamp"],
            "type": "alert",
            "label": f"Phát hiện {a['class']} ({a['distance_m']}m)",
        })

    events.sort(key=lambda e: e["time"])
    return events


# --- Targets (Mục tiêu) ---
# ponytail: lat/lon/heading của target là ƯỚC TÍNH (xem telemetry.estimate_target_position),
# không phải toạ độ đo thật — vì chưa có gimbal heading thật.

STATUS_LABEL_VI = {"new": "Mới phát hiện", "tracking": "Đang theo dõi", "confirmed": "Đã xác định", "processed": "Đã xử lý"}


@app.get("/api/targets")
def list_targets():
    return db.list_targets()


@app.get("/api/targets/events/recent")
def get_recent_target_events():
    return db.list_recent_target_events()


@app.get("/api/targets/{target_id}")
def get_target(target_id: int):
    target = db.get_target(target_id)
    if target is None:
        raise HTTPException(status_code=404)
    return target


@app.patch("/api/targets/{target_id}")
def patch_target(target_id: int, body: dict):
    target = db.get_target(target_id)
    if target is None:
        raise HTTPException(status_code=404)
    db.update_target(target_id, body)
    new_status = body.get("status")
    if new_status and new_status != target["status"]:
        db.insert_target_event(target_id, "status_changed", STATUS_LABEL_VI.get(new_status, new_status), time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()))
    return {"ok": True}


@app.get("/api/targets/{target_id}/events")
def get_target_events(target_id: int):
    return db.list_target_events(target_id)


@app.get("/api/targets/{target_id}/notes")
def get_target_notes(target_id: int):
    return db.list_target_notes(target_id)


@app.post("/api/targets/{target_id}/notes")
def post_target_note(target_id: int, body: dict):
    db.add_target_note(target_id, "admin", body["text"])
    return {"ok": True}


@app.get("/api/targets/{target_id}/snapshots")
def get_target_snapshots(target_id: int):
    target = db.get_target(target_id)
    if target is None:
        raise HTTPException(status_code=404)
    return db.list_target_snapshots(target["track_id"], target["uav_id"])


# --- Tổng quan ---

@app.get("/api/stats/overview")
def stats_overview():
    uavs = db.list_uavs()
    missions = list_missions()
    payload = pipeline.get_payload()
    recent_logs = db.query_logs()[:5]
    return {
        "uav_total": len(uavs),
        "uav_online": sum(1 for u in uavs if u["status"] != "offline"),
        "mission_running": sum(1 for m in missions if m["status"] == "active"),
        "mission_total": len(missions),
        "targets_tracked": len(payload["objects"]) if payload else 0,
        "alert_count_24h": len(recent_logs),
        "recent_alerts": recent_logs,
    }


# --- POI (Bản đồ) ---

@app.get("/api/pois")
def list_pois():
    return db.list_pois()


@app.post("/api/pois")
def create_poi(body: dict):
    poi_id = db.create_poi(body["name"], body.get("type", ""), body["lat"], body["lon"])
    return {"id": poi_id}


@app.delete("/api/pois/{poi_id}")
def delete_poi(poi_id: int):
    db.delete_poi(poi_id)
    return {"ok": True}


# --- Notes (Ghi chép) ---

@app.get("/api/notes")
def list_notes():
    return db.list_notes()


@app.get("/api/notes/{note_id}")
def get_note(note_id: int):
    note = db.get_note(note_id)
    if note is None:
        raise HTTPException(status_code=404)
    return note


@app.post("/api/notes")
def create_note(body: dict):
    note_id = db.create_note(
        body["title"], body.get("content", ""), body.get("tags", []),
        body.get("uav_id"), body.get("mission_id"), body.get("author", "admin"),
    )
    return {"id": note_id}


@app.patch("/api/notes/{note_id}")
def patch_note(note_id: int, body: dict):
    if db.get_note(note_id) is None:
        raise HTTPException(status_code=404)
    db.update_note(note_id, body)
    return {"ok": True}


@app.delete("/api/notes/{note_id}")
def delete_note(note_id: int):
    db.delete_note(note_id)
    return {"ok": True}


# --- Phân tích (Analytics) ---
# ponytail: "giờ bay" ở đây là TỔNG THỜI LƯỢNG KẾ HOẠCH của các nhiệm vụ đã hoàn thành
# (expected_end_at - started_at), giống hệt cách tính "Tổng thời gian bay" ở stat card Tổng quan —
# không phải giờ bay đo thật vì chưa có telemetry/MAVLink thật. Không có bảng lưu lịch sử
# pin/quãng đường/tín hiệu theo ngày nên KHÔNG bịa biểu đồ xu hướng nhiều ngày cho các đại lượng đó.

@app.get("/api/stats/analytics")
def stats_analytics(days: int = 7):
    start_iso = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() - days * 86400))
    uavs = db.list_uavs()
    missions = list_missions()
    targets = db.list_targets()
    alerts = db.query_logs(start=start_iso)

    def duration_s(m):
        return max(_parse(m["expected_end_at"]) - _parse(m["started_at"]), 0)

    completed = [m for m in missions if m["status"] == "completed"]
    total_flight_s = sum(duration_s(m) for m in completed)
    success_rate = round(len(completed) / len(missions) * 100, 1) if missions else 0.0

    by_severity = Counter(a["severity"] for a in alerts)
    by_class = Counter(t["class"] for t in targets)

    per_uav = []
    for u in uavs:
        u_missions = [m for m in missions if m["uav_id"] == u["id"]]
        u_completed = [m for m in u_missions if m["status"] == "completed"]
        u_alerts = [a for a in alerts if a["uav_id"] == u["id"]]
        u_flight_s = sum(duration_s(m) for m in u_completed)
        gps = telemetry.position(u["id"])  # giả lập — xem backend/telemetry.py
        per_uav.append({
            "uav_id": u["id"],
            "name": u["name"],
            "missions_total": len(u_missions),
            "missions_completed": len(u_completed),
            "success_rate": round(len(u_completed) / len(u_missions) * 100, 1) if u_missions else 0.0,
            "alerts_count": len(u_alerts),
            "flight_seconds_planned": u_flight_s,
            "battery_pct_now": gps["battery_pct"],  # giả lập, tại thời điểm hiện tại
        })

    return {
        "range_days": days,
        "missions_total": len(missions),
        "missions_completed": len(completed),
        "missions_active": sum(1 for m in missions if m["status"] == "active"),
        "success_rate": success_rate,
        "flight_seconds_planned_total": total_flight_s,
        "alerts_total": len(alerts),
        "alerts_by_severity": dict(by_severity),
        "targets_total": len(targets),
        "targets_by_class": dict(by_class),
        "per_uav": per_uav,
    }
