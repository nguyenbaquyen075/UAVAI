import { useState, useEffect } from "react";
import {
  Target,
  Search,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  User,
  Wifi,
  Battery,
  Crosshair,
  Maximize2,
  Plus,
  Play,
  Share2,
  Zap,
  Eye,
  Layers,
  MapPin,
  SlidersHorizontal,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Ruler,
  Car,
  Users,
  Box,
  MoreVertical,
} from "lucide-react";
import TargetsMap from "../components/TargetsMap";
import DonutChart from "../components/DonutChart";

const MOCK_TARGETS = [
  {
    id: 1,
    code: "TGT_20240513_001",
    name: "Phương tiện khả nghi 01",
    class: "car",
    typeLabel: "Phương tiện",
    icon: Car,
    threat: "high",
    threatLabel: "Cao",
    status: "tracking",
    statusLabel: "Đang theo dõi",
    location: "Khu vực A 18:40:21",
    coords: "12.3456°N, 106.7890°E",
    speed: "45 km/h",
    heading: "320° NW",
    distance: "1.2 km",
    firstSeen: "18:25:10 13/05/2024",
    lastSeen: "18:40:21 13/05/2024",
    uav: "UAV_02 - Eagle Pro",
  },
  {
    id: 2,
    code: "TGT_20240513_002",
    name: "Nhóm người khả nghi",
    class: "person",
    typeLabel: "Con người",
    icon: Users,
    threat: "medium",
    threatLabel: "Trung bình",
    status: "tracking",
    statusLabel: "Đang theo dõi",
    location: "Khu vực B 18:38:55",
    coords: "12.3480°N, 106.7850°E",
    speed: "5 km/h",
    heading: "180° S",
    distance: "2.4 km",
    firstSeen: "18:20:00 13/05/2024",
    lastSeen: "18:38:55 13/05/2024",
    uav: "UAV_01 - Falcon 8X",
  },
  {
    id: 3,
    code: "TGT_20240513_003",
    name: "Phương tiện khả nghi 02",
    class: "car",
    typeLabel: "Phương tiện",
    icon: Car,
    threat: "high",
    threatLabel: "Cao",
    status: "confirmed",
    statusLabel: "Đã xác định",
    location: "Khu vực C 18:35:12",
    coords: "12.3410°N, 106.7910°E",
    speed: "60 km/h",
    heading: "090° E",
    distance: "3.1 km",
    firstSeen: "18:15:30 13/05/2024",
    lastSeen: "18:35:12 13/05/2024",
    uav: "UAV_03 - Scout 4K",
  },
  {
    id: 4,
    code: "TGT_20240513_004",
    name: "Vật thể lạ",
    class: "object",
    typeLabel: "Vật thể",
    icon: Box,
    threat: "low",
    threatLabel: "Thấp",
    status: "new",
    statusLabel: "Mới phát hiện",
    location: "Khu vực D 18:34:01",
    coords: "12.3500°N, 106.7800°E",
    speed: "0 km/h",
    heading: "-",
    distance: "1.8 km",
    firstSeen: "18:34:01 13/05/2024",
    lastSeen: "18:34:01 13/05/2024",
    uav: "UAV_02 - Eagle Pro",
  },
  {
    id: 5,
    code: "TGT_20240513_005",
    name: "Nhóm người",
    class: "person",
    typeLabel: "Con người",
    icon: Users,
    threat: "medium",
    threatLabel: "Trung bình",
    status: "tracking",
    statusLabel: "Đang theo dõi",
    location: "Khu vực A 18:32:47",
    coords: "12.3440°N, 106.7870°E",
    speed: "4 km/h",
    heading: "045° NE",
    distance: "0.9 km",
    firstSeen: "18:10:00 13/05/2024",
    lastSeen: "18:32:47 13/05/2024",
    uav: "UAV_02 - Eagle Pro",
  },
  {
    id: 6,
    code: "TGT_20240513_006",
    name: "Phương tiện khả nghi 03",
    class: "car",
    typeLabel: "Phương tiện",
    icon: Car,
    threat: "high",
    threatLabel: "Cao",
    status: "confirmed",
    statusLabel: "Đã xác định",
    location: "Khu vực E 18:28:33",
    coords: "12.3390°N, 106.7950°E",
    speed: "52 km/h",
    heading: "270° W",
    distance: "4.5 km",
    firstSeen: "18:05:00 13/05/2024",
    lastSeen: "18:28:33 13/05/2024",
    uav: "UAV_04 - Hawk Eye",
  },
  {
    id: 7,
    code: "TGT_20240513_007",
    name: "Vật thể khả nghi",
    class: "object",
    typeLabel: "Vật thể",
    icon: Box,
    threat: "medium",
    threatLabel: "Trung bình",
    status: "new",
    statusLabel: "Mới phát hiện",
    location: "Khu vực B 18:26:19",
    coords: "12.3470°N, 106.7830°E",
    speed: "0 km/h",
    heading: "-",
    distance: "2.8 km",
    firstSeen: "18:26:19 13/05/2024",
    lastSeen: "18:26:19 13/05/2024",
    uav: "UAV_01 - Falcon 8X",
  },
  {
    id: 8,
    code: "TGT_20240513_008",
    name: "Phương tiện khả nghi 04",
    class: "car",
    typeLabel: "Phương tiện",
    icon: Car,
    threat: "low",
    threatLabel: "Thấp",
    status: "processed",
    statusLabel: "Đã xử lý",
    location: "Khu vực F 16:22:10",
    coords: "12.3350°N, 106.7750°E",
    speed: "0 km/h",
    heading: "-",
    distance: "5.0 km",
    firstSeen: "16:00:00 13/05/2024",
    lastSeen: "16:22:10 13/05/2024",
    uav: "UAV_05 - Phantom V",
  },
];

