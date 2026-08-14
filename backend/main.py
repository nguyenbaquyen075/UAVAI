import asyncio
import json
import time

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


@app.on_event("startup")
def startup():
    db.init_db()
    if not db.list_uavs():
        db.create_uav("UAV_01", settings.get()["video_source"])
    first = db.list_uavs()[0]
    db.update_uav(first["id"], {"status": "flying"})
    pipeline.set_active_uav(first["id"], first["video_source"])
    pipeline.start()
    telemetry.start()


@app.on_event("shutdown")
def shutdown():
    pipeline.stop()


async def _mjpeg_frames():
    while True:
        frame = pipeline.get_frame()
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
def get_logs(start: str | None = None, end: str | None = None, class_: str | None = None, severity: str | None = None):
    return db.query_logs(start, end, class_, severity)


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
        db.update_uav(pipeline.active_uav_id, {"status": "ready"})
    db.update_uav(uav_id, {"status": "flying"})
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
