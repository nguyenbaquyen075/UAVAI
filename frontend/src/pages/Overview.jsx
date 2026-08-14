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
      const overviewStats = await getOverviewStats();
      setStats(overviewStats);

      const uavList = await listUAVs();
      const safeUavs = Array.isArray(uavList) ? uavList : [];
      setUavs(safeUavs);

      const missionList = await listMissions();
      setMissions(Array.isArray(missionList) ? missionList : []);

      if (viewedUavId == null && safeUavs.length) {
        setViewedUavId(safeUavs[0].id);
      }
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

  const safeObjects = Array.isArray(payload?.objects) ? payload.objects : [];
  const objects = viewedUavId === activeUavId ? safeObjects : [];
  const isLive = viewedUavId === activeUavId && activeUavId != null;

  const safeMissions = Array.isArray(missions) ? missions : [];
  const safeUavs = Array.isArray(uavs) ? uavs : [];

  const currentMission = safeMissions.find((m) => m.uav_id === viewedUavId && m.status === "active");
  const viewedUav = safeUavs.find((u) => u.id === viewedUavId);

  async function activate() {
    await activateUAV(viewedUavId);
  }

  return (
    <div className="overview">
      <div className="live-sub-header" style={{ marginBottom: "10px" }}>
        <div className="header-left">
          <div className="uav-selector-wrapper">
            <span className="sub-title-label">📊 TỔNG QUAN</span>
            <span className="dot-divider">/</span>
            <span className="breadcrumb-sub">Trang chủ &gt; Tổng quan</span>
          </div>
        </div>
        <div className="header-right-telemetry">
          <div className="telemetry-pill"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg><span>GPS <strong>12</strong></span></div>
          <div className="telemetry-pill green"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg><span>Liên kết <strong>Strong</strong></span></div>
          <div className="telemetry-pill green"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="11" x2="23" y2="13"/></svg><span>Pin <strong>78%</strong></span></div>
          <div className="telemetry-pill clock-pill">18:42:10 13/05/2024</div>
          <div className="user-profile-badge">
            <div className="avatar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e6e8ec" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
            <div className="user-info"><span className="username">admin</span><span className="user-role">Quản trị viên</span></div>
          </div>
        </div>
      </div>
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
                <span>Waypoints: {currentMission.waypoints_reached} / {currentMission.waypoints?.length ?? 0}</span>
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
                {safeUavs.map((u) => (
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
