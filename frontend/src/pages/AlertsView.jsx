import { useEffect, useState } from "react";
import AlertsMap from "../components/AlertsMap";
import AlertsTimeChart from "../components/AlertsTimeChart";

export default function AlertsView() {
  const [currentTime, setCurrentTime] = useState("");
  const [activeTab, setActiveTab] = useState("list");
  const [selectedAlertId, setSelectedAlertId] = useState(1);

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

  const alertItems = [
    {
      id: 1,
      code: "AL_20240513_001",
      severity: "critical",
      severityLabel: "Nghiêm trọng",
      title: "UAV_02 mất tín hiệu liên lạc",
      desc: "Mất tín hiệu hơn 30 giây",
      uav: "UAV_02",
      uavFull: "UAV_02 - Eagle Pro",
      mission: "NV_20240513_01",
      time: "18:40:21 13/05/2024",
      detectedTime: "18:39:51 13/05/2024",
      status: "unhandled",
      statusLabel: "Chưa xử lý",
      type: "Mất tín hiệu",
      lat: "21.027123° N",
      lon: "105.854567° E",
      alt: "120 m",
      speed: "45 km/h",
      detailText: "UAV mất tín hiệu liên lạc với trạm điều khiển, thời gian mất tín hiệu hơn 30 giây.",
    },
    {
      id: 2,
      code: "AL_20240513_002",
      severity: "critical",
      severityLabel: "Nghiêm trọng",
      title: "UAV_03 pin rất thấp",
      desc: "Pin chỉ còn 8%",
      uav: "UAV_03",
      uavFull: "UAV_03 - Falcon Eye",
      mission: "NV_20240513_02",
      time: "18:37:45 13/05/2024",
      detectedTime: "18:37:00 13/05/2024",
      status: "unhandled",
      statusLabel: "Chưa xử lý",
      type: "Pin yếu",
      lat: "21.031400° N",
      lon: "105.849200° E",
      alt: "85 m",
      speed: "30 km/h",
      detailText: "Dung lượng pin giảm xuống dưới ngưỡng an toàn (8%), cần tự động kích hoạt RTH.",
    },
    {
      id: 3,
      code: "AL_20240513_003",
      severity: "major",
      severityLabel: "Quan trọng",
      title: "UAV_01 đi ra ngoài khu vực cho phép",
      desc: "Vượt ranh giới 1.2 km",
      uav: "UAV_01",
      uavFull: "UAV_01 - Predator X",
      mission: "NV_20240513_03",
      time: "18:35:12 13/05/2024",
      detectedTime: "18:34:50 13/05/2024",
      status: "processing",
      statusLabel: "Đang xử lý",
      type: "Vượt ranh giới",
      lat: "21.021100° N",
      lon: "105.842300° E",
      alt: "150 m",
      speed: "52 km/h",
      detailText: "UAV_01 bay vượt ngoài ranh giới vùng tuần tra cho phép 1.2km.",
    },
    {
      id: 4,
      code: "AL_20240513_004",
      severity: "major",
      severityLabel: "Quan trọng",
      title: "Phát hiện xâm nhập khu vực cấm bay",
      desc: "Có đối tượng lạ trong khu vực",
      uav: "UAV_04",
      uavFull: "UAV_04 - Scout 04",
      mission: "NV_20240513_04",
      time: "18:32:08 13/05/2024",
      detectedTime: "18:31:30 13/05/2024",
      status: "processing",
      statusLabel: "Đang xử lý",
      type: "Xâm nhập khu vực",
      lat: "21.029800° N",
      lon: "105.864100° E",
      alt: "110 m",
      speed: "25 km/h",
      detailText: "Cảm biến camera phát hiện mục tiêu di chuyển không rõ danh tính trong vùng cấm.",
    },
    {
      id: 5,
      code: "AL_20240513_005",
      severity: "moderate",
      severityLabel: "Trung bình",
      title: "Điều kiện thời tiết xấu",
      desc: "Gió mạnh cấp 6 tại khu vực",
      uav: "--",
      uavFull: "Trạm thời tiết trung tâm",
      mission: "--",
      time: "18:30:00 13/05/2024",
      detectedTime: "18:29:00 13/05/2024",
      status: "resolved",
      statusLabel: "Đã xử lý",
      type: "Thời tiết xấu",
      lat: "21.028500° N",
      lon: "105.854200° E",
      alt: "0 m",
      speed: "0 km/h",
      detailText: "Vận tốc gió giật cấp 6 (>45 km/h), khuyến cáo điều chỉnh độ cao bay.",
    },
    {
      id: 6,
      code: "AL_20240513_006",
      severity: "moderate",
      severityLabel: "Trung bình",
      title: "UAV_05 độ cao thấp",
      desc: "Độ cao hiện tại 45m",
      uav: "UAV_05",
      uavFull: "UAV_05 - AirGuardian",
      mission: "NV_20240513_05",
      time: "18:28:55 13/05/2024",
      detectedTime: "18:28:10 13/05/2024",
      status: "resolved",
      statusLabel: "Đã xử lý",
      type: "Độ cao thấp",
      lat: "21.018200° N",
      lon: "105.858400° E",
      alt: "45 m",
      speed: "35 km/h",
      detailText: "UAV bay dưới ngưỡng độ cao tối thiểu an toàn (45m).",
    },
    {
      id: 7,
      code: "AL_20240513_007",
      severity: "info",
      severityLabel: "Thông tin",
      title: "Nhiệm vụ NV_20240513_06 bắt đầu",
      desc: "UAV_06 đã cất cánh",
      uav: "UAV_06",
      uavFull: "UAV_06 - Horizon 06",
      mission: "NV_20240513_06",
      time: "18:25:10 13/05/2024",
      detectedTime: "18:25:10 13/05/2024",
      status: "resolved",
      statusLabel: "Đã xử lý",
      type: "Thông tin bay",
      lat: "21.034000° N",
      lon: "105.871000° E",
      alt: "200 m",
      speed: "60 km/h",
      detailText: "UAV_06 cất cánh thành công từ trạm HOME, bắt đầu tuyến bay NV_20240513_06.",
    },
    {
      id: 8,
      code: "AL_20240513_008",
      severity: "info",
      severityLabel: "Thông tin",
      title: "Cập nhật phần mềm UAV_02",
      desc: "Phiên bản 2.1.4 đã sẵn sàng",
      uav: "UAV_02",
      uavFull: "UAV_02 - Eagle Pro",
      mission: "--",
      time: "18:20:33 13/05/2024",
      detectedTime: "18:20:33 13/05/2024",
      status: "resolved",
      statusLabel: "Đã xử lý",
      type: "Hệ thống",
      lat: "21.037000° N",
      lon: "105.853000° E",
      alt: "0 m",
      speed: "0 km/h",
      detailText: "Bản cập nhật Firmware v2.1.4 sẵn sàng tải về cho dòng UAV_02.",
    },
  ];

  const selectedAlert = alertItems.find((a) => a.id === selectedAlertId) || alertItems[0];

  const topUavAlerts = [
    { id: "UAV_02", count: 15, pct: "28.3%", color: "#ef4444" },
    { id: "UAV_01", count: 12, pct: "22.6%", color: "#f97316" },
    { id: "UAV_03", count: 9, pct: "17.0%", color: "#facc15" },
    { id: "UAV_04", count: 7, pct: "13.2%", color: "#3b82f6" },
    { id: "UAV_05", count: 6, pct: "11.3%", color: "#22c55e" },
    { id: "UAV_06", count: 4, pct: "7.5%", color: "#a855f7" },
  ];

  return (
    <div className="alerts-page-layout">
      {/* Sub Header */}
      <div className="live-sub-header">
        <div className="header-left">
          <div className="uav-selector-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span className="sub-title-label">CẢNH BÁO</span>
            <span className="dot-divider">/</span>
            <span className="breadcrumb-sub">Trang chủ &gt; Cảnh báo</span>
          </div>
        </div>

        <div className="header-right-telemetry">
          <div className="telemetry-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="2" x2="12" y2="22"></line>
              <line x1="2" y1="12" x2="22" y2="12"></line>
            </svg>
            <span>GPS <strong>12</strong></span>
          </div>

          <div className="telemetry-pill green">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
              <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
              <line x1="12" y1="20" x2="12.01" y2="20"></line>
            </svg>
            <span>Liên kết <strong>Strong</strong></span>
          </div>

          <div className="telemetry-pill green">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e6e8ec" strokeWidth="2">
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

      {/* Row 1: Top 5 Summary KPI Cards */}
      <div className="alerts-kpi-grid">
        <div className="kpi-card border-red">
          <div className="kpi-icon red">⚠️</div>
          <div className="kpi-body">
            <span className="kpi-label">CẢNH BÁO NGHIÊM TRỌNG</span>
            <div className="kpi-val red-text">3</div>
            <span className="kpi-trend up red-trend">↑ +2 so với hôm qua</span>
          </div>
        </div>

        <div className="kpi-card border-orange">
          <div className="kpi-icon orange">⚠️</div>
          <div className="kpi-body">
            <span className="kpi-label">CẢNH BÁO QUAN TRỌNG</span>
            <div className="kpi-val orange-text">7</div>
            <span className="kpi-trend up orange-trend">↑ +1 so với hôm qua</span>
          </div>
        </div>

        <div className="kpi-card border-yellow">
          <div className="kpi-icon yellow">🔔</div>
          <div className="kpi-body">
            <span className="kpi-label">CẢNH BÁO TRUNG BÌNH</span>
            <div className="kpi-val yellow-text">15</div>
            <span className="kpi-trend down green-trend">↓ -3 so với hôm qua</span>
          </div>
        </div>

        <div className="kpi-card border-blue">
          <div className="kpi-icon blue">ℹ️</div>
          <div className="kpi-body">
            <span className="kpi-label">CẢNH BÁO THÔNG TIN</span>
            <div className="kpi-val blue-text">28</div>
            <span className="kpi-trend down green-trend">↓ -5 so với hôm qua</span>
          </div>
        </div>

        <div className="kpi-card total-donut-kpi-card">
          <div className="total-kpi-donut-box">
            <svg width="60" height="60" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="22" fill="none" stroke="#161c28" strokeWidth="10" />
              <circle cx="30" cy="30" r="22" fill="none" stroke="#ef4444" strokeWidth="10" strokeDasharray="138" strokeDashoffset="130" transform="rotate(-90 30 30)" />
              <circle cx="30" cy="30" r="22" fill="none" stroke="#f97316" strokeWidth="10" strokeDasharray="138" strokeDashoffset="120" transform="rotate(-70 30 30)" />
              <circle cx="30" cy="30" r="22" fill="none" stroke="#facc15" strokeWidth="10" strokeDasharray="138" strokeDashoffset="98" transform="rotate(-20 30 30)" />
              <circle cx="30" cy="30" r="22" fill="none" stroke="#3b82f6" strokeWidth="10" strokeDasharray="138" strokeDashoffset="65" transform="rotate(60 30 30)" />
            </svg>
            <div className="donut-center-kpi-val">53</div>
          </div>
          <div className="kpi-body">
            <span className="kpi-label">TỔNG CẢNH BÁO</span>
            <span className="kpi-trend up green-trend">↑ +5 so với hôm qua</span>
            <div className="donut-mini-legend">
              <div><span className="dot red">●</span> Nghiêm trọng (5.7%)</div>
              <div><span className="dot orange">●</span> Quan trọng (13.2%)</div>
              <div><span className="dot yellow">●</span> Trung bình (28.3%)</div>
              <div><span className="dot blue">●</span> Thông tin (52.8%)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: 3-Column Main Split Section */}
      <div className="alerts-main-split-grid">
        {/* Column 1: Alert Table Card */}
        <div className="alerts-table-column">
          <div className="table-top-bar">
            <div className="alert-cat-tabs">
              <button
                className={`tab-btn ${activeTab === "list" ? "active" : ""}`}
                onClick={() => setActiveTab("list")}
              >
                Danh sách cảnh báo
              </button>
              <button
                className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
                onClick={() => setActiveTab("history")}
              >
                Lịch sử cảnh báo
              </button>
            </div>
          </div>

          <div className="table-filter-row">
            <div className="search-box">
              <span>🔍</span>
              <input type="text" placeholder="Tìm kiếm cảnh báo..." />
            </div>
            <select className="filter-select" defaultValue="">
              <option value="">Tất cả mức độ</option>
              <option value="critical">Nghiêm trọng</option>
              <option value="major">Quan trọng</option>
              <option value="moderate">Trung bình</option>
              <option value="info">Thông tin</option>
            </select>
            <select className="filter-select" defaultValue="">
              <option value="">Tất cả loại</option>
              <option value="signal">Mất tín hiệu</option>
              <option value="battery">Pin yếu</option>
            </select>
            <select className="filter-select" defaultValue="">
              <option value="">Tất cả trạng thái</option>
              <option value="unhandled">Chưa xử lý</option>
              <option value="processing">Đang xử lý</option>
              <option value="resolved">Đã xử lý</option>
            </select>
          </div>

          <div className="alerts-table-wrapper">
            <table>
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
                {alertItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`alert-tr ${item.id === selectedAlertId ? "selected" : ""}`}
                    onClick={() => setSelectedAlertId(item.id)}
                  >
                    <td>
                      <span className={`badge-severity ${item.severity}`}>
                        {item.severityLabel}
                      </span>
                    </td>
                    <td>
                      <div className="alert-title-cell">
                        <strong>{item.title}</strong>
                        <span className="sub-desc">{item.desc}</span>
                      </div>
                    </td>
                    <td>
                      <div className="uav-cell">
                        <span className="u-id">{item.uav}</span>
                        <span className="m-id">{item.mission}</span>
                      </div>
                    </td>
                    <td className="font-mono text-muted">{item.time}</td>
                    <td>
                      <span className={`badge-status ${item.status}`}>
                        {item.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-footer-pagination">
            <span className="footer-count">Hiển thị 1 - 8 của 53 cảnh báo</span>
            <div className="pagination">
              <button className="p-btn">&lt;</button>
              <button className="p-num active">1</button>
              <button className="p-num">2</button>
              <button className="p-num">3</button>
              <button className="p-num">4</button>
              <button className="p-num">5</button>
              <button className="p-num">6</button>
              <button className="p-num">7</button>
              <span className="p-dots">...</span>
              <button className="p-btn">&gt;</button>
            </div>
          </div>
        </div>

        {/* Column 2: Leaflet Alerts Map */}
        <AlertsMap selectedAlert={selectedAlertId} onSelectAlert={setSelectedAlertId} />

        {/* Column 3: Detailed Alert Panel & Action Buttons */}
        <div className="alert-detail-column">
          <div className="detail-header-row">
            <span className="detail-title">CHI TIẾT CẢNH BÁO</span>
            <span className={`badge-status ${selectedAlert.status}`}>
              {selectedAlert.statusLabel}
            </span>
          </div>

          <div className="detail-headline-box">
            <span className="headline-icon">⚠️</span>
            <div className="headline-meta">
              <h3>{selectedAlert.title}</h3>
              <span className="alert-id-code">ID: {selectedAlert.code}</span>
            </div>
          </div>

          <div className="alert-meta-grid">
            <div className="meta-row">
              <span className="lbl">Mức độ:</span>
              <strong className={`val-severity ${selectedAlert.severity}`}>
                {selectedAlert.severityLabel}
              </strong>
            </div>

            <div className="meta-row">
              <span className="lbl">Loại cảnh báo:</span>
              <strong className="val">{selectedAlert.type}</strong>
            </div>

            <div className="meta-row">
              <span className="lbl">UAV:</span>
              <strong className="val">{selectedAlert.uavFull}</strong>
            </div>

            <div className="meta-row">
              <span className="lbl">Nhiệm vụ:</span>
              <strong className="val">{selectedAlert.mission}</strong>
            </div>

            <div className="meta-row">
              <span className="lbl">Thời gian:</span>
              <strong className="val font-mono">{selectedAlert.time}</strong>
            </div>

            <div className="meta-row">
              <span className="lbl">Thời gian phát hiện:</span>
              <strong className="val font-mono">{selectedAlert.detectedTime}</strong>
            </div>

            <div className="meta-row">
              <span className="lbl">Vị trí cuối cùng:</span>
              <strong className="val font-mono">{selectedAlert.lat}, {selectedAlert.lon}</strong>
            </div>

            <div className="meta-row">
              <span className="lbl">Độ cao cuối cùng:</span>
              <strong className="val">{selectedAlert.alt}</strong>
            </div>

            <div className="meta-row">
              <span className="lbl">Tốc độ cuối cùng:</span>
              <strong className="val">{selectedAlert.speed}</strong>
            </div>

            <div className="meta-row desc-block">
              <span className="lbl">Mô tả:</span>
              <p className="desc-text">{selectedAlert.detailText}</p>
            </div>
          </div>

          {/* Action Triggers */}
          <div className="alert-actions-section">
            <span className="section-title">HÀNH ĐỘNG</span>
            <div className="action-btn-grid">
              <button className="btn-action red-emergency">
                🚨 Đánh dấu khẩn cấp
              </button>
              <button className="btn-action blue-outline">
                🔄 Thử kết nối lại
              </button>
              <button className="btn-action dark-btn">
                👁️ Xem trên bản đồ
              </button>
              <select className="action-select-btn" defaultValue="">
                <option value="" disabled>Khác ∨</option>
                <option value="rth">Kích hoạt RTH</option>
                <option value="assign">Phân công kỹ thuật viên</option>
                <option value="ignore">Bỏ qua cảnh báo</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Bottom 4 Analytics Cards */}
      <div className="alerts-bottom-grid">
        {/* Card 1: 24h Alerts Time Chart */}
        <AlertsTimeChart />

        {/* Card 2: Alerts by Type Donut Card */}
        <div className="type-donut-card">
          <div className="card-header-row">
            <span className="card-title">THỐNG KÊ CẢNH BÁO THEO LOẠI</span>
          </div>

          <div className="type-donut-body">
            <div className="type-donut-graphic">
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r="38" fill="none" stroke="#161c28" strokeWidth="16" />
                <circle cx="55" cy="55" r="38" fill="none" stroke="#ef4444" strokeWidth="16" strokeDasharray="238" strokeDashoffset="184" transform="rotate(-90 55 55)" />
                <circle cx="55" cy="55" r="38" fill="none" stroke="#f97316" strokeWidth="16" strokeDasharray="238" strokeDashoffset="197" transform="rotate(-9 55 55)" />
                <circle cx="55" cy="55" r="38" fill="none" stroke="#facc15" strokeWidth="16" strokeDasharray="238" strokeDashoffset="202" transform="rotate(52 55 55)" />
                <circle cx="55" cy="55" r="38" fill="none" stroke="#3b82f6" strokeWidth="16" strokeDasharray="238" strokeDashoffset="206" transform="rotate(106 55 55)" />
                <circle cx="55" cy="55" r="38" fill="none" stroke="#22c55e" strokeWidth="16" strokeDasharray="238" strokeDashoffset="211" transform="rotate(154 55 55)" />
                <circle cx="55" cy="55" r="38" fill="none" stroke="#a855f7" strokeWidth="16" strokeDasharray="238" strokeDashoffset="189" transform="rotate(195 55 55)" />
              </svg>
              <div className="type-donut-center">
                <strong className="val">53</strong>
                <span className="lbl">Tổng số</span>
              </div>
            </div>

            <div className="type-legend-list">
              <div className="t-leg-item"><span className="sq-dot" style={{ background: "#ef4444" }}></span> Mất tín hiệu <strong className="val">12 (22.6%)</strong></div>
              <div className="t-leg-item"><span className="sq-dot" style={{ background: "#f97316" }}></span> Pin yếu <strong className="val">9 (17.0%)</strong></div>
              <div className="t-leg-item"><span className="sq-dot" style={{ background: "#facc15" }}></span> Vượt ranh giới <strong className="val">8 (15.1%)</strong></div>
              <div className="t-leg-item"><span className="sq-dot" style={{ background: "#3b82f6" }}></span> Xâm nhập khu vực <strong className="val">7 (13.2%)</strong></div>
              <div className="t-leg-item"><span className="sq-dot" style={{ background: "#22c55e" }}></span> Thời tiết xấu <strong className="val">6 (11.3%)</strong></div>
              <div className="t-leg-item"><span className="sq-dot" style={{ background: "#a855f7" }}></span> Khác <strong className="val">11 (20.8%)</strong></div>
            </div>
          </div>
        </div>

        {/* Card 3: Top UAV Warnings Horizontal Bar Chart */}
        <div className="top-uav-card">
          <div className="card-header-row">
            <span className="card-title">TOP UAV CÓ NHIỀU CẢNH BÁO</span>
          </div>

          <div className="uav-hbars-list">
            {topUavAlerts.map((u) => (
              <div key={u.id} className="hbar-item">
                <span className="u-name">{u.id}</span>
                <div className="hbar-track">
                  <div
                    className="hbar-fill"
                    style={{ width: u.pct, background: u.color }}
                  ></div>
                </div>
                <strong className="u-val">{u.count} ({u.pct})</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Recent Live Stream Alerts Card */}
        <div className="recent-stream-card">
          <div className="card-header-row">
            <span className="card-title">CẢNH BÁO GẦN ĐÂY</span>
            <a href="#all" className="link-all">Xem tất cả &gt;</a>
          </div>

          <div className="stream-items-list">
            <div className="stream-item">
              <span className="st-time font-mono">18:40:21</span>
              <span className="st-title">UAV_02 mất tín hiệu liên lạc</span>
              <span className="badge-severity critical">Nghiêm trọng</span>
            </div>

            <div className="stream-item">
              <span className="st-time font-mono">18:37:45</span>
              <span className="st-title">UAV_03 pin rất thấp</span>
              <span className="badge-severity critical">Nghiêm trọng</span>
            </div>

            <div className="stream-item">
              <span className="st-time font-mono">18:35:12</span>
              <span className="st-title">UAV_01 đi ra ngoài khu vực cho phép</span>
              <span className="badge-severity major">Quan trọng</span>
            </div>

            <div className="stream-item">
              <span className="st-time font-mono">18:32:08</span>
              <span className="st-title">Phát hiện xâm nhập khu vực cấm bay</span>
              <span className="badge-severity major">Quan trọng</span>
            </div>

            <div className="stream-item">
              <span className="st-time font-mono">18:30:00</span>
              <span className="st-title">Điều kiện thời tiết xấu</span>
              <span className="badge-severity moderate">Trung bình</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
