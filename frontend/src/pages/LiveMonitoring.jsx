import { useState } from "react";
import {
  Crosshair,
  Wifi,
  Battery,
  User,
  Gauge,
  ArrowUp,
  MapPin,
  Clock,
  SignalHigh,
  Camera,
  Save,
  AlertTriangle,
  Info,
  Layers,
} from "lucide-react";
import TacticalVideoHUD from "../components/TacticalVideoHUD";
import LiveTacticalMap from "../components/LiveTacticalMap";
import ThermalSensorView from "../components/ThermalSensorView";
import PTZCameraControls from "../components/PTZCameraControls";
import SignalBitrateCharts from "../components/SignalBitrateCharts";

export default function LiveMonitoring({ payload }) {
  const [selectedUavId, setSelectedUavId] = useState(2);
  const [cameraMode, setCameraMode] = useState("EO");

  return (
    <div className="live-monitoring-page-v2">
      {/* Top 8 Telemetry Stat Cards Grid */}
      <div className="top-telemetry-grid-8">
        <div className="tele-card-v2">
          <div className="tele-card-header">
            <span className="label">TRẠNG THÁI</span>
            <span className="badge-pill-live">ĐANG BAY</span>
          </div>
          <div className="tele-card-body">
            <span className="sub-detail-green">◆ Tự động</span>
          </div>
        </div>

        <div className="tele-card-v2">
          <div className="tele-card-header">
            <span className="label">TỐC ĐỘ</span>
            <Gauge size={14} color="#64748b" />
          </div>
          <div className="tele-card-body">
            <div className="main-val">
              45 <span className="unit">km/h</span>
            </div>
            <span className="sub-detail-muted">Ground: 48 km/h</span>
          </div>
        </div>

        <div className="tele-card-v2">
          <div className="tele-card-header">
            <span className="label">ĐỘ CAO</span>
            <ArrowUp size={14} color="#64748b" />
          </div>
          <div className="tele-card-body">
            <div className="main-val">
              120 <span className="unit">m</span>
            </div>
            <span className="sub-detail-muted">AGL: 98 m</span>
          </div>
        </div>

        <div className="tele-card-v2">
          <div className="tele-card-header">
            <span className="label">KHOẢNG CÁCH</span>
            <MapPin size={14} color="#64748b" />
          </div>
          <div className="tele-card-body">
            <div className="main-val">
              5.2 <span className="unit">km</span>
            </div>
            <span className="sub-detail-muted">Home: 2.1 km</span>
          </div>
        </div>

        <div className="tele-card-v2">
          <div className="tele-card-header">
            <span className="label">THỜI GIAN BAY</span>
            <Clock size={14} color="#64748b" />
          </div>
          <div className="tele-card-body">
            <div className="main-val">28:45</div>
            <span className="sub-detail-muted">Còn lại: 32:15</span>
          </div>
        </div>

        <div className="tele-card-v2">
          <div className="tele-card-header">
            <span className="label">PIN CÒN LẠI</span>
            <Battery size={14} color="#4ade80" />
          </div>
          <div className="tele-card-body">
            <div className="main-val green-val">78%</div>
            <span className="sub-detail-muted">22.8V / 15.6Ah</span>
          </div>
        </div>

        <div className="tele-card-v2">
          <div className="tele-card-header">
            <span className="label">GPS</span>
            <Crosshair size={14} color="#4ade80" />
          </div>
          <div className="tele-card-body">
            <div className="main-val">12</div>
            <span className="sub-detail-green">Strong</span>
          </div>
        </div>

        <div className="tele-card-v2">
          <div className="tele-card-header">
            <span className="label">TÍN HIỆU</span>
            <SignalHigh size={14} color="#4ade80" />
          </div>
          <div className="tele-card-body">
            <div className="main-val green-val">-65 dBm</div>
            <span className="sub-detail-green">Strong</span>
          </div>
        </div>
      </div>

      {/* Middle Split Section: Tactical Video HUD + Right Stack */}
      <div className="middle-dashboard-split-v2">
        <div className="main-video-hud-box">
          <TacticalVideoHUD
            isLive={true}
            telemetry={{ lat: 21.031, lon: 105.855, speed_kmh: 45.2, altitude_m: 120 }}
            latencyMs={35}
            objects={[
              {
                id: "01",
                label: "MỤC TIÊU 01",
                type: "Phương tiện",
                speed: "45 km/h",
                distance: "120m",
                heading: "320° NW",
                top: "42%",
                left: "48%",
              },
            ]}
          />
        </div>

        <div className="right-tactical-column-v2">
          {/* Top Card: VỊ TRÍ UAV (Mini Tactical Map) */}
          <div className="dashboard-panel mini-map-card">
            <div className="sidebar-card-header">
              <h3 className="sidebar-title">VỊ TRÍ UAV</h3>
              <div className="mini-map-actions">
                <span className="btn-mini-mode">2D</span>
                <button className="icon-tool-btn"><Layers size={13} /></button>
              </div>
            </div>

            <div className="mini-map-body-container">
              <LiveTacticalMap
                uavPos={[21.031, 105.855]}
                targetPos={[21.026, 105.86]}
                distance="120 m"
              />
              <div className="mini-map-bottom-info">
                <span>Khoảng cách đến mục tiêu: <strong>120 m</strong></span>
                <span>ETA: <strong>00:02:15</strong></span>
              </div>
            </div>
          </div>

          {/* Bottom Card: CẢM BIẾN (IR / Thermal Video Feed) */}
          <div className="dashboard-panel thermal-card">
            <div className="sidebar-card-header">
              <h3 className="sidebar-title">CẢM BIẾN</h3>
              <div className="sensor-mode-tabs">
                <button className={`tab-btn ${cameraMode === "EO" ? "active" : ""}`} onClick={() => setCameraMode("EO")}>EO</button>
                <button className={`tab-btn ${cameraMode === "IR" ? "active" : ""}`} onClick={() => setCameraMode("IR")}>IR</button>
                <button className={`tab-btn ${cameraMode === "Laser" ? "active" : ""}`} onClick={() => setCameraMode("Laser")}>Laser</button>
              </div>
            </div>

            <div className="thermal-body-container">
              <ThermalSensorView />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section Layout: Dedicated Left Tall Card + 2 Rows Grid */}
      <div className="bottom-dashboard-wrapper">
        {/* Left Column: UAV được chọn (Tall card spanning both rows) */}
        <div className="dashboard-panel uav-selected-tall-card">
          <span className="uav-hdr-text">UAV được chọn</span>
          <div className="uav-tall-body">
            <img src="/uav_drone.png" alt="UAV Drone" className="uav-tall-drone-img" />
            <div className="uav-tall-meta">
              <h4 className="uav-tall-title">UAV_02</h4>
              <p className="uav-tall-sub">Eagle Pro</p>
              <span className="badge-green-glow">● ĐANG BAY</span>
            </div>
            <button className="btn-change-uav-tall">Đổi UAV</button>
          </div>
        </div>

        {/* Right Container: Row 1 (Controls) & Row 2 (Info) */}
        <div className="bottom-right-rows-container">
          {/* Row 1: 3 Control Cards */}
          <div className="bottom-row-1-grid">
            {/* Card 1: ĐIỀU KHIỂN CAMERA (Wider 1.8fr width!) */}
            <div className="dashboard-panel btm-panel ptz-panel">
              <div className="panel-section-header">
                <h3 className="section-title">ĐIỀU KHIỂN CAMERA</h3>
              </div>
              <PTZCameraControls />
            </div>

            {/* Card 2: GHI HÌNH & CHỤP ẢNH */}
            <div className="dashboard-panel btm-panel record-panel">
              <div className="panel-section-header">
                <h3 className="section-title">GHI HÌNH & CHỤP ẢNH</h3>
              </div>
              <div className="rec-timer-block">
                <span className="rec-red-dot">🔴</span>
                <span className="rec-timer-val">00:14:32</span>
              </div>
              <button className="btn-rec-stop">Dừng</button>
              <div className="rec-action-row">
                <button className="btn-rec-act"><Camera size={13} /> Chụp ảnh</button>
                <button className="btn-rec-act"><Save size={13} /> Lưu video</button>
              </div>
            </div>

            {/* Card 3: TRUYỀN TÍN HIỆU */}
            <div className="dashboard-panel btm-panel signal-panel">
              <div className="panel-section-header">
                <h3 className="section-title">TRUYỀN TÍN HIỆU</h3>
              </div>
              <SignalBitrateCharts />
            </div>
          </div>

          {/* Row 2: 4 Info Cards */}
          <div className="bottom-row-2-grid">
            {/* Card 1: THÔNG TIN NHIỆM VỤ */}
            <div className="dashboard-panel btm-panel mission-panel">
              <div className="panel-section-header">
                <h3 className="section-title">THÔNG TIN NHIỆM VỤ</h3>
              </div>
              <div className="info-kv-list">
                <div className="kv-row"><span className="k">ID nhiệm vụ</span><span className="v mono">MSN_20240513_001</span></div>
                <div className="kv-row"><span className="k">Tên nhiệm vụ</span><span className="v font-semibold">Tuần tra khu vực biên giới A</span></div>
                <div className="kv-row"><span className="k">Mục tiêu</span><span className="v">6 / 6</span></div>
                <div className="kv-row"><span className="k">Thời gian bắt đầu</span><span className="v text-xs">18:20 13/05/2024</span></div>
                <div className="kv-row"><span className="k">Thời gian dự kiến kết thúc</span><span className="v text-xs">19:20 13/05/2024</span></div>
              </div>
              <div className="mission-progress-bar-block">
                <div className="progress-lbl-row"><span>Tiến độ nhiệm vụ</span><span className="font-semibold">75%</span></div>
                <div className="progress-track"><div className="progress-fill-emerald" style={{ width: "75%" }} /></div>
              </div>
            </div>

            {/* Card 2: MỤC TIÊU HIỆN TẠI */}
            <div className="dashboard-panel btm-panel target-current-panel">
              <div className="panel-section-header">
                <h3 className="section-title">MỤC TIÊU HIỆN TẠI</h3>
              </div>
              <div className="info-kv-list">
                <div className="kv-row"><span className="k">Mục tiêu</span><span className="v mono font-bold">01 / 06</span></div>
                <div className="kv-row"><span className="k">Loại</span><span className="v font-semibold">Phương tiện khả nghi</span></div>
                <div className="kv-row"><span className="k">Trạng thái</span><span className="v text-emerald-400 font-semibold">Đang theo dõi</span></div>
                <div className="kv-row"><span className="k">Tọa độ</span><span className="v text-xs">12.3456°N, 106.7890°E</span></div>
                <div className="kv-row"><span className="k">Độ cao</span><span className="v">120 m</span></div>
              </div>
              <button className="btn-link-action">Xem chi tiết mục tiêu &gt;</button>
            </div>

            {/* Card 3: DANH SÁCH MỤC TIÊU */}
            <div className="dashboard-panel btm-panel target-list-panel">
              <div className="panel-section-header">
                <h3 className="section-title">DANH SÁCH MỤC TIÊU</h3>
              </div>
              <div className="target-small-list">
                <div className="tgt-sm-item"><span className="dot dot-red">●</span><span className="id">01</span><span className="name">Phương tiện khả nghi 01</span><span className="st st-green">Đang theo dõi</span></div>
                <div className="tgt-sm-item"><span className="dot dot-green">●</span><span className="id">02</span><span className="name">Nhóm người khả nghi</span><span className="st st-grey">Chưa tiếp cận</span></div>
                <div className="tgt-sm-item"><span className="dot dot-green">●</span><span className="id">03</span><span className="name">Phương tiện khả nghi 02</span><span className="st st-grey">Chưa tiếp cận</span></div>
                <div className="tgt-sm-item"><span className="dot dot-orange">●</span><span className="id">04</span><span className="name">Vật thể lạ</span><span className="st st-orange">Đã xác định</span></div>
                <div className="tgt-sm-item"><span className="dot dot-blue">●</span><span className="id">05</span><span className="name">Nhóm người</span><span className="st st-orange">Đã xác định</span></div>
                <div className="tgt-sm-item"><span className="dot dot-blue">●</span><span className="id">06</span><span className="name">Phương tiện khả nghi 03</span><span className="st st-grey">Chưa tiếp cận</span></div>
              </div>
              <button className="btn-link-action">Xem tất cả mục tiêu &gt;</button>
            </div>

            {/* Card 4: CẢNH BÁO TRỰC TIẾP */}
            <div className="dashboard-panel btm-panel alerts-live-panel">
              <div className="panel-section-header">
                <h3 className="section-title">CẢNH BÁO TRỰC TIẾP</h3>
                <button className="btn-view-all">Xem tất cả &gt;</button>
              </div>
              <div className="live-alerts-feed">
                <div className="alert-row danger">
                  <AlertTriangle size={14} className="ic" />
                  <div className="txt-block">
                    <span className="title">Mục tiêu rời khỏi khu vực theo dõi</span>
                    <span className="time">18:41:32 &gt;</span>
                  </div>
                </div>
                <div className="alert-row warn">
                  <AlertTriangle size={14} className="ic" />
                  <div className="txt-block">
                    <span className="title">Tín hiệu GPS yếu</span>
                    <span className="time">18:40:21 &gt;</span>
                  </div>
                </div>
                <div className="alert-row warn">
                  <AlertTriangle size={14} className="ic" />
                  <div className="txt-block">
                    <span className="title">Pin UAV_02 dưới 20%</span>
                    <span className="time">18:39:10 &gt;</span>
                  </div>
                </div>
                <div className="alert-row info">
                  <Info size={14} className="ic" />
                  <div className="txt-block">
                    <span className="title">UAV_01 đến gần khu vực mục tiêu</span>
                    <span className="time">18:37:55 &gt;</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