export default function Targets({ payload }) {
  const [selectedId, setSelectedId] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [threatFilter, setThreatFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const selected = MOCK_TARGETS.find((t) => t.id === selectedId) || MOCK_TARGETS[0];

  const filteredTargets = MOCK_TARGETS.filter((t) => {
    if (search && !`${t.code} ${t.name}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    if (threatFilter && t.threat !== threatFilter) return false;
    if (typeFilter && t.class !== typeFilter) return false;
    return true;
  });

  return (
    <div className="targets-page-v2">
      {/* Top 5 Stat Cards Summary */}
      <div className="targets-stat-grid">
        <div className="stat-card-v2">
          <div className="stat-icon-wrapper icon-blue">
            <Target size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-title">TỔNG MỤC TIÊU</span>
            <div className="stat-val-group">
              <span className="stat-num">24</span>
              <span className="sub-badge green">▲ 8 so với tuần trước</span>
            </div>
          </div>
        </div>

        <div className="stat-card-v2">
          <div className="stat-icon-wrapper icon-green">
            <Target size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-title">ĐANG THEO DÕI</span>
            <div className="stat-val-group">
              <span className="stat-num">6</span>
              <span className="sub-badge muted">25%</span>
            </div>
          </div>
        </div>

        <div className="stat-card-v2">
          <div className="stat-icon-wrapper icon-orange">
            <User size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-title">ĐÃ XÁC ĐỊNH</span>
            <div className="stat-val-group">
              <span className="stat-num">12</span>
              <span className="sub-badge muted">50%</span>
            </div>
          </div>
        </div>

        <div className="stat-card-v2">
          <div className="stat-icon-wrapper icon-red">
            <AlertTriangle size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-title">MỨC ĐỘ NGUY HIỂM CAO</span>
            <div className="stat-val-group">
              <span className="stat-num text-red">3</span>
              <span className="sub-badge muted">12.5%</span>
            </div>
          </div>
        </div>

        <div className="stat-card-v2">
          <div className="stat-icon-wrapper icon-purple">
            <CheckCircle2 size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-title">ĐÃ XỬ LÝ</span>
            <div className="stat-val-group">
              <span className="stat-num">18</span>
              <span className="sub-badge muted">75%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Main 3-Column Grid */}
      <div className="targets-middle-3col">
        {/* Column 1: Danh sách mục tiêu (Table Card) */}
        <div className="dashboard-panel tgt-table-panel">
          <div className="panel-section-header">
            <h3 className="section-title">DANH SÁCH MỤC TIÊU</h3>
          </div>

          <div className="tgt-filter-bar">
            <div className="tgt-search-box">
              <Search size={14} className="search-ic" />
              <input
                type="text"
                placeholder="Tìm kiếm mục tiêu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select className="tgt-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Trạng thái: Tất cả</option>
              <option value="tracking">Đang theo dõi</option>
              <option value="confirmed">Đã xác định</option>
              <option value="new">Mới phát hiện</option>
              <option value="processed">Đã xử lý</option>
            </select>
            <select className="tgt-select" value={threatFilter} onChange={(e) => setThreatFilter(e.target.value)}>
              <option value="">Mức độ: Tất cả</option>
              <option value="high">Cao</option>
              <option value="medium">Trung bình</option>
              <option value="low">Thấp</option>
            </select>
            <select className="tgt-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">Loại: Tất cả</option>
              <option value="car">Phương tiện</option>
              <option value="person">Con người</option>
              <option value="object">Vật thể</option>
            </select>
          </div>

          <div className="tgt-table-wrapper">
            <table className="tgt-custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>TÊN MỤC TIÊU</th>
                  <th>LOẠI</th>
                  <th>MỨC ĐỘ</th>
                  <th>TRẠNG THÁI</th>
                  <th>VỊ TRÍ CUỐI CẤP NHẤT</th>
                </tr>
              </thead>
              <tbody>
                {filteredTargets.map((t) => {
                  const IconComp = t.icon;
                  const isSel = t.id === selectedId;
                  return (
                    <tr
                      key={t.id}
                      className={isSel ? "row-selected" : ""}
                      onClick={() => setSelectedId(t.id)}
                    >
                      <td className="mono font-semibold text-slate-300">{t.code}</td>
                      <td>
                        <div className="tgt-name-cell">
                          <span className={`tgt-type-icon icon-${t.class}`}>
                            <IconComp size={14} />
                          </span>
                          <span>{t.name}</span>
                        </div>
                      </td>
                      <td className="text-slate-400">{t.typeLabel}</td>
                      <td>
                        <span className={`threat-pill threat-${t.threat}`}>{t.threatLabel}</span>
                      </td>
                      <td>
                        <span className={`status-pill status-${t.status}`}>{t.statusLabel}</span>
                      </td>
                      <td className="text-slate-400 text-xs">
                        <MapPin size={12} className="inline mr-1 text-slate-500" />
                        {t.location}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="tgt-pagination">
            <span>Hiển thị 1 đến 8 của 24 mục tiêu</span>
            <div className="page-btns">
              <button className="page-arrow"><ChevronLeft size={14} /></button>
              <button className="page-num active">1</button>
              <button className="page-num">2</button>
              <button className="page-num">3</button>
              <button className="page-arrow"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>

        {/* Column 2: Bản đồ mục tiêu (Map Card) */}
        <div className="dashboard-panel tgt-map-panel">
          <div className="panel-section-header">
            <h3 className="section-title">BẢN ĐỒ MỤC TIÊU</h3>
            <div className="map-header-controls">
              <button className="btn-add-target">+ Thêm mục tiêu</button>
              <select className="map-target-select">
                <option>Tất cả mục tiêu</option>
                <option>Đang theo dõi</option>
              </select>
              <button className="icon-tool-btn"><Maximize2 size={14} /></button>
            </div>
          </div>

          <div className="tgt-map-container">
            {/* Left 5 Individual Toolbar Buttons */}
            <div className="map-left-toolbar-individual">
              <button className="map-single-btn" title="Lớp bản đồ"><Layers size={16} /></button>
              <button className="map-single-btn" title="Vẽ vùng">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 4L20 9.5V17.5L11 20.5L4 16V8L14 4Z" />
                  <circle cx="14" cy="4" r="2" fill="currentColor" />
                </svg>
              </button>
              <button className="map-single-btn" title="Ghim vị trí"><MapPin size={16} /></button>
              <button className="map-single-btn" title="Đo khoảng cách"><Ruler size={16} /></button>
              <button className="map-single-btn" title="Xóa chọn"><Trash2 size={16} /></button>
            </div>

            {/* Map Leaflet Element */}
            <TargetsMap targets={MOCK_TARGETS} onSelect={setSelectedId} />

            {/* Bottom Left View Switcher */}
            <div className="map-bottom-left-toggle">
              <button className="map-toggle-btn">Bản đồ</button>
              <button className="map-toggle-btn active-green">Vệ tinh</button>
            </div>

            {/* Bottom Right Scale & Zoom Stack */}
            <div className="map-bottom-right-controls">
              <div className="map-scale-box">
                <span className="scale-text">500 m</span>
                <div className="scale-line" />
              </div>

              <div className="map-zoom-group">
                <button className="zoom-btn" title="Phóng to">+</button>
                <div className="zoom-divider" />
                <button className="zoom-btn" title="Thu nhỏ">—</button>
              </div>
            </div>

            {/* Bottom Map Legend Bar (2 Rows matching screenshot) */}
            <div className="map-bottom-legend-2rows">
              <div className="legend-row-1">
                <div className="legend-item"><span className="legend-color-dot dot-red" /><span>Đang theo dõi (6)</span></div>
                <div className="legend-item"><span className="legend-color-dot dot-orange" /><span>Đã xác định (12)</span></div>
                <div className="legend-item"><span className="legend-color-dot dot-blue" /><span>Mới phát hiện (3)</span></div>
                <div className="legend-item"><span className="legend-color-dot dot-grey" /><span>Đã xử lý (18)</span></div>
              </div>
              <div className="legend-row-2">
                <div className="legend-item"><span className="legend-color-sq sq-green" /><span>Khu vực quan tâm</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: Chi tiết mục tiêu & Hình ảnh liên quan */}
        <div className="tgt-right-stack">
          {/* Card 1: Chi tiết mục tiêu */}
          <div className="dashboard-panel tgt-detail-card">
            <div className="sidebar-card-header">
              <h3 className="sidebar-title">CHI TIẾT MỤC TIÊU</h3>
              <span className={`badge-pill status-${selected.status}`}>{selected.statusLabel}</span>
            </div>

            <div className="tgt-header-info">
              <span className="tgt-hero-ic"><selected.icon size={20} /></span>
              <div>
                <h4 className="tgt-code-title">{selected.code}</h4>
                <p className="tgt-sub-title">{selected.name}</p>
              </div>
            </div>

            <div className="tgt-metrics-list">
              <div className="detail-row"><span className="detail-label">Loại mục tiêu</span><span className="detail-value">{selected.typeLabel}</span></div>
              <div className="detail-row"><span className="detail-label">Mức độ nguy hiểm</span><span className={`detail-value text-threat-${selected.threat}`}>{selected.threatLabel}</span></div>
              <div className="detail-row"><span className="detail-label">Trạng thái</span><span className="detail-value text-emerald-400 font-semibold">{selected.statusLabel}</span></div>
              <div className="detail-row"><span className="detail-label">Vị trí hiện tại</span><span className="detail-value text-xs">{selected.location} ({selected.coords})</span></div>
              <div className="detail-row"><span className="detail-label">Tốc độ</span><span className="detail-value">{selected.speed}</span></div>
              <div className="detail-row"><span className="detail-label">Hướng di chuyển</span><span className="detail-value">{selected.heading}</span></div>
              <div className="detail-row"><span className="detail-label">Khoảng cách đến UAV</span><span className="detail-value">{selected.distance}</span></div>
              <div className="detail-row"><span className="detail-label">Thời gian phát hiện</span><span className="detail-value text-xs">{selected.firstSeen}</span></div>
              <div className="detail-row"><span className="detail-label">Thời gian cập nhật cuối</span><span className="detail-value text-xs">{selected.lastSeen}</span></div>
              <div className="detail-row"><span className="detail-label">UAV theo dõi</span><span className="detail-value text-sky-400 font-semibold">{selected.uav}</span></div>
            </div>

            <div className="tgt-action-grid">
              <button className="btn-tgt-act outline-green"><Eye size={13} /><span>Xem chi tiết</span></button>
              <button className="btn-tgt-act solid-blue"><Play size={13} /><span>Theo dõi</span></button>
              <button className="btn-tgt-act solid-dark"><Share2 size={13} /><span>Chia sẻ</span></button>
              <button className="btn-tgt-act outline-red"><Zap size={13} /><span>Đánh dấu</span></button>
            </div>
          </div>

          {/* Card 2: Hình ảnh / Video liên quan */}
          <div className="dashboard-panel tgt-media-card">
            <div className="sidebar-card-header">
              <h3 className="sidebar-title">HÌNH ẢNH / VIDEO LIÊN QUAN</h3>
              <button className="btn-view-all">Xem tất cả &gt;</button>
            </div>

            <div className="media-thumbnails-grid">
              <div className="media-thumb-box">
                <img src="/uav_aerial_feed.png" alt="Live stream" />
                <span className="badge-live-tag">LIVE</span>
                <div className="play-icon-overlay"><Play size={16} /></div>
              </div>
              <div className="media-thumb-box">
                <img src="https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=400&q=80" alt="Recorded stream" />
                <span className="badge-time-tag">18:35:12</span>
                <div className="play-icon-overlay"><Play size={16} /></div>
              </div>
            </div>

            <div className="media-carousel-dots">
              <span className="dot active" />
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row Grid: 4 Cards */}
      <div className="targets-bottom-4col">
        {/* Card 1: Phân loại mục tiêu */}
        <div className="dashboard-panel btm-card">
          <div className="panel-section-header">
            <h3 className="section-title">PHÂN LOẠI MỤC TIÊU</h3>
          </div>
          <div className="donut-chart-flex">
            <DonutChart
              showLegend={false}
              size={88}
              segments={[
                { label: "Phương tiện", value: 10, color: "#ef4444" },
                { label: "Con người", value: 7, color: "#f97316" },
                { label: "Vật thể", value: 4, color: "#3b82f6" },
                { label: "Khác", value: 3, color: "#8b5cf6" },
              ]}
              centerText="24"
              centerSubtext="Tổng số"
            />
            <div className="donut-legend-list">
              <div className="leg-item"><span className="sq sq-red" /><span>Phương tiện</span><span className="leg-val">10 (42%)</span></div>
              <div className="leg-item"><span className="sq sq-orange" /><span>Con người</span><span className="leg-val">7 (29%)</span></div>
              <div className="leg-item"><span className="sq sq-blue" /><span>Vật thể</span><span className="leg-val">4 (17%)</span></div>
              <div className="leg-item"><span className="sq sq-purple" /><span>Khác</span><span className="leg-val">3 (12%)</span></div>
            </div>
          </div>
        </div>

        {/* Card 2: Mức độ nguy hiểm */}
        <div className="dashboard-panel btm-card">
          <div className="panel-section-header">
            <h3 className="section-title">MỨC ĐỘ NGUY HIỂM</h3>
          </div>
          <div className="donut-chart-flex">
            <DonutChart
              showLegend={false}
              size={88}
              segments={[
                { label: "Cao", value: 6, color: "#ef4444" },
                { label: "Trung bình", value: 11, color: "#f59e0b" },
                { label: "Thấp", value: 7, color: "#3b82f6" },
              ]}
              centerText="24"
              centerSubtext="Tổng số"
            />
            <div className="donut-legend-list">
              <div className="leg-item"><span className="sq sq-red" /><span>Cao</span><span className="leg-val">6 (25%)</span></div>
              <div className="leg-item"><span className="sq sq-orange" /><span>Trung bình</span><span className="leg-val">11 (46%)</span></div>
              <div className="leg-item"><span className="sq sq-blue" /><span>Thấp</span><span className="leg-val">7 (29%)</span></div>
            </div>
          </div>
        </div>

        {/* Card 3: Hoạt động gần đây */}
        <div className="dashboard-panel btm-card">
          <div className="panel-section-header">
            <h3 className="section-title">HOẠT ĐỘNG GẦN ĐÂY</h3>
          </div>
          <div className="activity-timeline-list">
            <div className="act-item">
              <span className="act-time">18:40:21</span>
              <div className="act-content">
                <span className="act-title font-semibold text-slate-200">🚗 TGT_20240513_001 <span className="text-emerald-400">Đang theo dõi</span></span>
                <p className="act-desc">Phương tiện khả nghi 01 di chuyển đến khu vực A</p>
              </div>
            </div>
            <div className="act-item">
              <span className="act-time">18:38:55</span>
              <div className="act-content">
                <span className="act-title font-semibold text-slate-200">👥 TGT_20240513_002 <span className="text-sky-400">Cập nhật vị trí</span></span>
                <p className="act-desc">Nhóm người di chuyển đến khu vực B</p>
              </div>
            </div>
            <div className="act-item">
              <span className="act-time">18:35:12</span>
              <div className="act-content">
                <span className="act-title font-semibold text-slate-200">🚗 TGT_20240513_003 <span className="text-amber-400">Đã xác định</span></span>
                <p className="act-desc">Phương tiện khả nghi 02 đã được xác định</p>
              </div>
            </div>
            <div className="act-item">
              <span className="act-time">18:34:01</span>
              <div className="act-content">
                <span className="act-title font-semibold text-slate-200">📦 TGT_20240513_004 <span className="text-sky-400">Mới phát hiện</span></span>
                <p className="act-desc">Phát hiện vật thể lạ tại khu vực D</p>
              </div>
            </div>
          </div>
          <button className="btn-link-more">Xem tất cả hoạt động &gt;</button>
        </div>

        {/* Card 4: Ghi chú */}
        <div className="dashboard-panel btm-card">
          <div className="panel-section-header">
            <h3 className="section-title">GHI CHÚ</h3>
            <button className="btn-add-note">+ Thêm ghi chú</button>
          </div>

          <div className="note-card-body">
            <div className="note-author-header">
              <div className="avatar-sm">
                <User size={14} color="#e6e8ec" />
              </div>
              <div className="author-info">
                <span className="author-name">admin</span>
                <span className="note-time">18:30:15 13/05/2024</span>
              </div>
            </div>
            <p className="note-text-content">
              Phương tiện di chuyển theo hướng tây bắc, tốc độ tăng dần.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
