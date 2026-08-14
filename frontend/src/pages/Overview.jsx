import { useEffect, useState } from "react";
import {
  Plane,
  ClipboardList,
  Target,
  AlertTriangle,
  Camera,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Wifi,
  ExternalLink,
} from "lucide-react";
import { API_BASE, getOverviewStats } from "../api";
import MiniMap from "../components/MiniMap";
import TacticalVideoHUD from "../components/TacticalVideoHUD";

export default function Overview({ payload, onNavigateTab }) {
  const [stats, setStats] = useState(null);
  const [selectedUavId, setSelectedUavId] = useState("UAV_02");
  const [cameraMode, setCameraMode] = useState("EO");
  const [ptzZoom, setPtzZoom] = useState(5.2);
  const [isRecording, setIsRecording] = useState(false);
  const [flashSnapshot, setFlashSnapshot] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const overviewStats = await getOverviewStats();
        setStats(overviewStats);
      } catch (err) {
        console.error("Error loading overview data:", err);
      }
    }
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, []);

  const handleSnapshot = () => {
    setFlashSnapshot(true);
    setTimeout(() => setFlashSnapshot(false), 300);
    const a = document.createElement("a");
    a.href = `${API_BASE}/api/snapshot`;
    a.download = `snapshot_${Date.now()}.jpg`;
    a.click();
  };

  const handlePtzZoomChange = (delta) => {
    setPtzZoom((prev) => Math.max(1.0, Math.min(10.0, Number((prev + delta).toFixed(1)))));
  };

  return (
    <div className={`overview-dashboard ${flashSnapshot ? "screen-flash" : ""}`}>
      {/* ROW 1: TOP 4 KPI METRIC SUMMARY CARDS */}
      <div className="overview-kpi-row">
        {/* CARD 1: UAV HOẠT ĐỘNG */}
        <div className="kpi-summary-card">
          <div className="kpi-icon-box">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f8fafc" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <div className="kpi-content-group">
            <span className="kpi-title">UAV HOẠT ĐỘNG</span>
            <div className="kpi-main-value">
              <span className="big-num">{stats?.uav_online ?? 4}</span>
              <span className="total-denom">/ {stats?.uav_total ?? 6}</span>
            </div>
            <div className="kpi-sub-detail">
              <span className="sub-item"><span className="dot green-dot" /> 4 online</span>
              <span className="sub-item"><span className="dot gray-dot" /> 2 offline</span>
            </div>
          </div>
        </div>

        {/* CARD 2: NHIỆM VỤ ĐANG CHẠY */}
        <div className="kpi-summary-card">
          <div className="kpi-icon-box">
            <ClipboardList size={26} color="#f8fafc" />
          </div>
          <div className="kpi-content-group">
            <span className="kpi-title">NHIỆM VỤ ĐANG CHẠY</span>
            <div className="kpi-main-value">
              <span className="big-num">{stats?.mission_running ?? 2}</span>
              <span className="total-denom">/ {stats?.mission_total ?? 5}</span>
            </div>
            <div className="kpi-sub-detail">
              <span className="sub-item"><span className="dot green-dot" /> 2 hoàn thành</span>
              <span className="sub-item"><span className="dot orange-dot" /> 3 chờ</span>
            </div>
          </div>
        </div>

        {/* CARD 3: MỤC TIÊU ĐANG THEO DÕI */}
        <div className="kpi-summary-card">
          <div className="kpi-icon-box">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f8fafc" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div className="kpi-content-group">
            <span className="kpi-title">MỤC TIÊU ĐANG THEO DÕI</span>
            <div className="kpi-main-value">
              <span className="big-num">{stats?.targets_tracked ?? 3}</span>
              <span className="total-denom">/ {stats?.targets_total ?? 8}</span>
            </div>
            <div className="kpi-sub-detail">
              <span className="sub-item"><span className="dot green-dot" /> 3 đang theo dõi</span>
              <span className="sub-item"><span className="dot orange-dot" /> 5 đã khóa</span>
            </div>
          </div>
        </div>

        {/* CARD 4: CẢNH BÁO */}
        <div className="kpi-summary-card">
          <div className="kpi-icon-box yellow-bg">
            <AlertTriangle size={24} color="#facc15" fill="#facc15" fillOpacity="0.2" />
          </div>
          <div className="kpi-content-group">
            <span className="kpi-title">CẢNH BÁO</span>
            <div className="kpi-main-value">
              <span className="big-num">{stats?.alert_count_24h ?? 3}</span>
            </div>
            <div className="kpi-sub-detail">
              <span className="sub-item"><span className="dot red-dot" /> 2 mức cao</span>
              <span className="sub-item"><span className="dot yellow-dot" /> 1 mức trung bình</span>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2: MAIN DYNAMIC CONTENT GRID */}
      <div className="overview-main-grid">
        {/* LEFT COLUMN: LIVE FEED + MISSION & MAP CARD */}
        <div className="overview-left-col">
          {/* CAMERA FEED & HUD */}
          <div className="video-hud-panel">
            <TacticalVideoHUD
              isLive={true}
              telemetry={payload?.uav_status}
              objects={payload?.objects ?? []}
              cameraMode={cameraMode}
              zoomLevel={ptzZoom}
              onZoomChange={setPtzZoom}
            />
          </div>

          {/* CURRENT MISSION & MINI MAP SPLIT CARD */}
          <div className="mission-map-split-card">
            <div className="card-section-title">NHIỆM VỤ HIỆN TẠI</div>

            <div className="split-card-content">
              {/* LEFT HALF: MISSION DETAILS */}
              <div className="mission-info-half">
                <div className="mission-name-header">
                  <span className="mission-title-text">TUẦN TRA KHU VỰC A</span>
                  <span className="status-badge-running">ĐANG THỰC HIỆN</span>
                </div>

                <div className="mission-details-grid">
                  <div className="detail-row">
                    <span className="label">UAV</span>
                    <span className="val bold-val">{selectedUavId}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Thời gian bắt đầu</span>
                    <span className="val">18:20 13/05/2024</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Thời gian dự kiến</span>
                    <span className="val">19:20 13/05/2024</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Waypoints</span>
                    <span className="val bold-val">12 / 15</span>
                  </div>
                </div>

                <div className="mission-progress-container">
                  <div className="progress-track">
                    <div className="progress-fill-bar" style={{ width: "65%" }} />
                  </div>
                  <span className="progress-pct-text">65%</span>
                </div>
              </div>

              {/* RIGHT HALF: TACTICAL MINI MAP */}
              <div className="map-info-half">
                <MiniMap uavPosition={payload?.uav_status?.gps} />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: UAV TELEMETRY & CAMERA CONTROLS */}
        <div className="overview-right-col">
          {/* PANEL 1: TRẠNG THÁI UAV */}
          <div className="uav-status-card">
            <div className="uav-card-top-bar">
              <span className="panel-title">TRẠNG THÁI UAV</span>
              <div className="uav-select-pill">
                <select
                  value={selectedUavId}
                  onChange={(e) => setSelectedUavId(e.target.value)}
                >
                  <option value="UAV_01">UAV_01</option>
                  <option value="UAV_02">UAV_02</option>
                  <option value="UAV_03">UAV_03</option>
                  <option value="UAV_04">UAV_04</option>
                </select>
                <ChevronDown size={14} className="select-arrow" />
              </div>
            </div>

            {/* DRONE PHOTOREALISTIC PREVIEW */}
            <div className="drone-preview-box">
              <img
                src="/uav_drone.png"
                alt="UAV Drone Model"
                className="drone-render-img"
              />
            </div>

            {/* TELEMETRY PARAMETER TABLE */}
            <div className="telemetry-param-list">
              <div className="param-row">
                <span className="p-label">Trạng thái</span>
                <span className="p-val green-text bold-text">ĐANG BAY</span>
              </div>

              <div className="param-row battery-row">
                <span className="p-label">Pin</span>
                <div className="p-val battery-val-group">
                  <div className="battery-meter-bar">
                    <div className="battery-fill-green" style={{ width: "78%" }} />
                  </div>
                  <span className="pct-num green-text">78%</span>
                </div>
              </div>

              <div className="param-row">
                <span className="p-label">Thời gian bay</span>
                <span className="p-val">28:45</span>
              </div>

              <div className="param-row">
                <span className="p-label">Khoảng cách</span>
                <span className="p-val">5.2 km</span>
              </div>

              <div className="param-row">
                <span className="p-label">Độ cao</span>
                <span className="p-val">120 m</span>
              </div>

              <div className="param-row">
                <span className="p-label">Tốc độ</span>
                <span className="p-val">45.2 km/h</span>
              </div>

              <div className="param-row">
                <span className="p-label">GPS</span>
                <span className="p-val">12</span>
              </div>

              <div className="param-row">
                <span className="p-label">Tín hiệu</span>
                <span className="p-val green-text signal-val">
                  <Wifi size={13} /> Strong
                </span>
              </div>
            </div>

            <button
              className="uav-detail-btn"
              onClick={() => onNavigateTab && onNavigateTab("uavs")}
            >
              Xem chi tiết
            </button>
          </div>

          {/* PANEL 2: ĐIỀU KHIỂN CAMERA (EXACT USER IMAGE REFERENCE) */}
          <div className="camera-control-card">
            <div className="panel-title">ĐIỀU KHIỂN CAMERA</div>

            {/* EO / IR MODE TOGGLES */}
            <div className="camera-mode-pills">
              <button
                className={`mode-pill ${cameraMode === "EO" ? "active" : ""}`}
                onClick={() => setCameraMode("EO")}
              >
                EO
              </button>
              <button
                className={`mode-pill ${cameraMode === "IR" ? "active" : ""}`}
                onClick={() => setCameraMode("IR")}
              >
                IR
              </button>
            </div>

            {/* D-PAD & VERTICAL ZOOM CONTROLLER */}
            <div className="ptz-controller-wrapper">
              {/* CIRCULAR D-PAD DISC */}
              <div className="ptz-dpad-disc-exact">
                <button className="dpad-btn-pad up" title="Tilt Up">
                  <ChevronUp size={20} strokeWidth={2.5} />
                </button>
                <div className="dpad-mid-row">
                  <button className="dpad-btn-pad left" title="Pan Left">
                    <ChevronLeft size={20} strokeWidth={2.5} />
                  </button>
                  <button className="dpad-center-circle" title="Center Lens">
                    <div className="center-dot-inner" />
                  </button>
                  <button className="dpad-btn-pad right" title="Pan Right">
                    <ChevronRight size={20} strokeWidth={2.5} />
                  </button>
                </div>
                <button className="dpad-btn-pad down" title="Tilt Down">
                  <ChevronDown size={20} strokeWidth={2.5} />
                </button>
              </div>

              {/* VERTICAL ZOOM CAPSULE SLIDER */}
              <div className="vertical-zoom-capsule-panel-ptz">
                <button className="capsule-zoom-btn" onClick={() => handlePtzZoomChange(0.5)}>
                  <Plus size={16} />
                </button>
                
                <div className="capsule-ruler-scale">
                  <div className="ruler-line" />
                  <div className="ruler-line short" />
                  <div className="ruler-line" />
                </div>

                <span className="capsule-zoom-val">{ptzZoom.toFixed(1)}X</span>

                <div className="capsule-ruler-scale">
                  <div className="ruler-line" />
                  <div className="ruler-line short" />
                  <div className="ruler-line" />
                </div>

                <button className="capsule-zoom-btn" onClick={() => handlePtzZoomChange(-0.5)}>
                  <Minus size={16} />
                </button>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="camera-action-buttons">
              <button className="cam-act-btn photo-btn" onClick={handleSnapshot}>
                <Camera size={18} /> Chụp ảnh
              </button>
              <button
                className={`cam-act-btn video-btn ${isRecording ? "recording" : ""}`}
                onClick={() => setIsRecording(!isRecording)}
              >
                <span className={`red-rec-circle-solid ${isRecording ? "pulsate" : ""}`} />
                {isRecording ? "Đang quay..." : "Quay video"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3: BOTTOM TICKER / ALERT BAR */}
      <div className="overview-alert-ticker">
        <div className="ticker-label">CẢNH BÁO GẦN NHẤT</div>

        <div className="ticker-items-container">
          <div className="ticker-item danger">
            <span className="dot red-dot" />
            <span className="timestamp">18:35:21</span>
            <span className="alert-text">UAV_04: Mất tín hiệu GPS tạm thời</span>
          </div>

          <div className="ticker-item warning">
            <span className="dot orange-dot" />
            <span className="timestamp">18:32:10</span>
            <span className="alert-text">Pin UAV_03 yếu: 20%</span>
          </div>

          <div className="ticker-item danger">
            <span className="dot red-dot" />
            <span className="timestamp">18:20:05</span>
            <span className="alert-text">Mục tiêu rời khỏi vùng theo dõi</span>
          </div>
        </div>

        <button
          className="view-all-alerts-link"
          onClick={() => onNavigateTab && onNavigateTab("logs")}
        >
          Xem tất cả <ExternalLink size={13} />
        </button>
      </div>
    </div>
  );
}
