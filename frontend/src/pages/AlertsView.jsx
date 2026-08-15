import { useState } from "react";
import {
  Bell,
  Crosshair,
  Wifi,
  Battery,
  User,
  AlertTriangle,
  Info,
  Search,
  Maximize2,
  BellRing,
  RotateCw,
  MapPin,
  Sliders,
  ChevronDown,
  ShieldAlert,
} from "lucide-react";
import AlertsMap from "../components/AlertsMap";
import AlertsTimeChart from "../components/AlertsTimeChart";

export default function AlertsView() {
  const [currentTime, setCurrentTime] = useState("18:42:10 13/05/2024");
  const [activeTab, setActiveTab] = useState("list");
  const [selectedAlertId, setSelectedAlertId] = useState(1);
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("24h");

  const alertsData = [
    {
      id: 1,
      severity: "critical",
      severityText: "Nghiêm trọng",
      title: "UAV_02 mất tín hiệu liên lạc",
      desc: "Mất tín hiệu hơn 30 giây",
      uav: "UAV_02",
      mission: "NV_20240513_01",
      time: "18:40:21 13/05/2024",
      status: "Chưa xử lý",
      statusColor: "red",
    },
    {
      id: 2,
      severity: "critical",
      severityText: "Nghiêm trọng",
      title: "UAV_03 pin rất thấp",
      desc: "Pin chỉ còn 8%",
      uav: "UAV_03",
      mission: "NV_20240513_02",
      time: "18:37:45 13/05/2024",
      status: "Chưa xử lý",
      statusColor: "red",
    },
    {
      id: 3,
      severity: "important",
      severityText: "Quan trọng",
      title: "UAV_01 đi ra ngoài khu vực cho phép",
      desc: "Vượt ranh giới 1.2 km",
      uav: "UAV_01",
      mission: "NV_20240513_03",
      time: "18:35:12 13/05/2024",
      status: "Đang xử lý",
      statusColor: "orange",
    },
    {
      id: 4,
      severity: "important",
      severityText: "Quan trọng",
      title: "Phát hiện xâm nhập khu vực cấm bay",
      desc: "Có đối tượng lạ trong khu vực",
      uav: "UAV_04",
      mission: "NV_20240513_04",
      time: "18:32:08 13/05/2024",
      status: "Đang xử lý",
      statusColor: "orange",
    },
    {
      id: 5,
      severity: "medium",
      severityText: "Trung bình",
      title: "Điều kiện thời tiết xấu",
      desc: "Gió mạnh cấp 6 tại khu vực",
      uav: "--",
      mission: "--",
      time: "18:30:00 13/05/2024",
      status: "Đã xử lý",
      statusColor: "green",
    },
    {
      id: 6,
      severity: "medium",
      severityText: "Trung bình",
      title: "UAV_05 độ cao thấp",
      desc: "Độ cao hiện tại 45m",
      uav: "UAV_05",
      mission: "NV_20240513_05",
      time: "18:28:55 13/05/2024",
      status: "Đã xử lý",
      statusColor: "green",
    },
    {
      id: 7,
      severity: "info",
      severityText: "Thông tin",
      title: "Nhiệm vụ NV_20240513_06 bắt đầu",
      desc: "UAV_06 đã cất cánh",
      uav: "UAV_06",
      mission: "NV_20240513_06",
      time: "18:25:10 13/05/2024",
      status: "Đã xử lý",
      statusColor: "green",
    },
    {
      id: 8,
      severity: "info",
      severityText: "Thông tin",
      title: "Cập nhật phần mềm UAV_02",
      desc: "Phiên bản 2.1.4 đã sẵn sàng",
      uav: "UAV_02",
      mission: "--",
      time: "18:20:33 13/05/2024",
      status: "Đã xử lý",
      statusColor: "green",
    },
  ];

  return (
    <div className="alerts-page-layout-v2">
      {/* Top 5 Summary Cards */}
      <div className="alerts-top-5-summary">
        <div className="alerts-sum-card card-red">
          <div className="ic-box icon-red"><AlertTriangle size={18} /></div>
          <div className="card-info">
            <span className="lbl">Cảnh báo nghiêm trọng</span>
            <span className="val text-red">3</span>
            <span className="sub-trend text-red">▲ +2 so với hôm qua</span>
          </div>
        </div>

        <div className="alerts-sum-card card-yellow">
          <div className="ic-box icon-yellow"><AlertTriangle size={18} /></div>
          <div className="card-info">
            <span className="lbl">Cảnh báo quan trọng</span>
            <span className="val text-yellow">7</span>
            <span className="sub-trend text-orange">▲ +1 so với hôm qua</span>
          </div>
        </div>

        <div className="alerts-sum-card card-orange">
          <div className="ic-box icon-orange"><Bell size={18} /></div>
          <div className="card-info">
            <span className="lbl">Cảnh báo trung bình</span>
            <span className="val">15</span>
            <span className="sub-trend text-green">▼ -3 so với hôm qua</span>
          </div>
        </div>

        <div className="alerts-sum-card card-blue">
          <div className="ic-box icon-blue"><Info size={18} /></div>
          <div className="card-info">
            <span className="lbl">Cảnh báo thông tin</span>
            <span className="val">28</span>
            <span className="sub-trend text-green">▼ -5 so với hôm qua</span>
          </div>
        </div>

        <div className="alerts-sum-card total-donut-sum-card">
          <div className="svg-donut-box-sm">
            <svg width="70" height="70" viewBox="0 0 42 42" className="donut-svg">
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1e293b" strokeWidth="4.5" />
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#ef4444" strokeWidth="4.5" strokeDasharray="5.7 94.3" strokeDashoffset="25" />
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4.5" strokeDasharray="13.2 86.8" strokeDashoffset="19.3" />
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f97316" strokeWidth="4.5" strokeDasharray="28.3 71.7" strokeDashoffset="6.1" />
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="4.5" strokeDasharray="52.8 47.2" strokeDashoffset="77.8" />
            </svg>
            <div className="donut-center-text">
              <strong className="val">53</strong>
            </div>
          </div>

          <div className="total-right-legend">
            <span className="total-lbl">Tổng cảnh báo</span>
            <div className="lgd-list-mini">
              <div className="item"><span className="dot dot-red">●</span><span>Nghiêm trọng (5.7%)</span></div>
              <div className="item"><span className="dot dot-yellow">●</span><span>Quan trọng (13.2%)</span></div>
              <div className="item"><span className="dot dot-orange">●</span><span>Trung bình (28.3%)</span></div>
              <div className="item"><span className="dot dot-blue">●</span><span>Thông tin (52.8%)</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Split Section: Table + Map + Detail */}
      <div className="alerts-main-split-v2">
        {/* Section 1: DANH SÁCH CẢNH BÁO */}
        <div className="dashboard-panel alerts-table-panel">
          <div className="panel-tabs-header">
            <div className="tabs-flex">
              <button className={`tab-btn ${activeTab === "list" ? "active" : ""}`} onClick={() => setActiveTab("list")}>Danh sách cảnh báo</button>
              <button className={`tab-btn ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>Lịch sử cảnh báo</button>
            </div>
          </div>

          <div className="alerts-filters-row">
            <div className="search-box-wrap">
              <Search size={14} className="search-ic" />
              <input type="text" placeholder="Tìm kiếm cảnh báo..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="filter-select-sm"><option>Tất cả mức độ</option></select>
            <select className="filter-select-sm"><option>Tất cả loại</option></select>
            <select className="filter-select-sm"><option>Tất cả trạng thái</option></select>
          </div>

          <div className="alerts-table-wrapper">
            <table className="alerts-table">
              <thead>
                <tr>
                  <th>MỨC ĐỘ</th>
                  <th>NỘI DUNG CẢNH BÁO</th>
                  <th>UAV / NHIỆM VỤ</th>
                  <th>THỜI GIAN</th>
                  <th>TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody>
                {alertsData.map((a) => {
                  const isSelected = a.id === selectedAlertId;
                  return (
                    <tr
                      key={a.id}
                      className={`alert-tr ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedAlertId(a.id)}
                    >
                      <td>
                        <span className={`sev-tag ${a.severity}`}>
                          {a.severity === "critical" && "⚠️ "}
                          {a.severity === "important" && "⚠️ "}
                          {a.severity === "medium" && "🔔 "}
                          {a.severity === "info" && "ℹ️ "}
                          {a.severityText}
                        </span>
                      </td>
                      <td>
                        <div className="alert-content-cell">
                          <span className="main-title">{a.title}</span>
                          <span className="sub-desc">{a.desc}</span>
                        </div>
                      </td>
                      <td>
                        <div className="uav-mission-cell">
                          <span className="u-name">{a.uav}</span>
                          {a.mission !== "--" && <span className="m-name">Nhiệm vụ: {a.mission}</span>}
                        </div>
                      </td>
                      <td className="font-mono text-muted">{a.time}</td>
                      <td>
                        <span className={`status-badge ${a.statusColor}`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="alerts-pagination-bar">
            <span className="count-text">Hiển thị 1 - 8 của 53 cảnh báo</span>
            <div className="pages-flex">
              <button className="page-btn">&lt;</button>
              <button className="page-btn active">1</button>
              <button className="page-btn">2</button>
              <button className="page-btn">3</button>
              <button className="page-btn">4</button>
              <button className="page-btn">5</button>
              <button className="page-btn">6</button>
              <button className="page-btn">7</button>
              <button className="page-btn">...</button>
              <button className="page-btn">&gt;</button>
            </div>
          </div>
        </div>

        {/* Section 2: VỊ TRÍ CẢNH BÁO Map */}
        <div className="dashboard-panel alerts-map-panel">
          <div className="panel-section-header">
            <h3 className="section-title">VỊ TRÍ CẢNH BÁO</h3>
            <div className="map-actions">
              <select className="select-sm"><option>Tất cả UAV</option></select>
              <button className="btn-ic"><Maximize2 size={14} /></button>
            </div>
          </div>
          <div className="map-leaflet-wrapper">
            <AlertsMap />
          </div>
          <div className="map-bottom-legend-row">
            <span className="lgd-item"><span className="dot dot-red">●</span> Nghiêm trọng</span>
            <span className="lgd-item"><span className="dot dot-yellow">●</span> Quan trọng</span>
            <span className="lgd-item"><span className="dot dot-orange">●</span> Trung bình</span>
            <span className="lgd-item"><span className="dot dot-blue">●</span> Thông tin</span>
          </div>
        </div>

        {/* Section 3: CHI TIẾT CẢNH BÁO Sidebar */}
        <div className="dashboard-panel alert-detail-panel">
          <div className="panel-section-header">
            <h3 className="section-title">CHI TIẾT CẢNH BÁO</h3>
            <span className="status-pill red">Chưa xử lý</span>
          </div>

          <div className="detail-headline-card">
            <ShieldAlert size={24} className="ic-red" />
            <div className="headline-text">
              <h4 className="title">UAV_02 mất tín hiệu liên lạc</h4>
              <span className="id-code">ID: AL_20240513_001</span>
            </div>
          </div>

          <div className="detail-kv-list">
            <div className="kv-row">
              <span className="lbl">Mức độ:</span>
              <strong className="val text-red">Nghiêm trọng</strong>
            </div>
            <div className="kv-row">
              <span className="lbl">Loại cảnh báo:</span>
              <span className="val">Mất tín hiệu</span>
            </div>
            <div className="kv-row">
              <span className="lbl">UAV:</span>
              <span className="val">UAV_02 - Eagle Pro</span>
            </div>
            <div className="kv-row">
              <span className="lbl">Nhiệm vụ:</span>
              <span className="val">NV_20240513_01</span>
            </div>
            <div className="kv-row">
              <span className="lbl">Thời gian:</span>
              <span className="val font-mono">18:40:21 13/05/2024</span>
            </div>
            <div className="kv-row">
              <span className="lbl">Thời gian phát hiện:</span>
              <span className="val font-mono">18:39:51 13/05/2024</span>
            </div>
            <div className="kv-row">
              <span className="lbl">Vị trí cuối cùng:</span>
              <span className="val font-mono">21.027123° N, 105.854567° E</span>
            </div>
            <div className="kv-row">
              <span className="lbl">Độ cao cuối cùng:</span>
              <span className="val font-mono">120 m</span>
            </div>
            <div className="kv-row">
              <span className="lbl">Tốc độ cuối cùng:</span>
              <span className="val font-mono">45 km/h</span>
            </div>
            <div className="kv-row desc-row">
              <span className="lbl">Mô tả:</span>
              <p className="desc-text">UAV mất tín hiệu liên lạc với trạm điều khiển thời gian mất tín hiệu hơn 30 giây.</p>
            </div>
          </div>

          <div className="action-buttons-group">
            <span className="section-label">HÀNH ĐỘNG</span>
            <div className="action-grid">
              <button className="btn-act red-outline">
                <BellRing size={14} color="#ef4444" /> Đánh dấu khẩn cấp
              </button>
              <button className="btn-act blue-outline">
                <RotateCw size={14} color="#3b82f6" /> Thử kết nối lại
              </button>
              <button className="btn-act dark-outline">
                <MapPin size={14} color="#94a3b8" /> Xem trên bản đồ
              </button>
              <button className="btn-act dark-outline">
                <Sliders size={14} color="#94a3b8" /> Khác <ChevronDown size={12} color="#94a3b8" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row Grid: 4 Analytics Cards */}
      <div className="alerts-bottom-4col">
        {/* Card 1: THỐNG KÊ CẢNH BÁO THEO THỜI GIAN */}
        <AlertsTimeChart />

        {/* Card 2: THỐNG KÊ CẢNH BÁO THEO LOẠI */}
        <div className="dashboard-panel btm-donut-card">
          <div className="panel-section-header">
            <h3 className="section-title">THỐNG KÊ CẢNH BÁO THEO LOẠI</h3>
          </div>
          <div className="type-donut-body">
            <div className="svg-donut-box-sm">
              <svg width="90" height="90" viewBox="0 0 42 42" className="donut-svg">
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#1e293b" strokeWidth="4.5" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#ef4444" strokeWidth="4.5" strokeDasharray="22.6 77.4" strokeDashoffset="25" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f59e0b" strokeWidth="4.5" strokeDasharray="17.0 83.0" strokeDashoffset="2.4" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f97316" strokeWidth="4.5" strokeDasharray="15.1 84.9" strokeDashoffset="85.4" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#22c55e" strokeWidth="4.5" strokeDasharray="13.2 86.8" strokeDashoffset="70.3" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#06b6d4" strokeWidth="4.5" strokeDasharray="11.3 88.7" strokeDashoffset="57.1" />
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#94a3b8" strokeWidth="4.5" strokeDasharray="20.8 79.2" strokeDashoffset="45.8" />
              </svg>
              <div className="donut-center-text">
                <strong className="val">53</strong>
                <span className="lbl">Tổng số</span>
              </div>
            </div>
            <div className="type-legend-list">
              <div className="lgd-item"><span className="dot dot-red">●</span><span>Mất tín hiệu <strong>12 (22.6%)</strong></span></div>
              <div className="lgd-item"><span className="dot dot-yellow">●</span><span>Pin yếu <strong>9 (17.0%)</strong></span></div>
              <div className="lgd-item"><span className="dot dot-orange">●</span><span>Vượt ranh giới <strong>8 (15.1%)</strong></span></div>
              <div className="lgd-item"><span className="dot dot-green">●</span><span>Xâm nhập khu vực <strong>7 (13.2%)</strong></span></div>
              <div className="lgd-item"><span className="dot dot-cyan">●</span><span>Thời tiết xấu <strong>6 (11.3%)</strong></span></div>
              <div className="lgd-item"><span className="dot dot-grey">●</span><span>Khác <strong>11 (20.8%)</strong></span></div>
            </div>
          </div>
        </div>

        {/* Card 3: TOP UAV CÓ NHIỀU CẢNH BÁO */}
        <div className="dashboard-panel btm-top-uav-card">
          <div className="panel-section-header">
            <h3 className="section-title">TOP UAV CÓ NHIỀU CẢNH BÁO</h3>
          </div>
          <div className="top-uav-bars-list">
            <div className="uav-bar-item">
              <span className="name font-mono">UAV_02</span>
              <div className="bar-track"><div className="bar-fill red" style={{ width: "100%" }} /></div>
              <span className="val font-mono">15 (28.3%)</span>
            </div>

            <div className="uav-bar-item">
              <span className="name font-mono">UAV_01</span>
              <div className="bar-track"><div className="bar-fill orange" style={{ width: "80%" }} /></div>
              <span className="val font-mono">12 (22.6%)</span>
            </div>

            <div className="uav-bar-item">
              <span className="name font-mono">UAV_03</span>
              <div className="bar-track"><div className="bar-fill yellow" style={{ width: "60%" }} /></div>
              <span className="val font-mono">9 (17.0%)</span>
            </div>

            <div className="uav-bar-item">
              <span className="name font-mono">UAV_04</span>
              <div className="bar-track"><div className="bar-fill green" style={{ width: "46.7%" }} /></div>
              <span className="val font-mono">7 (13.2%)</span>
            </div>

            <div className="uav-bar-item">
              <span className="name font-mono">UAV_05</span>
              <div className="bar-track"><div className="bar-fill cyan" style={{ width: "40%" }} /></div>
              <span className="val font-mono">6 (11.3%)</span>
            </div>

            <div className="uav-bar-item">
              <span className="name font-mono">UAV_06</span>
              <div className="bar-track"><div className="bar-fill blue" style={{ width: "26.7%" }} /></div>
              <span className="val font-mono">4 (7.5%)</span>
            </div>
          </div>
        </div>

        {/* Card 4: CẢNH BÁO GẦN ĐÂY */}
        <div className="dashboard-panel btm-recent-card">
          <div className="panel-section-header">
            <h3 className="section-title">CẢNH BÁO GẦN ĐÂY</h3>
            <a href="#all" className="link-blue-sm">Xem tất cả</a>
          </div>
          <div className="recent-alerts-stream">
            <div className="stream-row">
              <AlertTriangle size={14} className="ic-red" />
              <span className="time font-mono">18:40:21</span>
              <span className="title">UAV_02 mất tín hiệu liên lạc</span>
              <span className="badge red">Nghiêm trọng</span>
            </div>

            <div className="stream-row">
              <AlertTriangle size={14} className="ic-red" />
              <span className="time font-mono">18:37:45</span>
              <span className="title">UAV_03 pin rất thấp</span>
              <span className="badge red">Nghiêm trọng</span>
            </div>

            <div className="stream-row">
              <AlertTriangle size={14} className="ic-yellow" />
              <span className="time font-mono">18:35:12</span>
              <span className="title">UAV_01 đi ra ngoài khu vực cho phép</span>
              <span className="badge yellow">Quan trọng</span>
            </div>

            <div className="stream-row">
              <AlertTriangle size={14} className="ic-yellow" />
              <span className="time font-mono">18:32:08</span>
              <span className="title">Phát hiện xâm nhập khu vực cấm bay</span>
              <span className="badge yellow">Quan trọng</span>
            </div>

            <div className="stream-row">
              <Bell size={14} className="ic-orange" />
              <span className="time font-mono">18:30:00</span>
              <span className="title">Điều kiện thời tiết xấu</span>
              <span className="badge orange">Trung bình</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
