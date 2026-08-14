import { useEffect, useState } from "react";
import FullTacticalMap from "../components/FullTacticalMap";
import MapInfoSidebar from "../components/MapInfoSidebar";

export default function MapView() {
  const [cursorPos, setCursorPos] = useState({ lat: "21.027123", lng: "105.854567", alt: 48 });
  const [currentTime, setCurrentTime] = useState("");
  const [layers, setLayers] = useState({
    satellite: true,
    streets: true,
    terrain: false,
    nofly: true,
    hazard: true,
    targets: true,
    uavs: true,
    poi: false,
  });

  // Real-time digital clock
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

  const handleToggleLayer = (key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const uavList = [
    { id: "UAV_01", model: "Falcon 8X", status: "Đang bay", battery: 78, color: "green" },
    { id: "UAV_02", model: "Eagle Pro", status: "Đang bay", battery: 78, color: "green" },
    { id: "UAV_03", model: "SkyEye 4K", status: "Đang theo dõi", battery: 62, color: "yellow" },
    { id: "UAV_04", model: "Phantom 4 RTK", status: "Đang bay", battery: 92, color: "green" },
  ];

  const poiList = [
    { id: "POI_01", name: "Trạm biến áp 110kV", coords: "21.027650° N, 105.851200° E", color: "purple" },
    { id: "POI_02", name: "Kho xăng dầu", coords: "21.024100° N, 105.848900° E", color: "orange" },
    { id: "POI_03", name: "Cầu Đông Trù", coords: "21.030500° N, 105.857800° E", color: "blue" },
    { id: "POI_04", name: "Bệnh viện đa khoa", coords: "21.021800° N, 105.852600° E", color: "red" },
  ];

  const pinnedCoords = [
    { id: 1, text: "21.028500° N, 105.849200° E" },
    { id: 2, text: "21.027100° N, 105.855300° E" },
    { id: 3, text: "21.023900° N, 105.857100° E" },
    { id: 4, text: "21.022800° N, 105.852400° E" },
    { id: 5, text: "21.025600° N, 105.847800° E" },
  ];

  return (
    <div className="map-page-layout">
      {/* Sub Header & Telemetry Status */}
      <div className="live-sub-header">
        <div className="header-left">
          <div className="uav-selector-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
            <span className="sub-title-label">BẢN ĐỒ</span>
            <span className="dot-divider">/</span>
            <span className="breadcrumb-sub">Trang chủ &gt; Bản đồ</span>
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

      {/* Top 5 Summary Metrics Bar */}
      <div className="map-top-summary-grid">
        {/* Metric 1 */}
        <div className="summary-card">
          <div className="sum-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <div className="sum-info">
            <span className="sum-label">UAV HOẠT ĐỘNG</span>
            <div className="sum-value">4 <span className="sub-slash">/ 6</span></div>
            <div className="sum-sub-status">
              <span className="green-dot">●</span> 4 online &nbsp;
              <span className="grey-dot">●</span> 2 offline
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="summary-card">
          <div className="sum-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
            </svg>
          </div>
          <div className="sum-info">
            <span className="sum-label">NHIỆM VỤ ĐANG THỰC HIỆN</span>
            <div className="sum-value">2</div>
            <a href="#missions" className="sum-link">Xem chi tiết</a>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="summary-card">
          <div className="sum-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#facc15" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
          </div>
          <div className="sum-info">
            <span className="sum-label">MỤC TIÊU ĐANG THEO DÕI</span>
            <div className="sum-value">6</div>
            <a href="#targets" className="sum-link">Xem chi tiết</a>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="summary-card">
          <div className="sum-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <div className="sum-info">
            <span className="sum-label">CẢNH BÁO</span>
            <div className="sum-value">3</div>
            <a href="#alerts" className="sum-link warn-link">Xem chi tiết</a>
          </div>
        </div>

        {/* Metric 5: Weather */}
        <div className="summary-card weather-card">
          <div className="weather-left">
            <span className="cloud-icon">☁️</span>
            <div className="temp-val">28°C</div>
            <span className="weather-desc">Nhiều mây</span>
          </div>
          <div className="weather-details">
            <div>Gió: <strong>12 km/h</strong></div>
            <div>Độ ẩm: <strong>72%</strong></div>
          </div>
        </div>
      </div>

      {/* Main Split View: Map + Sidebar */}
      <div className="map-main-split">
        <FullTacticalMap cursorPos={cursorPos} onCursorMove={setCursorPos} activeLayers={layers} />
        <MapInfoSidebar cursorPos={cursorPos} layers={layers} onToggleLayer={handleToggleLayer} />
      </div>

      {/* Bottom Grid: 3 Panels */}
      <div className="map-bottom-grid">
        {/* Panel 1: DANH SÁCH UAV */}
        <div className="map-bottom-card">
          <div className="panel-title">DANH SÁCH UAV</div>
          <div className="map-uav-list">
            {uavList.map((uav) => (
              <div key={uav.id} className="map-uav-item">
                <div className="uav-item-icon">🛸</div>
                <div className="uav-item-meta">
                  <div className="uav-item-id">{uav.id}</div>
                  <div className="uav-item-model">{uav.model}</div>
                </div>
                <span className={`uav-status-badge ${uav.color}`}>{uav.status}</span>
                <div className="uav-battery-bar">
                  <strong>{uav.battery}%</strong>
                  <div className="bat-track">
                    <div className="bat-fill" style={{ width: `${uav.battery}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="link-action-footer">
            <a href="#uavs">Xem tất cả UAV &gt;</a>
          </div>
        </div>

        {/* Panel 2: ĐIỂM QUAN TÂM (POI) */}
        <div className="map-bottom-card">
          <div className="panel-title-row">
            <span className="panel-title">ĐIỂM QUAN TÂM (POI)</span>
            <button className="add-btn">+ Thêm POI</button>
          </div>
          <div className="map-poi-list">
            {poiList.map((poi) => (
              <div key={poi.id} className="map-poi-item">
                <span className={`poi-icon ${poi.color}`}>★</span>
                <span className="poi-id">{poi.id}</span>
                <span className="poi-name">{poi.name}</span>
                <span className="poi-coords">{poi.coords}</span>
              </div>
            ))}
          </div>
          <div className="link-action-footer">
            <a href="#poi">Xem tất cả POI &gt;</a>
          </div>
        </div>

        {/* Panel 3: TỌA ĐỘ ĐÃ ĐÁNH DẤU */}
        <div className="map-bottom-card">
          <div className="panel-title-row">
            <span className="panel-title">TỌA ĐỘ ĐÃ ĐÁNH DẤU</span>
            <button className="add-btn">+ Thêm tọa độ</button>
          </div>
          <div className="map-coords-list">
            {pinnedCoords.map((coord) => (
              <div key={coord.id} className="map-coord-item">
                <span className="coord-num-badge">{coord.id}</span>
                <span className="coord-text">{coord.text}</span>
              </div>
            ))}
          </div>
          <div className="link-action-footer danger-link">
            <a href="#clear">🗑️ Xóa tất cả</a>
          </div>
        </div>
      </div>
    </div>
  );
}
