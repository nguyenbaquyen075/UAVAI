import React, { useState } from "react";
import {
  Maximize2,
  Plus,
  Minus,
  Crosshair,
  Layers,
  Copy,
  Check,
  MoreVertical,
  MapPin,
  Clock,
  Wrench,
  XCircle,
  Plane,
} from "lucide-react";

const INITIAL_UAVS = [
  { id: "UAV-01", name: "UAV-01 - Eagle Pro", status: "active", label: "Đang hoạt động", color: "#22c55e" },
  { id: "UAV-02", name: "UAV-02 - Falcon 8X", status: "pending", label: "Chờ nhiệm vụ", color: "#eab308" },
  { id: "UAV-03", name: "UAV-03 - SkyEye 4K", status: "active", label: "Đang hoạt động", color: "#22c55e" },
  { id: "UAV-04", name: "UAV-04 - Phantom 4 RTK", status: "maintenance", label: "Bảo trì", color: "#a855f7" },
  { id: "UAV-05", name: "UAV-05 - Matrice 300", status: "unavailable", label: "Không khả dụng", color: "#ef4444" },
  { id: "UAV-06", name: "UAV-06 - Inspire 3", status: "active", label: "Đang hoạt động", color: "#22c55e" },
];

export default function MapSettingsView() {
  const [viewMode, setViewMode] = useState("2D");
  const [selectedMapType, setSelectedMapType] = useState("default");
  const [liveTracking, setLiveTracking] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState("10s");
  const [displayRange, setDisplayRange] = useState("all");
  const [uavFilter, setUavFilter] = useState("all");
  const [copiedCoords, setCopiedCoords] = useState(false);

  const handleCopyCoordinates = () => {
    navigator.clipboard.writeText("21.0285° N, 105.8542° E");
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const filteredUAVs = INITIAL_UAVS.filter((uav) => {
    if (uavFilter === "active") return uav.status === "active";
    if (uavFilter === "pending") return uav.status === "pending";
    if (uavFilter === "maintenance") return uav.status === "maintenance";
    if (uavFilter === "unavailable") return uav.status === "unavailable";
    return true;
  });

  return (
    <div className="map-settings-layout font-sans">
      {/* PAGE HEADER (EXACT MATCH REFERENCE SCREENSHOT) */}
      <div className="map-page-header">
        <h1 className="map-page-title">Bản đồ</h1>
        <div className="map-page-breadcrumb">Trang chủ &gt; Bản đồ</div>
      </div>

      {/* TOP CONTROL BAR (MATCHING SCREENSHOT) */}
      <div className="map-top-control-bar">
        {/* BOX 1: CHẾ ĐỘ XEM */}
        <div className="control-group-box">
          <div className="control-label-row">
            <span className="control-lbl">Chế độ xem</span>
          </div>
          <div className="control-select-wrap">
            <Layers size={14} color="#22c55e" />
            <select
              className="map-select-btn font-mono"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option value="2D">2D</option>
              <option value="3D">3D</option>
            </select>
          </div>
        </div>

        {/* BOX 2: LOẠI BẢN ĐỒ (4 CARDS) */}
        <div className="control-group-box flex-1">
          <div className="control-label-row">
            <span className="control-lbl">Loại bản đồ</span>
          </div>
          <div className="map-types-row">
            {/* Card 1: Bản đồ mặc định */}
            <div
              className={`map-type-card ${selectedMapType === "default" ? "selected" : ""}`}
              onClick={() => setSelectedMapType("default")}
            >
              <div className="map-thumb thumb-default" />
              <span className="thumb-title">Bản đồ mặc định</span>
              {selectedMapType === "default" && (
                <div className="thumb-badge">
                  <Check size={10} color="#fff" />
                </div>
              )}
            </div>

            {/* Card 2: Vệ tinh */}
            <div
              className={`map-type-card ${selectedMapType === "satellite" ? "selected" : ""}`}
              onClick={() => setSelectedMapType("satellite")}
            >
              <div className="map-thumb thumb-satellite" />
              <span className="thumb-title">Vệ tinh</span>
              {selectedMapType === "satellite" && (
                <div className="thumb-badge">
                  <Check size={10} color="#fff" />
                </div>
              )}
            </div>

            {/* Card 3: Địa hình */}
            <div
              className={`map-type-card ${selectedMapType === "terrain" ? "selected" : ""}`}
              onClick={() => setSelectedMapType("terrain")}
            >
              <div className="map-thumb thumb-terrain" />
              <span className="thumb-title">Địa hình</span>
              {selectedMapType === "terrain" && (
                <div className="thumb-badge">
                  <Check size={10} color="#fff" />
                </div>
              )}
            </div>

            {/* Card 4: Đường phố */}
            <div
              className={`map-type-card ${selectedMapType === "street" ? "selected" : ""}`}
              onClick={() => setSelectedMapType("street")}
            >
              <div className="map-thumb thumb-street" />
              <span className="thumb-title">Đường phố</span>
              {selectedMapType === "street" && (
                <div className="thumb-badge">
                  <Check size={10} color="#fff" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOX 3: THEO DÕI TRỰC TIẾP */}
        <div className="control-group-box">
          <div className="control-label-row">
            <span className="control-lbl">Theo dõi trực tiếp</span>
          </div>
          <div className="live-toggle-row">
            <span className={`live-status-text ${liveTracking ? "green" : "gray"}`}>
              {liveTracking ? "Bật" : "Tắt"}
            </span>
            <button
              className={`ui-switch ${liveTracking ? "on" : ""}`}
              onClick={() => setLiveTracking(!liveTracking)}
            >
              <span className="ui-switch-knob" />
            </button>
          </div>
        </div>

        {/* BOX 4: CẤU HÌNH TỰ ĐỘNG & PHẠM VI */}
        <div className="control-group-box">
          <div className="auto-config-grid">
            <div className="config-item">
              <span className="control-lbl">Tự động làm mới</span>
              <select
                className="map-select-btn font-mono"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(e.target.value)}
              >
                <option value="5s">5s</option>
                <option value="10s">10s</option>
                <option value="30s">30s</option>
              </select>
            </div>

            <div className="config-item">
              <span className="control-lbl">Phạm vi hiển thị</span>
              <select
                className="map-select-btn"
                value={displayRange}
                onChange={(e) => setDisplayRange(e.target.value)}
              >
                <option value="all">Tất cả</option>
                <option value="active">Đang hoạt động</option>
              </select>
            </div>
          </div>
        </div>

        {/* FULLSCREEN BUTTON */}
        <button className="map-fullscreen-btn" title="Toàn màn hình">
          <Maximize2 size={16} />
        </button>
      </div>

      {/* MAIN SPLIT: MAP DISPLAY (LEFT) & CONTROL CARDS (RIGHT) */}
      <div className="map-main-split-container">
        {/* TACTICAL MAP VIEWPORT */}
        <div className="tactical-map-viewport">
          {/* MAP CANVAS / SVG GRID */}
          <div className={`tactical-map-bg map-type-${selectedMapType}`}>
            {/* RADAR CONCENTRIC RINGS */}
            <svg className="radar-svg-overlay" viewBox="0 0 1000 700">
              <g transform="translate(500, 350)">
                <circle r="60" className="radar-ring" />
                <text x="65" y="4" className="ring-label">2 km</text>

                <circle r="120" className="radar-ring" />
                <text x="125" y="4" className="ring-label">4 km</text>

                <circle r="180" className="radar-ring" />
                <text x="185" y="4" className="ring-label">6 km</text>

                <circle r="240" className="radar-ring" />
                <text x="245" y="4" className="ring-label">8 km</text>

                <circle r="300" className="radar-ring main-ring" />
                <text x="305" y="4" className="ring-label main-label">10 km</text>
                <text x="305" y="18" className="ring-label-val green">10.0 km</text>

                <line x1="-320" y1="0" x2="320" y2="0" className="axis-line" />
                <line x1="0" y1="-320" x2="0" y2="320" className="axis-line" />

                <circle r="18" className="center-uav-bg" />
                <circle r="8" className="center-uav-core" />
              </g>
            </svg>

            {/* LOCATION LABELS OVERLAY (EXACT MATCH SCREENSHOT) */}
            <div className="map-location-tag loc-cau-giay">Cầu Giấy</div>
            <div className="map-location-tag loc-phu-dien">Phú Diễn</div>
            <div className="map-location-tag loc-gia-thuy">Gia Thụy</div>
            <div className="map-location-tag loc-long-bien">Long Biên</div>
            <div className="map-location-tag loc-yen-hoa">Yên Hòa</div>
            <div className="map-location-tag loc-trung-hoa">Trung Hòa</div>
            <div className="map-location-tag loc-nhan-chinh">Nhân Chính</div>
            <div className="map-location-tag loc-dong-da">Đống Đa</div>
            <div className="map-location-tag loc-hoang-mai">Hoàng Mai</div>

            {/* HIGHWAY BADGES */}
            <div className="highway-badge hw-ql32">QL32</div>
            <div className="highway-badge hw-qh03">QH03</div>
            <div className="highway-badge hw-ct20">CT20</div>
            <div className="highway-badge hw-ah14">AH14</div>

            {/* BLUE USER POSITION PIN */}
            <div className="map-user-pin" title="Vị trí của bạn (Trung Hòa)">
              <div className="pin-icon-wrap">
                <MapPin size={22} color="#3b82f6" fill="#3b82f6" />
              </div>
            </div>

            {/* DRONE MARKERS SCATTERED ON MAP */}
            <div className="map-uav-marker pos-1" title="UAV-01 - Active">
              <Plane size={16} color="#22c55e" />
            </div>
            <div className="map-uav-marker pos-2" title="UAV-02 - Pending">
              <Plane size={16} color="#eab308" />
            </div>
            <div className="map-uav-marker pos-3" title="UAV-03 - Active">
              <Plane size={16} color="#22c55e" />
            </div>
            <div className="map-uav-marker pos-4" title="UAV-04 - Maintenance">
              <Plane size={16} color="#a855f7" />
            </div>
            <div className="map-uav-marker pos-5" title="UAV-05 - Unavailable">
              <XCircle size={16} color="#ef4444" />
            </div>
            <div className="map-uav-marker pos-center" title="UAV Central Control Base">
              <Plane size={20} color="#22c55e" />
            </div>
          </div>

          {/* TOP LEFT MAP CONTROLS OVERLAY */}
          <div className="map-tools-overlay">
            <button className="tool-btn" title="Phóng to"><Plus size={16} /></button>
            <button className="tool-btn" title="Thu nhỏ"><Minus size={16} /></button>
            <button className="tool-btn" title="Căn tâm vị trí"><Crosshair size={16} /></button>
            <button className="tool-btn" title="Lớp phủ bản đồ"><Layers size={16} /></button>
          </div>

          {/* BOTTOM LEFT DISTANCE LEGEND OVERLAY */}
          <div className="map-overlay-card dist-legend-card">
            <div className="overlay-card-title">Chú thích khoảng cách</div>
            <div className="dist-list font-mono">
              <div className="dist-item"><span className="dash-line line-1" /> <span>2 km</span></div>
              <div className="dist-item"><span className="dash-line line-2" /> <span>4 km</span></div>
              <div className="dist-item"><span className="dash-line line-3" /> <span>6 km</span></div>
              <div className="dist-item"><span className="dash-line line-4" /> <span>8 km</span></div>
              <div className="dist-item"><span className="dash-line line-5" /> <span>10 km</span></div>
            </div>
          </div>

          {/* BOTTOM SCALE INDICATOR */}
          <div className="map-overlay-card scale-card">
            <span className="scale-title">Tỷ lệ</span>
            <span className="scale-val font-mono">2 km</span>
            <div className="scale-ruler" />
          </div>

          {/* BOTTOM CENTER STATUS SUMMARY BAR */}
          <div className="map-overlay-card status-summary-bar">
            <div className="summary-item green">
              <Plane size={16} color="#22c55e" />
              <div className="summary-stack">
                <span className="lbl">Đang hoạt động</span>
                <span className="val font-mono">8</span>
              </div>
            </div>

            <div className="summary-item yellow">
              <Clock size={16} color="#eab308" />
              <div className="summary-stack">
                <span className="lbl">Chờ nhiệm vụ</span>
                <span className="val font-mono">3</span>
              </div>
            </div>

            <div className="summary-item purple">
              <Wrench size={16} color="#a855f7" />
              <div className="summary-stack">
                <span className="lbl">Bảo trì</span>
                <span className="val font-mono">2</span>
              </div>
            </div>

            <div className="summary-item red">
              <XCircle size={16} color="#ef4444" />
              <div className="summary-stack">
                <span className="lbl">Không khả dụng</span>
                <span className="val font-mono">5</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT CONTROL SIDEBAR */}
        <div className="map-right-control-col">
          {/* CARD 1: CHÚ THÍCH BẢN ĐỒ */}
          <div className="map-panel-card">
            <h3 className="panel-card-title">Chú thích bản đồ</h3>
            <div className="map-legend-stack">
              <div className="legend-row">
                <Plane size={15} color="#22c55e" />
                <span>UAV đang hoạt động</span>
              </div>
              <div className="legend-row">
                <Plane size={15} color="#eab308" />
                <span>UAV chờ nhiệm vụ</span>
              </div>
              <div className="legend-row">
                <Plane size={15} color="#a855f7" />
                <span>UAV bảo trì</span>
              </div>
              <div className="legend-row">
                <Plane size={15} color="#ef4444" />
                <span>UAV không khả dụng</span>
              </div>
              <div className="legend-row">
                <MapPin size={15} color="#3b82f6" fill="#3b82f6" />
                <span>Vị trí của bạn</span>
              </div>
              <div className="legend-row">
                <div className="circle-icon-green" />
                <span>Phạm vi giám sát (bán kính)</span>
              </div>
            </div>
          </div>

          {/* CARD 2: UAV HIỂN THỊ */}
          <div className="map-panel-card flex-1">
            <div className="panel-header-flex">
              <h3 className="panel-card-title margin-0">UAV hiển thị</h3>
              <select
                className="uav-filter-select"
                value={uavFilter}
                onChange={(e) => setUavFilter(e.target.value)}
              >
                <option value="all">Tất cả UAV</option>
                <option value="active">Đang hoạt động</option>
                <option value="pending">Chờ nhiệm vụ</option>
                <option value="maintenance">Bảo trì</option>
                <option value="unavailable">Không khả dụng</option>
              </select>
            </div>

            <div className="uav-list-stack">
              {filteredUAVs.map((uav) => (
                <div key={uav.id} className="uav-list-row">
                  <div className="uav-row-left">
                    <Plane size={15} style={{ color: uav.color }} />
                    <span className="uav-name font-mono">{uav.name}</span>
                  </div>
                  <div className="uav-row-right">
                    <span
                      className="uav-status-pill font-sans"
                      style={{
                        color: uav.color,
                        borderColor: `${uav.color}44`,
                        backgroundColor: `${uav.color}11`,
                      }}
                    >
                      {uav.label}
                    </span>
                    <MoreVertical size={14} color="#64748b" className="more-btn" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 3: TỌA ĐỘ TÂM BẢN ĐỒ */}
          <div className="map-panel-card">
            <h3 className="panel-card-title">Tọa độ tâm bản đồ</h3>
            <div className="coords-display-row font-mono">
              <div className="coord-block">
                <span className="k">Vĩ độ</span>
                <span className="v">21.0285° N</span>
              </div>
              <div className="coord-block">
                <span className="k">Kinh độ</span>
                <span className="v">105.8542° E</span>
              </div>
              <button
                className="btn-copy-coords"
                onClick={handleCopyCoordinates}
                title="Sao chép tọa độ"
              >
                {copiedCoords ? <Check size={16} color="#22c55e" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
