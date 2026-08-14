import { useEffect, useState } from "react";
import { API_BASE, activateUAV, getOverviewStats, getUavTelemetry, listMissions, listUAVs } from "../api";
import MiniMap from "../components/MiniMap";

const SEVERITY_LABEL = { red: "NGUY HIỂM", yellow: "CẢNH BÁO", green: "Bình thường" };

function downloadSnapshot() {
  const a = document.createElement("a");
  a.href = `${API_BASE}/api/snapshot`;
  a.download = "";
  a.click();
}

export default function Overview({ payload }) {
  const [stats, setStats] = useState(null);
  const [uavs, setUavs] = useState([]);
  const [missions, setMissions] = useState([]);
  const [viewedUavId, setViewedUavId] = useState(null);
  const [viewedTelemetry, setViewedTelemetry] = useState(null);
  const [cameraMode, setCameraMode] = useState("EO");
  const [zoom, setZoom] = useState(1);

  const activeUavId = payload?.active_uav_id ?? null;

  useEffect(() => {
    async function load() {
      setStats(await getOverviewStats());
      const uavList = await listUAVs();
      setUavs(uavList);
      setMissions(await listMissions());
      if (viewedUavId == null && uavList.length) setViewedUavId(uavList[0].id);
    }
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [viewedUavId]);

  useEffect(() => {
    if (viewedUavId == null) return;
    let cancelled = false;
    async function poll() {
      const t = await getUavTelemetry(viewedUavId);
      if (!cancelled) setViewedTelemetry(t);
    }
    poll();
    const id = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [viewedUavId]);

  const objects = viewedUavId === activeUavId ? payload?.objects ?? [] : [];
  const isLive = viewedUavId === activeUavId && activeUavId != null;
  const currentMission = missions.find((m) => m.uav_id === viewedUavId && m.status === "active");
  const viewedUav = uavs.find((u) => u.id === viewedUavId);

  async function activate() {
    await activateUAV(viewedUavId);
  }

  return (
    <div className="overview">
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-icon">🛸</div>
          <div className="stat-label">UAV HOẠT ĐỘNG</div>
          <div className="stat-value">{stats?.uav_online ?? "-"} / {stats?.uav_total ?? "-"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-label">NHIỆM VỤ ĐANG CHẠY</div>
          <div className="stat-value">{stats?.mission_running ?? "-"} / {stats?.mission_total ?? "-"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-label">MỤC TIÊU ĐANG THEO DÕI</div>
          <div className="stat-value">{stats?.targets_tracked ?? "-"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-label">CẢNH BÁO GẦN ĐÂY</div>
          <div className="stat-value">{stats?.alert_count_24h ?? "-"}</div>
        </div>
      </div>

      <div className="overview-main">
        <div className="video-panel">
          <div className="video-frame">
            <img className="video" src={`${API_BASE}/video`} alt="UAV live feed" />
            <div className="crosshair" />
            <div className="compass-strip">
              {["W", "285", "300", "NW", "330", "345", "N"].map((t) => (
                <span key={t} className={t === "NW" ? "compass-current" : ""}>{t}</span>
              ))}
            </div>
            {!isLive && <div className="video-note">Chưa kích hoạt giám sát trực tiếp cho UAV này</div>}
            <div className="target-overlay">
              {objects.map((o) => (
                <div key={o.track_id} className={`target-card ${o.severity}`}>
                  <strong>MỤC TIÊU {o.track_id}</strong>
                  <span>Loại: {o.class}</span>
                  <span>Khoảng cách: {o.distance_m ?? "-"} m</span>
                </div>
              ))}
            </div>
          </div>
          {currentMission && (
            <div className="mission-card">
              <div className="mission-card-header">
                <span>{currentMission.name}</span>
                <span className="badge">ĐANG THỰC HIỆN</span>
              </div>
              <div className="mission-card-body">
                <span>UAV: {viewedUav?.name}</span>
                <span>Waypoints: {currentMission.waypoints_reached} / {currentMission.waypoints.length}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${currentMission.progress_pct}%` }} />
              </div>
            </div>
          )}
        </div>

        <aside className="side-panel">
          <section>
            <div className="side-panel-header">
              <h2>Trạng thái UAV</h2>
              <select value={viewedUavId ?? ""} onChange={(e) => setViewedUavId(Number(e.target.value))}>
                {uavs.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            {!isLive && (
              <button className="activate-btn" onClick={activate}>Kích hoạt giám sát trực tiếp</button>
            )}
            <dl className="telemetry-list">
              <dt>Trạng thái</dt>
              <dd className={isLive ? "ok" : ""}>{isLive ? "ĐANG BAY (live)" : "Giả lập"}</dd>
              <dt>Pin</dt>
              <dd>{viewedTelemetry?.battery_pct ?? "-"}%</dd>
              <dt>Tốc độ</dt>
              <dd>{viewedTelemetry?.speed_kmh ?? "-"} km/h</dd>
              <dt>Độ cao</dt>
              <dd>{viewedTelemetry?.altitude_m ?? "-"} m</dd>
              <dt>Tín hiệu</dt>
              <dd>{viewedTelemetry?.signal ?? "-"}</dd>
              {isLive && (
                <>
                  <dt>Độ trễ</dt>
                  <dd>{payload?.uav_status?.latency_ms ?? "-"} ms</dd>
                </>
              )}
            </dl>
          </section>

          <section>
            <h2>Điều khiển camera</h2>
            <p className="muted">Chưa nối gimbal thật — nút bên dưới chỉ để dựng UI trước.</p>
            <div className="eo-ir-toggle">
              <button className={cameraMode === "EO" ? "active" : ""} onClick={() => setCameraMode("EO")}>EO</button>
              <button className={cameraMode === "IR" ? "active" : ""} onClick={() => setCameraMode("IR")}>IR</button>
            </div>
            <div className="ptz-pad" title="Chưa nối gimbal thật">
              <button disabled>▲</button>
              <div className="ptz-row">
                <button disabled>◀</button>
                <button disabled>●</button>
                <button disabled>▶</button>
              </div>
              <button disabled>▼</button>
            </div>
            <label className="zoom-slider">
              Zoom {zoom.toFixed(1)}x
              <input type="range" min="1" max="10" step="0.5" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
            </label>
            <div className="camera-actions">
              <button onClick={downloadSnapshot}>📷 Chụp ảnh</button>
              <button disabled title="Chưa hỗ trợ ghi video">⏺ Quay video</button>
            </div>
          </section>

          <section>
            <h2>Bản đồ nhiệm vụ</h2>
            <MiniMap
              waypoints={currentMission?.waypoints ?? []}
              uavPosition={viewedTelemetry ? { lat: viewedTelemetry.lat, lon: viewedTelemetry.lon } : null}
            />
          </section>
        </aside>
      </div>

      <div className="alert-ticker">
        <strong>CẢNH BÁO GẦN NHẤT:</strong>
        {(stats?.recent_alerts ?? []).length === 0 && <span className="muted">Chưa có cảnh báo</span>}
        {(stats?.recent_alerts ?? []).map((a) => (
          <span key={a.id} className={`ticker-item ${a.severity}`}>
            {a.timestamp} · {SEVERITY_LABEL[a.severity]} · {a.class} · {a.distance_m}m
          </span>
        ))}
      </div>
    </div>
  );
}
