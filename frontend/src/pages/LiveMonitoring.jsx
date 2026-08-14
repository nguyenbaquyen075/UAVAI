import { useEffect, useState } from "react";
import {
  Plane,
  Crosshair,
  Wifi,
  Battery,
  User,
  Circle,
  Gauge,
  ArrowUp,
  MapPin,
  Clock,
  SignalHigh,
  Camera,
  Video,
  Save,
  AlertTriangle,
  Info,
} from "lucide-react";
import { API_BASE, activateUAV, getLogs, getUavTelemetry, listTargets, listUAVs, listMissions } from "../api";
import TacticalVideoHUD from "../components/TacticalVideoHUD";
import LiveTacticalMap from "../components/LiveTacticalMap";
import ThermalSensorView from "../components/ThermalSensorView";
import PTZCameraControls from "../components/PTZCameraControls";
import SignalBitrateCharts from "../components/SignalBitrateCharts";

// ponytail: trùng CENTER_LAT/LON giả lập ở backend/telemetry.py — dùng để tính khoảng cách tới trạm
const BASE_LAT = 21.0285;
const BASE_LON = 105.8542;

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function flightDuration(flyingSince) {
  if (!flyingSince) return "-";
  const ms = Date.now() - new Date(flyingSince).getTime();
  if (ms < 0) return "-";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

const STATUS_LABEL = { flying: "ĐANG BAY", ready: "SẴN SÀNG", offline: "NGOẠI TUYẾN", maintenance: "BẢO TRÌ" };
const THREAT_COLOR = { high: "red", medium: "yellow", low: "blue" };
const STATUS_LABEL_VI = { new: "Mới phát hiện", tracking: "Đang theo dõi", confirmed: "Đã xác định", processed: "Đã xử lý" };
const SEVERITY_LABEL = { red: "NGUY HIỂM", yellow: "CẢNH BÁO", green: "Bình thường" };

function downloadSnapshot() {
  const a = document.createElement("a");
  a.href = `${API_BASE}/api/snapshot`;
  a.download = `snapshot_${Date.now()}.jpg`;
  a.click();
}

export default function LiveMonitoring({ payload }) {
  const [uavs, setUavs] = useState([]);
  const [missions, setMissions] = useState([]);
  const [targets, setTargets] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [selectedUavId, setSelectedUavId] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [activeTargetTrackId, setActiveTargetTrackId] = useState(null);

  const activeUavId = payload?.active_uav_id ?? null;

  useEffect(() => {
    async function load() {
      const uavList = await listUAVs();
      const safeUavs = Array.isArray(uavList) ? uavList : [];
      setUavs(safeUavs);
      if (selectedUavId == null && safeUavs.length) {
        setSelectedUavId(activeUavId ?? safeUavs[0].id);
      }

      const missionList = await listMissions();
      setMissions(Array.isArray(missionList) ? missionList : []);

      const targetList = await listTargets();
      setTargets(Array.isArray(targetList) ? targetList : []);
    }
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [selectedUavId, activeUavId]);

  useEffect(() => {
    if (selectedUavId == null) return;
    let cancelled = false;
    async function poll() {
      const [t, logs] = await Promise.all([
        getUavTelemetry(selectedUavId),
        getLogs({ uav_id: selectedUavId }),
      ]);
      if (!cancelled) {
        setTelemetry(t);
        setAlerts(Array.isArray(logs) ? logs.slice(0, 6) : []);
      }
    }
    poll();
    const id = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [selectedUavId]);

  const safeUavs = Array.isArray(uavs) ? uavs : [];
  const safeMissions = Array.isArray(missions) ? missions : [];
  const safeTargets = Array.isArray(targets) ? targets : [];

  const isLive = selectedUavId != null && selectedUavId === activeUavId;
  const liveObjects = isLive && Array.isArray(payload?.objects) ? payload.objects : [];
  const selectedUav = safeUavs.find((u) => u.id === selectedUavId);
  const currentMission = safeMissions.find((m) => m.uav_id === selectedUavId && m.status === "active");
  const uavTargets = safeTargets.filter((t) => t.uav_id === selectedUavId).sort((a, b) => (a.last_seen < b.last_seen ? 1 : -1));

  const distanceKm = telemetry ? haversineKm(BASE_LAT, BASE_LON, telemetry.lat, telemetry.lon).toFixed(1) : null;

  const primaryLiveTarget = liveObjects[0];
  const matchedDbTarget = primaryLiveTarget
    ? uavTargets.find((t) => t.track_id === primaryLiveTarget.track_id)
    : null;
  const activeTarget = uavTargets.find((t) => t.track_id === activeTargetTrackId) ?? matchedDbTarget ?? uavTargets[0];

  async function switchToUav() {
    await activateUAV(selectedUavId);
  }

  const nearestTargetLatLon = matchedDbTarget && matchedDbTarget.lat != null
    ? [matchedDbTarget.lat, matchedDbTarget.lon]
    : undefined;
  const uavLatLon = telemetry ? [telemetry.lat, telemetry.lon] : undefined;
  const targetDistanceLabel = primaryLiveTarget?.distance_m != null ? `${primaryLiveTarget.distance_m} m` : "-";

  return (
    <div className="live-monitoring-page">
      {/* Sub Header */}
      <div className="live-sub-header">
        <div className="header-left">
          <div className="uav-selector-wrapper">
            <Plane size={18} color="#4ade80" />
            <span className="sub-title-label">THEO DÕI TRỰC TIẾP</span>
            <span className="dot-divider">•</span>
            <select
              className="uav-dropdown"
              value={selectedUavId ?? ""}
              onChange={(e) => setSelectedUavId(Number(e.target.value))}
            >
              {safeUavs.map((u) => (
                <option key={u.id} value={u.id}>{u.name} - {u.type || "UAV"}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="header-right-telemetry">
          <div className="telemetry-pill"><Crosshair size={14} color="#4ade80" /><span>GPS <strong>12</strong></span></div>
          <div className="telemetry-pill green"><Wifi size={14} /><span>Liên kết <strong>Strong</strong></span></div>
          <div className="telemetry-pill green"><Battery size={14} /><span>Pin <strong>78%</strong></span></div>
          <div className="user-profile-badge">
            <div className="avatar"><User size={16} color="#e6e8ec" /></div>
            <div className="user-info"><span className="username">admin</span><span className="user-role">Quản trị viên</span></div>
          </div>
        </div>
      </div>

      {/* Top 8 Telemetry Cards Bar — cùng cách tính với UAVList.jsx / Overview.jsx */}
      <div className="top-telemetry-grid">
        <div className="tele-card">
          <div className="tele-card-header"><span className="label">TRẠNG THÁI</span><Circle size={14} color={isLive ? "#4ade80" : "#9aa2b1"} /></div>
          <div className="tele-card-body">
            <div className="status-badge-live">
              {isLive && <span className="pulse-dot"></span>}
              <strong>{isLive ? "ĐANG BAY (live)" : (STATUS_LABEL[selectedUav?.status] ?? "-")}</strong>
            </div>
            <span className="sub-detail">{selectedUav?.zone || "-"}</span>
          </div>
        </div>
        <div className="tele-card">
          <div className="tele-card-header"><span className="label">TỐC ĐỘ</span><Gauge size={14} color="#9aa2b1" /></div>
          <div className="tele-card-body"><div className="main-val">{telemetry?.speed_kmh ?? "-"} <span className="unit">km/h</span></div></div>
        </div>
        <div className="tele-card">
          <div className="tele-card-header"><span className="label">ĐỘ CAO</span><ArrowUp size={14} color="#9aa2b1" /></div>
          <div className="tele-card-body"><div className="main-val">{telemetry?.altitude_m ?? "-"} <span className="unit">m</span></div></div>
        </div>
        <div className="tele-card">
          <div className="tele-card-header"><span className="label">KHOẢNG CÁCH</span><MapPin size={14} color="#9aa2b1" /></div>
          <div className="tele-card-body"><div className="main-val">{distanceKm ?? "-"} <span className="unit">km</span></div></div>
        </div>
        <div className="tele-card">
          <div className="tele-card-header"><span className="label">THỜI GIAN BAY</span><Clock size={14} color="#9aa2b1" /></div>
          <div className="tele-card-body"><div className="main-val">{flightDuration(selectedUav?.flying_since)}</div></div>
        </div>
        <div className="tele-card">
          <div className="tele-card-header"><span className="label">PIN CÒN LẠI</span><Battery size={14} color="#4ade80" /></div>
          <div className="tele-card-body"><div className="main-val green-val">{telemetry?.battery_pct ?? "-"}%</div></div>
        </div>
        <div className="tele-card">
          <div className="tele-card-header"><span className="label">GPS</span><Crosshair size={14} color="#4ade80" /></div>
          <div className="tele-card-body"><div className="main-val">{telemetry ? `${telemetry.lat.toFixed(4)}, ${telemetry.lon.toFixed(4)}` : "-"}</div></div>
        </div>
        <div className="tele-card">
          <div className="tele-card-header"><span className="label">TÍN HIỆU</span><SignalHigh size={14} color="#4ade80" /></div>
          <div className="tele-card-body"><div className="main-val green-val">{telemetry?.signal ?? "-"}</div></div>
        </div>
      </div>

      {/* Middle Split Section */}
      <div className="middle-dashboard-split">
        <div className="main-video-hud-container">
          <TacticalVideoHUD
            isLive={isLive}
            telemetry={telemetry}
            latencyMs={payload?.uav_status?.latency_ms}
            frameSize={payload?.uav_status}
            objects={liveObjects}
          />
        </div>

        <div className="right-tactical-column">
          <LiveTacticalMap uavPos={uavLatLon} targetPos={nearestTargetLatLon} distance={targetDistanceLabel} />
          <ThermalSensorView onSnapshot={downloadSnapshot} />
        </div>
      </div>

      {/* Bottom Grid: 7 Tactical Control & Info Panels */}
      <div className="bottom-dashboard-grid">
        {/* Panel 1: UAV ĐƯỢC CHỌN */}
        <div className="bottom-grid-card uav-selected-card">
          <div className="panel-title">UAV ĐƯỢC CHỌN</div>
          <div className="uav-profile-box">
            <div className="uav-image-preview"><Plane size={56} color="#60a5fa" strokeWidth={1.5} /></div>
            <div className="uav-meta">
              <h3>{selectedUav?.name ?? "-"}</h3>
              <p>{selectedUav?.type || "-"}</p>
              <span className={`badge ${isLive ? "green-badge" : ""}`}>● {isLive ? "ĐANG BAY (live)" : (STATUS_LABEL[selectedUav?.status] ?? "-")}</span>
            </div>
          </div>
          <button className="btn-action-full" disabled={isLive} title={isLive ? "UAV này đang được giám sát trực tiếp" : "Chuyển detection thật sang UAV này (chỉ 1 UAV chạy cùng lúc — ground station CPU-only)"} onClick={switchToUav}>
            {isLive ? "ĐANG GIÁM SÁT" : "KÍCH HOẠT GIÁM SÁT TRỰC TIẾP"}
          </button>
        </div>

        {/* Panel 2: ĐIỀU KHIỂN CAMERA */}
        <div className="bottom-grid-card ptz-card">
          <PTZCameraControls />
        </div>

        {/* Panel 3: GHI HÌNH & CHỤP ẢNH */}
        <div className="bottom-grid-card record-card">
          <div className="panel-title">GHI HÌNH & CHỤP ẢNH</div>
          <p className="muted" style={{ fontSize: "11px", margin: "0 0 8px" }}>Chưa hỗ trợ ghi video — chỉ chụp ảnh hoạt động thật.</p>
          <div className="quick-media-actions">
            <button className="media-btn" onClick={downloadSnapshot}><Camera size={14} /> Chụp ảnh</button>
            <button className="media-btn" disabled title="Chưa hỗ trợ ghi video"><Video size={14} /> Quay video</button>
            <button className="media-btn" disabled title="Chưa hỗ trợ lưu video"><Save size={14} /> Lưu video</button>
          </div>
        </div>

        {/* Panel 4: TRUYỀN TÍN HIỆU */}
        <div className="bottom-grid-card signal-card">
          <SignalBitrateCharts />
        </div>

        {/* Panel 5: THÔNG TIN NHIỆM VỤ */}
        <div className="bottom-grid-card mission-info-card">
          <div className="panel-title">THÔNG TIN NHIỆM VỤ</div>
          {currentMission ? (
            <>
              <div className="info-list">
                <div className="info-item"><span>Tên nhiệm vụ</span><strong>{currentMission.name}</strong></div>
                <div className="info-item"><span>Mức ưu tiên</span><strong>{currentMission.priority}</strong></div>
                <div className="info-item"><span>Waypoints</span><strong>{currentMission.waypoints_reached} / {currentMission.waypoints?.length ?? 0}</strong></div>
                <div className="info-item"><span>Bắt đầu</span><span>{new Date(currentMission.started_at).toLocaleString("vi-VN")}</span></div>
                <div className="info-item"><span>Dự kiến kết thúc</span><span>{new Date(currentMission.expected_end_at).toLocaleString("vi-VN")}</span></div>
              </div>
              <div className="mission-progress-block">
                <div className="progress-labels"><span>Tiến độ nhiệm vụ</span><strong>{currentMission.progress_pct}%</strong></div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${currentMission.progress_pct}%` }} /></div>
              </div>
            </>
          ) : (
            <p className="muted">UAV này chưa có nhiệm vụ đang chạy.</p>
          )}
        </div>

        {/* Panel 6: MỤC TIÊU HIỆN TẠI */}
        <div className="bottom-grid-card current-target-card">
          <div className="panel-title">MỤC TIÊU HIỆN TẠI</div>
          {activeTarget ? (
            <div className="info-list">
              <div className="info-item"><span>Track ID</span><strong>{activeTarget.track_id}</strong></div>
              <div className="info-item"><span>Loại</span><strong>{activeTarget.class}</strong></div>
              <div className="info-item"><span>Trạng thái</span><strong className="green-text">{STATUS_LABEL_VI[activeTarget.status] ?? activeTarget.status}</strong></div>
              <div className="info-item"><span>Khoảng cách</span><span>{activeTarget.distance_m ?? "-"} m</span></div>
              <div className="info-item"><span>Toạ độ ước tính</span><span>{activeTarget.lat != null ? `${activeTarget.lat.toFixed(5)}°, ${activeTarget.lon.toFixed(5)}°` : "-"}</span></div>
            </div>
          ) : (
            <p className="muted">Chưa có mục tiêu nào được ghi nhận cho UAV này.</p>
          )}
          <div className="link-action-footer"><a href="#tracking">Xem chi tiết mục tiêu &gt;</a></div>
        </div>

        {/* Panel 7: DANH SÁCH MỤC TIÊU */}
        <div className="bottom-grid-card targets-list-card">
          <div className="panel-title">DANH SÁCH MỤC TIÊU ({uavTargets.length})</div>
          <div className="targets-scroll-list">
            {uavTargets.length === 0 && <p className="muted">Chưa có mục tiêu.</p>}
            {uavTargets.map((tgt) => {
              const color = THREAT_COLOR[tgt.threat_level] ?? "blue";
              return (
                <div
                  key={tgt.id}
                  className={`target-row-item ${activeTargetTrackId === tgt.track_id ? "selected" : ""}`}
                  onClick={() => setActiveTargetTrackId(tgt.track_id)}
                >
                  <span className={`target-dot ${color}`}>●</span>
                  <span className="target-num">{tgt.track_id}</span>
                  <span className="target-name">{tgt.class}</span>
                  <span className={`target-status ${color}`}>{STATUS_LABEL_VI[tgt.status] ?? tgt.status}</span>
                </div>
              );
            })}
          </div>
          <div className="link-action-footer"><a href="#tracking">Xem tất cả mục tiêu &gt;</a></div>
        </div>

        {/* Panel 8: CẢNH BÁO TRỰC TIẾP */}
        <div className="bottom-grid-card alerts-live-card">
          <div className="panel-title-row">
            <span className="panel-title">CẢNH BÁO TRỰC TIẾP</span>
            <a href="#logs" className="link-top">Xem tất cả &gt;</a>
          </div>
          <div className="alerts-scroll-list">
            {alerts.length === 0 && <p className="muted">Chưa có cảnh báo cho UAV này.</p>}
            {alerts.map((alt) => (
              <div key={alt.id} className={`alert-feed-item ${alt.severity === "red" ? "danger" : "warning"}`}>
                <div className="alert-feed-icon">
                  {alt.severity === "red" ? <AlertTriangle size={16} color="#f87171" /> : <Info size={16} color="#facc15" />}
                </div>
                <div className="alert-feed-text">{SEVERITY_LABEL[alt.severity] ?? alt.severity} · {alt.class} · {alt.distance_m}m</div>
                <div className="alert-feed-time">{new Date(alt.timestamp).toLocaleTimeString("vi-VN")}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
