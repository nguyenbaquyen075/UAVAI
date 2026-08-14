import { useEffect, useState } from "react";
import { API_BASE } from "../api";
import LiveTacticalMap from "../components/LiveTacticalMap";
import ThermalSensorView from "../components/ThermalSensorView";
import PTZCameraControls from "../components/PTZCameraControls";
import SignalBitrateCharts from "../components/SignalBitrateCharts";

export default function LiveMonitoring({ payload }) {
  const [selectedUav, setSelectedUav] = useState("UAV_02 - Eagle Pro");
  const [isRecording, setIsRecording] = useState(true);
  const [recordSeconds, setRecordSeconds] = useState(872); // 00:14:32
  const [currentTime, setCurrentTime] = useState("");
  const [activeTargetId, setActiveTargetId] = useState("01");

  // Real-time digital clock effect
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
      setCurrentTime(`${timeStr} ${dateStr}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Recording counter timer
  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setRecordSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatRecTime = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const targetsList = [
    { id: "01", name: "Phương tiện khả nghi 01", status: "Đang theo dõi", color: "red" },
    { id: "02", name: "Nhóm người khả nghi 01", status: "Chưa tiếp cận", color: "orange" },
    { id: "03", name: "Phương tiện khả nghi 02", status: "Chưa tiếp cận", color: "green" },
    { id: "04", name: "Vật thể lạ", status: "Đã xác định", color: "yellow" },
    { id: "05", name: "Nhóm người", status: "Đã xác định", color: "blue" },
    { id: "06", name: "Phương tiện khả nghi 03", status: "Chưa tiếp cận", color: "blue" },
  ];

  const alertsList = [
    { id: 1, text: "Mục tiêu rời khỏi khu vực theo dõi", time: "18:41:32", severity: "danger" },
    { id: 2, text: "Tín hiệu GPS yếu", time: "18:40:21", severity: "warning" },
    { id: 3, text: "Pin UAV_02 dưới 20%", time: "18:39:10", severity: "warning" },
    { id: 4, text: "UAV_01 đến gần khu vực mục tiêu", time: "18:37:55", severity: "info" },
  ];

  const handleSnapshot = () => {
    const a = document.createElement("a");
    a.href = `${API_BASE}/api/snapshot`;
    a.download = `snapshot_${Date.now()}.jpg`;
    a.click();
  };

  return (
    <div className="live-monitoring-page">
      {/* Sub Header & Top Bar Telemetry Status */}
      <div className="live-sub-header">
        <div className="header-left">
          <div className="uav-selector-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            <span className="sub-title-label">THEO DÕI TRỰC TIẾP</span>
            <span className="dot-divider">•</span>
            <select
              className="uav-dropdown"
              value={selectedUav}
              onChange={(e) => setSelectedUav(e.target.value)}
            >
              <option value="UAV_02 - Eagle Pro">UAV_02 - Eagle Pro</option>
              <option value="UAV_01 - Scout One">UAV_01 - Scout One</option>
              <option value="UAV_03 - Falcon X">UAV_03 - Falcon X</option>
            </select>
          </div>
        </div>

        <div className="header-right-telemetry">
          <div className="telemetry-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="2" x2="12" y2="22"></line>
              <line x1="2" y1="12" x2="22" y2="12"></line>
            </svg>
            <span>GPS <strong>12</strong></span>
          </div>

          <div className="telemetry-pill green">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
              <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
              <line x1="12" y1="20" x2="12.01" y2="20"></line>
            </svg>
            <span>Liên kết <strong>Strong</strong></span>
          </div>

          <div className="telemetry-pill green">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="6" width="18" height="12" rx="2" ry="2"></rect>
              <line x1="23" y1="11" x2="23" y2="13"></line>
            </svg>
            <span>Pin <strong>78%</strong></span>
          </div>

          <div className="telemetry-pill clock-pill">
            <span>{currentTime || "18:42:10 13/05/2024"}</span>
          </div>

          <div className="user-profile-badge">
            <div className="avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e6e8ec" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="user-info">
              <span className="username">admin</span>
              <span className="user-role">Quản trị viên</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top 8 Telemetry Cards Bar */}
      <div className="top-telemetry-grid">
        {/* Card 1 */}
        <div className="tele-card">
          <div className="tele-card-header">
            <span className="label">TRẠNG THÁI</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
          </div>
          <div className="tele-card-body">
            <div className="status-badge-live">
              <span className="pulse-dot"></span>
              <strong>ĐANG BAY</strong>
            </div>
            <span className="sub-detail">● Tự động</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="tele-card">
          <div className="tele-card-header">
            <span className="label">TỐC ĐỘ</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa2b1" stroke-width="2">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 4a6 6 0 1 1-6 6 6 6 0 0 1 6-6z"></path>
              <line x1="12" y1="12" x2="16" y2="8"></line>
            </svg>
          </div>
          <div className="tele-card-body">
            <div className="main-val">45 <span className="unit">km/h</span></div>
            <span className="sub-detail">Ground: 48 km/h</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="tele-card">
          <div className="tele-card-header">
            <span className="label">ĐỘ CAO</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa2b1" stroke-width="2">
              <path d="M12 19V5M5 12l7-7 7 7"></path>
            </svg>
          </div>
          <div className="tele-card-body">
            <div className="main-val">120 <span className="unit">m</span></div>
            <span className="sub-detail">AGL: 98 m</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="tele-card">
          <div className="tele-card-header">
            <span className="label">KHOẢNG CÁCH</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa2b1" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            </svg>
          </div>
          <div className="tele-card-body">
            <div className="main-val">5.2 <span className="unit">km</span></div>
            <span className="sub-detail">Home: 2.1 km</span>
          </div>
        </div>

        {/* Card 5 */}
        <div className="tele-card">
          <div className="tele-card-header">
            <span className="label">THỜI GIAN BAY</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9aa2b1" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="tele-card-body">
            <div className="main-val">28:45</div>
            <span className="sub-detail">Còn lại: 32:15</span>
          </div>
        </div>

        {/* Card 6 */}
        <div className="tele-card">
          <div className="tele-card-header">
            <span className="label">PIN CÒN LẠI</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2">
              <rect x="1" y="6" width="18" height="12" rx="2" ry="2"></rect>
              <line x1="23" y1="11" x2="23" y2="13"></line>
            </svg>
          </div>
          <div className="tele-card-body">
            <div className="main-val green-val">78%</div>
            <span className="sub-detail">22.8V / 15.6Ah</span>
          </div>
        </div>

        {/* Card 7 */}
        <div className="tele-card">
          <div className="tele-card-header">
            <span className="label">GPS</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="2" x2="12" y2="22"></line>
            </svg>
          </div>
          <div className="tele-card-body">
            <div className="main-val">12</div>
            <span className="sub-detail green-text">Strong</span>
          </div>
        </div>

        {/* Card 8 */}
        <div className="tele-card">
          <div className="tele-card-header">
            <span className="label">TÍN HIỆU</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2">
              <line x1="18" y1="20" x2="18" y2="10"></line>
              <line x1="12" y1="20" x2="12" y2="4"></line>
              <line x1="6" y1="20" x2="6" y2="14"></line>
            </svg>
          </div>
          <div className="tele-card-body">
            <div className="main-val">-65 <span className="unit">dBm</span></div>
            <span className="sub-detail green-text">Strong</span>
          </div>
        </div>
      </div>

      {/* Middle Split Section: Main Stream HUD + Right Column */}
      <div className="middle-dashboard-split">
        {/* Left / Center Column: Live Camera Video HUD Stream */}
        <div className="main-video-hud-container">
          <div className="video-stream-wrapper">
            <img className="hud-video-feed" src={`${API_BASE}/video`} alt="UAV Surveillance Stream" />

            {/* Top Left HUD Camera Specs Overlay */}
            <div className="hud-overlay-top-left">
              <div><strong>CAMERA:</strong> EO/IR</div>
              <div><strong>RES:</strong> 1080p 30fps</div>
              <div><strong>FOV:</strong> 12.6°</div>
              <div><strong>MODE:</strong> TRACK</div>
            </div>

            {/* Top Compass Strip Overlay */}
            <div className="hud-compass-bar">
              <span className="compass-mark">W</span>
              <span className="compass-mark">285</span>
              <span className="compass-mark">300</span>
              <span className="compass-mark active-heading">NW</span>
              <span className="compass-mark">330</span>
              <span className="compass-mark">345</span>
              <span className="compass-mark">N</span>
              <span className="compass-mark">15</span>
              <span className="compass-mark">30</span>
              <span className="zoom-badge">ZOOM 5.2X</span>
              <button className="hud-icon-btn" title="Toàn màn hình">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
                </svg>
              </button>
            </div>

            {/* Target Bounding Box Overlay Card */}
            <div className="hud-target-bounding-box">
              <div className="target-reticle-box">
                <div className="corner top-left"></div>
                <div className="corner top-right"></div>
                <div className="corner bottom-left"></div>
                <div className="corner bottom-right"></div>
              </div>
              <div className="target-hud-card">
                <div className="target-card-title">MỤC TIÊU 01</div>
                <div className="target-card-row">Loại: Phương tiện</div>
                <div className="target-card-row">Tốc độ: 45 km/h</div>
                <div className="target-card-row">Hướng: 320° NW</div>
                <div className="target-card-row">Khoảng cách: 120m</div>
              </div>
            </div>

            {/* Left HUD Quick Toolbar */}
            <div className="hud-left-toolbar">
              <button className="hud-tool-btn active" title="Khung nhắm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
              </button>
              <button className="hud-tool-btn" onClick={handleSnapshot} title="Chụp ảnh nhanh">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="13" r="4"></circle>
                </svg>
              </button>
              <button
                className={`hud-tool-btn ${isRecording ? "recording" : ""}`}
                onClick={() => setIsRecording(!isRecording)}
                title={isRecording ? "Dừng ghi hình" : "Bắt đầu ghi hình"}
              >
                <circle cx="12" cy="12" r="6" fill={isRecording ? "#f87171" : "currentColor"}></circle>
              </button>
              <button className="hud-tool-btn" title="Toàn màn hình">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <polyline points="9 21 3 21 3 15"></polyline>
                  <line x1="21" y1="3" x2="14" y2="10"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
              </button>
            </div>

            {/* Right HUD Zoom Bar */}
            <div className="hud-right-zoombar">
              <button className="zoom-step">+</button>
              <div className="zoom-fill-track">
                <div className="zoom-fill" style={{ height: "52%" }}></div>
              </div>
              <span className="zoom-val-text">5.2X</span>
              <button className="zoom-step">-</button>
            </div>

            {/* Bottom HUD Telemetry Overlay Strip */}
            <div className="hud-bottom-telemetry-strip">
              <span>ALT <strong>120 m</strong></span>
              <span>H.SPD <strong>45.2 km/h</strong></span>
              <span>V.SPD <strong>1.2 m/s</strong></span>
              <span>HDG <strong className="green-text">320°</strong></span>
              <span>BAT <strong className="green-text">78%</strong></span>
              <span>GPS <strong>12</strong></span>
              <span>RSSI <strong className="green-text">-65 dBm</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column: Tactical Map + Thermal Sensor View */}
        <div className="right-tactical-column">
          <LiveTacticalMap />
          <ThermalSensorView onSnapshot={handleSnapshot} />
        </div>
      </div>

      {/* Bottom Grid Section: 7 Tactical Control & Info Panels */}
      <div className="bottom-dashboard-grid">
        {/* Panel 1: UAV ĐƯỢC CHỌN */}
        <div className="bottom-grid-card uav-selected-card">
          <div className="panel-title">UAV ĐƯỢC CHỌN</div>
          <div className="uav-profile-box">
            <div className="uav-image-preview">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="1.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </div>
            <div className="uav-meta">
              <h3>UAV_02</h3>
              <p>Eagle Pro</p>
              <span className="badge green-badge">● ĐANG BAY</span>
            </div>
          </div>
          <button className="btn-action-full">ĐỔI UAV</button>
        </div>

        {/* Panel 2: ĐIỀU KHIỂN CAMERA */}
        <div className="bottom-grid-card ptz-card">
          <PTZCameraControls />
        </div>

        {/* Panel 3: GHI HÌNH & CHỤP ẢNH */}
        <div className="bottom-grid-card record-card">
          <div className="panel-title">GHI HÌNH & CHỤP ẢNH</div>
          <div className="recording-status">
            <span className={`rec-dot ${isRecording ? "active" : ""}`}></span>
            <span className="rec-timer">{formatRecTime(recordSeconds)}</span>
          </div>
          <button
            className={`btn-stop-rec ${isRecording ? "active" : ""}`}
            onClick={() => setIsRecording(!isRecording)}
          >
            {isRecording ? "Dừng" : "Bắt đầu"}
          </button>
          <div className="quick-media-actions">
            <button className="media-btn" onClick={handleSnapshot}>
              📷 Chụp ảnh
            </button>
            <button className="media-btn">
              💾 Lưu video
            </button>
          </div>
        </div>

        {/* Panel 4: TRUYỀN TÍN HIỆU */}
        <div className="bottom-grid-card signal-card">
          <SignalBitrateCharts />
        </div>

        {/* Panel 5: THÔNG TIN NHIỆM VỤ */}
        <div className="bottom-grid-card mission-info-card">
          <div className="panel-title">THÔNG TIN NHIỆM VỤ</div>
          <div className="info-list">
            <div className="info-item">
              <span>ID nhiệm vụ</span>
              <strong>MSN_20240513_001</strong>
            </div>
            <div className="info-item">
              <span>Tên nhiệm vụ</span>
              <strong>Tuần tra khu vực biên giới A</strong>
            </div>
            <div className="info-item">
              <span>Mục tiêu</span>
              <strong>6 / 6</strong>
            </div>
            <div className="info-item">
              <span>Thời gian bắt đầu</span>
              <span>18:20 13/05/2024</span>
            </div>
            <div className="info-item">
              <span>Thời gian dự kiến kết thúc</span>
              <span>19:20 13/05/2024</span>
            </div>
          </div>
          <div className="mission-progress-block">
            <div className="progress-labels">
              <span>Tiến độ nhiệm vụ</span>
              <strong>75%</strong>
            </div>
            <div className="progress-bar-track">
              <div className="progress-bar-fill" style={{ width: "75%" }}></div>
            </div>
          </div>
        </div>

        {/* Panel 6: MỤC TIÊU HIỆN TẠI */}
        <div className="bottom-grid-card current-target-card">
          <div className="panel-title">MỤC TIÊU HIỆN TẠI</div>
          <div className="info-list">
            <div className="info-item">
              <span>Mục tiêu</span>
              <strong>01 / 06</strong>
            </div>
            <div className="info-item">
              <span>Loại</span>
              <strong>Phương tiện khả nghi</strong>
            </div>
            <div className="info-item">
              <span>Trạng thái</span>
              <strong className="green-text">Đang theo dõi</strong>
            </div>
            <div className="info-item">
              <span>Tọa độ</span>
              <span>12.3456°N, 106.7890°E</span>
            </div>
            <div className="info-item">
              <span>Độ cao</span>
              <span>120 m</span>
            </div>
          </div>
          <div className="link-action-footer">
            <a href="#targets">Xem chi tiết mục tiêu &gt;</a>
          </div>
        </div>

        {/* Panel 7: DANH SÁCH MỤC TIÊU */}
        <div className="bottom-grid-card targets-list-card">
          <div className="panel-title">DANH SÁCH MỤC TIÊU</div>
          <div className="targets-scroll-list">
            {targetsList.map((tgt) => (
              <div
                key={tgt.id}
                className={`target-row-item ${activeTargetId === tgt.id ? "selected" : ""}`}
                onClick={() => setActiveTargetId(tgt.id)}
              >
                <span className={`target-dot ${tgt.color}`}>●</span>
                <span className="target-num">{tgt.id}</span>
                <span className="target-name">{tgt.name}</span>
                <span className={`target-status ${tgt.color}`}>{tgt.status}</span>
              </div>
            ))}
          </div>
          <div className="link-action-footer">
            <a href="#all-targets">Xem tất cả mục tiêu &gt;</a>
          </div>
        </div>

        {/* Panel 8: CẢNH BÁO TRỰC TIẾP */}
        <div className="bottom-grid-card alerts-live-card">
          <div className="panel-title-row">
            <span className="panel-title">CẢNH BÁO TRỰC TIẾP</span>
            <a href="#alerts" className="link-top">Xem tất cả &gt;</a>
          </div>
          <div className="alerts-scroll-list">
            {alertsList.map((alt) => (
              <div key={alt.id} className={`alert-feed-item ${alt.severity}`}>
                <div className="alert-feed-icon">
                  {alt.severity === "danger" ? "⚠️" : alt.severity === "warning" ? "⚠️" : "ℹ️"}
                </div>
                <div className="alert-feed-text">{alt.text}</div>
                <div className="alert-feed-time">{alt.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
