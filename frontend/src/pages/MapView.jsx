import { useState, useEffect } from "react";
import {
  Crosshair,
  Wifi,
  Battery,
  User,
  Plane,
  Briefcase,
  Target,
  AlertTriangle,
  CloudSun,
  Wind,
  Droplets,
  Star,
  Trash2,
  MapPin,
} from "lucide-react";
import FullTacticalMap from "../components/FullTacticalMap";
import MapInfoSidebar from "../components/MapInfoSidebar";

export default function MapView({ payload }) {
  const [cursorPos, setCursorPos] = useState({ lat: "21.027123", lng: "105.854567", alt: "48" });
  const [currentTime, setCurrentTime] = useState("18:42:10 13/05/2024");
  const [layers, setLayers] = useState({
    satellite: true,
    streets: true,
    terrain: false,
    nofly: true,
    hazard: true,
    targets: true,
    uavs: true,
    poi: true,
  });

  const handleToggleLayer = (key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="map-page-layout-v2">
      {/* Top 5 Summary Cards */}
      <div className="map-top-summary-5">
        <div className="sum-card-v2">
          <div className="sum-icon-box icon-blue">
            <Plane size={18} />
          </div>
          <div className="sum-info-group">
            <span className="sum-label">UAV HOẠT ĐỘNG</span>
            <div className="sum-val-row">
              <span className="sum-val">4</span>
              <span className="sum-slash">/ 6</span>
            </div>
            <div className="sum-sub-row">
              <span className="dot-green">● 4 online</span>
              <span className="dot-grey">● 2 offline</span>
            </div>
          </div>
        </div>

        <div className="sum-card-v2">
          <div className="sum-icon-box icon-green">
            <Briefcase size={18} />
          </div>
          <div className="sum-info-group">
            <span className="sum-label">NHIỆM VỤ ĐANG THỰC HIỆN</span>
            <span className="sum-val">2</span>
            <a href="#missions" className="link-detail-green">Xem chi tiết &gt;</a>
          </div>
        </div>

        <div className="sum-card-v2">
          <div className="sum-icon-box icon-orange">
            <Target size={18} />
          </div>
          <div className="sum-info-group">
            <span className="sum-label">MỤC TIÊU ĐANG THEO DÕI</span>
            <span className="sum-val">6</span>
            <a href="#targets" className="link-detail-green">Xem chi tiết &gt;</a>
          </div>
        </div>

        <div className="sum-card-v2">
          <div className="sum-icon-box icon-red">
            <AlertTriangle size={18} />
          </div>
          <div className="sum-info-group">
            <span className="sum-label">CẢNH BÁO</span>
            <span className="sum-val text-red">3</span>
            <a href="#alerts" className="link-detail-orange">Xem chi tiết &gt;</a>
          </div>
        </div>

        <div className="sum-card-v2 weather-sum-card">
          <div className="weather-header-row">
            <CloudSun size={24} color="#f59e0b" />
            <div className="weather-temp-group">
              <span className="temp-val">28°C</span>
              <span className="temp-desc">Nhiều mây</span>
            </div>
          </div>
          <div className="weather-sub-details">
            <span><Wind size={11} /> Gió: <strong>12 km/h</strong></span>
            <span><Droplets size={11} /> Độ ẩm: <strong>72%</strong></span>
          </div>
        </div>
      </div>

      {/* Main Split View: Tactical Map + Right Info Sidebar */}
      <div className="map-main-split-v2">
        <FullTacticalMap
          cursorPos={cursorPos}
          onCursorMove={setCursorPos}
          activeLayers={layers}
        />
        <MapInfoSidebar
          cursorPos={cursorPos}
          layers={layers}
          onToggleLayer={handleToggleLayer}
        />
      </div>

      {/* Bottom Grid: 3 Columns */}
      <div className="map-bottom-3col">
        {/* Column 1: DANH SÁCH UAV */}
        <div className="dashboard-panel map-btm-panel">
          <div className="panel-section-header">
            <h3 className="section-title">DANH SÁCH UAV</h3>
          </div>
          <div className="map-uav-rows">
            <div className="uav-row-item">
              <Plane size={15} className="ic-uav" />
              <div className="uav-name-meta">
                <span className="title">UAV_01</span>
                <span className="sub">Falcon 8X</span>
              </div>
              <span className="status-tag green">Đang bay</span>
              <div className="bat-group">
                <span className="val">78%</span>
                <div className="bat-bar-track"><div className="bat-bar-fill" style={{ width: "78%" }} /></div>
              </div>
            </div>

            <div className="uav-row-item">
              <Plane size={15} className="ic-uav" />
              <div className="uav-name-meta">
                <span className="title">UAV_02</span>
                <span className="sub">Eagle Pro</span>
              </div>
              <span className="status-tag green">Đang bay</span>
              <div className="bat-group">
                <span className="val">78%</span>
                <div className="bat-bar-track"><div className="bat-bar-fill" style={{ width: "78%" }} /></div>
              </div>
            </div>

            <div className="uav-row-item">
              <Plane size={15} className="ic-uav" />
              <div className="uav-name-meta">
                <span className="title">UAV_03</span>
                <span className="sub">SkyEye 4K</span>
              </div>
              <span className="status-tag orange">Đang theo dõi</span>
              <div className="bat-group">
                <span className="val">62%</span>
                <div className="bat-bar-track"><div className="bat-bar-fill" style={{ width: "62%" }} /></div>
              </div>
            </div>

            <div className="uav-row-item">
              <Plane size={15} className="ic-uav" />
              <div className="uav-name-meta">
                <span className="title">UAV_04</span>
                <span className="sub">Phantom 4 RTK</span>
              </div>
              <span className="status-tag green">Đang bay</span>
              <div className="bat-group">
                <span className="val">92%</span>
                <div className="bat-bar-track"><div className="bat-bar-fill" style={{ width: "92%" }} /></div>
              </div>
            </div>
          </div>
          <a href="#uavs" className="btm-link-footer">Xem tất cả UAV</a>
        </div>

        {/* Column 2: ĐIỂM QUAN TÂM (POI) */}
        <div className="dashboard-panel map-btm-panel">
          <div className="panel-section-header">
            <h3 className="section-title">ĐIỂM QUAN TÂM (POI)</h3>
            <button className="btn-add-outline">+ Thêm POI</button>
          </div>
          <div className="poi-rows">
            <div className="poi-row-item">
              <Star size={14} className="poi-star-ic" />
              <span className="poi-code">POI_01</span>
              <span className="poi-title">Trạm biến áp 110kV</span>
              <span className="poi-coord">21.027650° N, 105.851200° E</span>
            </div>
            <div className="poi-row-item">
              <Star size={14} className="poi-star-ic orange" />
              <span className="poi-code">POI_02</span>
              <span className="poi-title">Kho xăng dầu</span>
              <span className="poi-coord">21.024100° N, 105.848900° E</span>
            </div>
            <div className="poi-row-item">
              <Star size={14} className="poi-star-ic blue" />
              <span className="poi-code">POI_03</span>
              <span className="poi-title">Cầu Đông Trù</span>
              <span className="poi-coord">21.030500° N, 105.857800° E</span>
            </div>
            <div className="poi-row-item">
              <Star size={14} className="poi-star-ic red" />
              <span className="poi-code">POI_04</span>
              <span className="poi-title">Bệnh viện đa khoa</span>
              <span className="poi-coord">21.021800° N, 105.852600° E</span>
            </div>
          </div>
          <a href="#pois" className="btm-link-footer">Xem tất cả POI</a>
        </div>

        {/* Column 3: TỌA ĐỘ ĐÃ ĐÁNH DẤU */}
        <div className="dashboard-panel map-btm-panel">
          <div className="panel-section-header">
            <h3 className="section-title">TỌA ĐỘ ĐÃ ĐÁNH DẤU</h3>
            <button className="btn-add-outline">+ Thêm tọa độ</button>
          </div>
          <div className="coord-marks-rows">
            <div className="mark-row-item">
              <MapPin size={14} className="mark-pin-ic" />
              <span className="mark-text">21.028500° N, 105.849200° E</span>
            </div>
            <div className="mark-row-item">
              <MapPin size={14} className="mark-pin-ic" />
              <span className="mark-text">21.027100° N, 105.855300° E</span>
            </div>
            <div className="mark-row-item">
              <MapPin size={14} className="mark-pin-ic" />
              <span className="mark-text">21.023900° N, 105.857100° E</span>
            </div>
            <div className="mark-row-item">
              <MapPin size={14} className="mark-pin-ic" />
              <span className="mark-text">21.022800° N, 105.852400° E</span>
            </div>
            <div className="mark-row-item">
              <MapPin size={14} className="mark-pin-ic" />
              <span className="mark-text">21.025600° N, 105.847800° E</span>
            </div>
          </div>
          <button className="btm-link-footer red-trash"><Trash2 size={13} /> Xóa tất cả</button>
        </div>
      </div>
    </div>
  );
}
