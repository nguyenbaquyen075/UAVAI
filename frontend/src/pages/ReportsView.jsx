import { useEffect, useState } from "react";
import MissionDayChart from "../components/MissionDayChart";
import DistanceChart from "../components/DistanceChart";

const MISSION_TYPE_DATA = [
  { label: "Giám sát", value: 10, pct: "35.7%", color: "#22c55e" },
  { label: "Tìm kiếm cứu nạn", value: 6, pct: "21.4%", color: "#3b82f6" },
  { label: "Trinh sát", value: 5, pct: "17.9%", color: "#facc15" },
  { label: "Đo đạc", value: 4, pct: "14.3%", color: "#f97316" },
  { label: "Khác", value: 3, pct: "10.7%", color: "#a855f7" },
];

const UAV_PERF_DATA = [
  { name: "UAV_01 - Eagle Pro", hours: "15h 20m", missions: 9, rate: 94.4, rateClass: "green" },
  { name: "UAV_02 - Falcon 8X", hours: "12h 45m", missions: 7, rate: 85.7, rateClass: "yellow" },
  { name: "UAV_03 - SkyEye 4K", hours: "9h 30m", missions: 6, rate: 100, rateClass: "green" },
  { name: "UAV_04 - Phantom 4 RTK", hours: "5h 10m", missions: 4, rate: 87.5, rateClass: "yellow" },
  { name: "UAV_05 - Matrice 300", hours: "2h 45m", missions: 2, rate: 100, rateClass: "green" },
];

const INCIDENT_DATA = [
  { label: "Mất tín hiệu", value: 3, pct: "42.9%", color: "#ef4444" },
  { label: "Pin yếu", value: 2, pct: "28.6%", color: "#f97316" },
  { label: "Va chạm", value: 1, pct: "14.3%", color: "#facc15" },
  { label: "Lỗi thiết bị", value: 1, pct: "14.3%", color: "#3b82f6" },
];

const TARGET_STATS = [
  { icon: "🚗", label: "Phương tiện", count: 68, change: "+29.9%", up: true },
  { icon: "🧍", label: "Người", count: 42, change: "+40.0%", up: true },
  { icon: "📦", label: "Vật thể lạ", count: 27, change: "+17.4%", up: true },
  { icon: "📊", label: "Khác", count: 19, change: "-5.0%", up: false },
];

const REPORT_LIST = [
  { id: 1, name: "Báo cáo nhiệm vụ tuần 19", type: "Tổng hợp tuần", uav: "Tất cả", mission: "Tất cả", range: "06/05-13/05/2024", author: "admin", date: "13/05/2024 09:15", format: "PDF", size: "2.4 MB" },
  { id: 2, name: "Báo cáo giám sát khu vực A", type: "Giám sát", uav: "UAV_02", mission: "NV_20240512_01", range: "12/05/2024", author: "admin", date: "12/05/2024 18:30", format: "PDF", size: "1.8 MB" },
  { id: 3, name: "Báo cáo trinh sát biên giới", type: "Trinh sát", uav: "UAV_03", mission: "NV_20240511_03", range: "11/05/2024", author: "operator1", date: "11/05/2024 21:45", format: "PDF", size: "3.1 MB" },
  { id: 4, name: "Báo cáo tìm kiếm cứu nạn", type: "Tìm kiếm cứu nạn", uav: "UAV_01", mission: "NV_20240510_02", range: "10/05/2024", author: "operator2", date: "10/05/2024 16:20", format: "PDF", size: "2.0 MB" },
  { id: 5, name: "Báo cáo tổng hợp tháng 04", type: "Tổng hợp tháng", uav: "Tất cả", mission: "Tất cả", range: "01/04-30/04/2024", author: "admin", date: "01/05/2024 10:00", format: "PDF", size: "5.6 MB" },
];

const RECENT_REPORTS = [
  { name: "Báo cáo nhiệm vụ tuần 19", sub: "06/05 - 13/05/2024", date: "13/05/2024 09:15" },
  { name: "Báo cáo giám sát khu vực A", sub: "Nhiệm vụ: NV_20240512_01", date: "12/05/2024 18:30" },
  { name: "Báo cáo trinh sát biên giới", sub: "Nhiệm vụ: NV_20240511_03", date: "11/05/2024 21:45" },
  { name: "Báo cáo tìm kiếm cứu nạn", sub: "Nhiệm vụ: NV_20240510_02", date: "10/05/2024 16:30" },
  { name: "Báo cáo tổng hợp tháng 04", sub: "01/04 - 30/04/2024", date: "01/05/2024 10:00" },
];

function MissionTypeDonut() {
  const total = MISSION_TYPE_DATA.reduce((s, d) => s + d.value, 0);
  const r = 38, cx = 55, cy = 55, c = 2 * Math.PI * r;
  let offset = 0;
  const segs = MISSION_TYPE_DATA.map(d => {
    const dash = (d.value / total) * c;
    const seg = { ...d, dash, offset };
    offset += dash;
    return seg;
  });

  return (
    <div className="report-chart-card">
      <div className="card-header-row">
        <span className="card-title">PHÂN BỔ NHIỆM VỤ THEO LOẠI</span>
      </div>
      <div className="donut-split-body">
        <div className="donut-svg-box">
          <svg width="110" height="110" viewBox="0 0 110 110">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#161c28" strokeWidth="18" />
            {segs.map((s, i) => (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                stroke={s.color} strokeWidth="18"
                strokeDasharray={`${s.dash} ${c - s.dash}`}
                strokeDashoffset={-s.offset + c / 4}
              />
            ))}
          </svg>
          <div className="donut-center-abs">
            <strong>{total}</strong>
            <span>Tổng số</span>
          </div>
        </div>
        <div className="donut-legend-list">
          {MISSION_TYPE_DATA.map(d => (
            <div key={d.label} className="dl-item">
              <span className="dl-dot" style={{ background: d.color }}></span>
              <span className="dl-label">{d.label}</span>
              <strong className="dl-val">{d.value} ({d.pct})</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function IncidentDonut() {
  const total = INCIDENT_DATA.reduce((s, d) => s + d.value, 0);
  const r = 38, cx = 55, cy = 55, c = 2 * Math.PI * r;
  let offset = 0;
  const segs = INCIDENT_DATA.map(d => {
    const dash = (d.value / total) * c;
    const seg = { ...d, dash, offset };
    offset += dash;
    return seg;
  });

  return (
    <div className="report-chart-card">
      <div className="card-header-row">
        <span className="card-title">THỐNG KÊ SỰ CỐ</span>
      </div>
      <div className="donut-split-body">
        <div className="donut-svg-box">
          <svg width="110" height="110" viewBox="0 0 110 110">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#161c28" strokeWidth="18" />
            {segs.map((s, i) => (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                stroke={s.color} strokeWidth="18"
                strokeDasharray={`${s.dash} ${c - s.dash}`}
                strokeDashoffset={-s.offset + c / 4}
              />
            ))}
          </svg>
          <div className="donut-center-abs">
            <strong>{total}</strong>
            <span>Tổng số</span>
          </div>
        </div>
        <div className="donut-legend-list">
          {INCIDENT_DATA.map(d => (
            <div key={d.label} className="dl-item">
              <span className="dl-dot" style={{ background: d.color }}></span>
              <span className="dl-label">{d.label}</span>
              <strong className="dl-val">{d.value} ({d.pct})</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ReportsView() {
  const [currentTime, setCurrentTime] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const t = now.toTimeString().slice(0, 8);
      const d = `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()}`;
      setCurrentTime(`${t} ${d}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="reports-page-layout">

      {/* ── Sub Header ── */}
      <div className="live-sub-header">
        <div className="header-left">
          <div className="uav-selector-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span className="sub-title-label">BÁO CÁO</span>
            <span className="dot-divider">/</span>
            <span className="breadcrumb-sub">Trang chủ &gt; Báo cáo</span>
          </div>
        </div>
        <div className="header-right-telemetry">
          <div className="telemetry-pill"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg><span>GPS <strong>12</strong></span></div>
          <div className="telemetry-pill green"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg><span>Liên kết <strong>Strong</strong></span></div>
          <div className="telemetry-pill green"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="11" x2="23" y2="13"/></svg><span>Pin <strong>78%</strong></span></div>
          <div className="telemetry-pill clock-pill">{currentTime || "18:42:10 13/05/2024"}</div>
          <div className="user-profile-badge">
            <div className="avatar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e6e8ec" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
            <div className="user-info"><span className="username">admin</span><span className="user-role">Quản trị viên</span></div>
          </div>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="reports-filter-bar">
        <div className="filter-group">
          <label>Loại báo cáo</label>
          <select className="filter-select"><option>Tất cả</option><option>Tổng hợp tuần</option><option>Giám sát</option></select>
        </div>
        <div className="filter-group">
          <label>UAV</label>
          <select className="filter-select"><option>Tất cả</option><option>UAV_01</option><option>UAV_02</option></select>
        </div>
        <div className="filter-group">
          <label>Nhiệm vụ</label>
          <select className="filter-select"><option>Tất cả</option></select>
        </div>
        <div className="filter-group">
          <label>Khoảng thời gian</label>
          <div className="date-range-btn">📅 01/05/2024 - 13/05/2024</div>
        </div>
        <div className="filter-actions-right">
          <button className="btn-schedule">🗓️ Lịch báo cáo</button>
          <button className="btn-create-report">+ Tạo báo cáo mới</button>
        </div>
      </div>

      {/* ── Row 1: 6 KPI Cards ── */}
      <div className="reports-kpi-grid">
        <div className="rpt-kpi-card">
          <div className="rpt-kpi-icon blue">📋</div>
          <div className="rpt-kpi-body">
            <span className="rpt-kpi-label">TỔNG SỐ NHIỆM VỤ</span>
            <div className="rpt-kpi-val">28</div>
            <span className="rpt-kpi-trend up">↑ 21.7% so với kỳ trước</span>
          </div>
        </div>
        <div className="rpt-kpi-card">
          <div className="rpt-kpi-icon cyan">🕒</div>
          <div className="rpt-kpi-body">
            <span className="rpt-kpi-label">TỔNG THỜI GIAN BAY</span>
            <div className="rpt-kpi-val" style={{fontSize:"18px"}}>45h 32m</div>
            <span className="rpt-kpi-trend up">↑ 18.3% so với kỳ trước</span>
          </div>
        </div>
        <div className="rpt-kpi-card">
          <div className="rpt-kpi-icon green">📍</div>
          <div className="rpt-kpi-body">
            <span className="rpt-kpi-label">TỔNG QUẢNG ĐƯỜNG</span>
            <div className="rpt-kpi-val">1,248 <span className="unit">km</span></div>
            <span className="rpt-kpi-trend up">↑ 24.6% so với kỳ trước</span>
          </div>
        </div>
        <div className="rpt-kpi-card">
          <div className="rpt-kpi-icon orange">🎯</div>
          <div className="rpt-kpi-body">
            <span className="rpt-kpi-label">TỔNG MỤC TIÊU PHÁT HIỆN</span>
            <div className="rpt-kpi-val">156</div>
            <span className="rpt-kpi-trend up">↑ 31.4% so với kỳ trước</span>
          </div>
        </div>
        <div className="rpt-kpi-card">
          <div className="rpt-kpi-icon check">✅</div>
          <div className="rpt-kpi-body">
            <span className="rpt-kpi-label">TỶ LỆ HOÀN THÀNH NHIỆM VỤ</span>
            <div className="rpt-kpi-val green-val">92.6%</div>
            <span className="rpt-kpi-trend up">↑ 8.1% so với kỳ trước</span>
          </div>
        </div>
        <div className="rpt-kpi-card">
          <div className="rpt-kpi-icon red">⚠️</div>
          <div className="rpt-kpi-body">
            <span className="rpt-kpi-label">SỰ CỐ XẢY RA</span>
            <div className="rpt-kpi-val red-val">7</div>
            <span className="rpt-kpi-trend down">↓ -12.5% so với kỳ trước</span>
          </div>
        </div>
      </div>

      {/* ── Row 2: Charts + Donut + UAV Table ── */}
      <div className="reports-mid-grid">
        {/* Mission/day bar chart spanning 2 cols */}
        <MissionDayChart />

        {/* Mission type donut */}
        <MissionTypeDonut />

        {/* UAV performance table */}
        <div className="report-chart-card uav-perf-card">
          <div className="card-header-row">
            <span className="card-title">TỔNG HỢP THEO UAV</span>
            <a href="#details" className="link-detail">Xem chi tiết &gt;</a>
          </div>
          <table className="rpt-table">
            <thead>
              <tr>
                <th>UAV</th>
                <th>Thời gian bay</th>
                <th>Nhiệm vụ</th>
                <th>Tỷ lệ HT</th>
              </tr>
            </thead>
            <tbody>
              {UAV_PERF_DATA.map(u => (
                <tr key={u.name}>
                  <td><strong style={{fontSize:"11px"}}>{u.name}</strong></td>
                  <td className="font-mono">{u.hours}</td>
                  <td>{u.missions}</td>
                  <td><span className={`rate-badge ${u.rateClass}`}>{u.rate}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <a href="#all" className="link-detail" style={{textAlign:"right",display:"block",marginTop:"6px"}}>Xem chi tiết &gt;</a>
        </div>
      </div>

      {/* ── Row 3: Distance chart + Target stats + Incident donut + Recent reports ── */}
      <div className="reports-bot-grid">
        {/* Distance area chart */}
        <DistanceChart />

        {/* Target detection stats */}
        <div className="report-chart-card">
          <div className="card-header-row">
            <span className="card-title">THỐNG KÊ MỤC TIÊU PHÁT HIỆN</span>
          </div>
          <div className="target-stats-list">
            {TARGET_STATS.map(t => (
              <div key={t.label} className="tgt-stat-row">
                <span className="tgt-icon">{t.icon}</span>
                <span className="tgt-label">{t.label}</span>
                <strong className="tgt-count">{t.count}</strong>
                <span className={`tgt-change ${t.up ? "up" : "down"}`}>{t.change}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Incident donut */}
        <IncidentDonut />

        {/* Recent reports list */}
        <div className="report-chart-card recent-rpts-card">
          <div className="card-header-row">
            <span className="card-title">BÁO CÁO GẦN NHẤT</span>
          </div>
          <div className="recent-rpt-list">
            {RECENT_REPORTS.map((r, i) => (
              <div key={i} className="recent-rpt-item">
                <div className="rpt-file-icon">📄</div>
                <div className="rpt-info">
                  <strong>{r.name}</strong>
                  <span className="rpt-sub">{r.sub}</span>
                </div>
                <span className="rpt-date font-mono">{r.date}</span>
              </div>
            ))}
          </div>
          <a href="#all" className="link-detail" style={{textAlign:"right",display:"block",marginTop:"6px"}}>Xem tất cả báo cáo &gt;</a>
        </div>
      </div>

      {/* ── Row 4: Report list table ── */}
      <div className="report-list-card">
        <div className="card-header-row">
          <span className="card-title">DANH SÁCH BÁO CÁO</span>
        </div>
        <div className="rpt-table-wrapper">
          <table className="rpt-table full">
            <thead>
              <tr>
                <th>#</th>
                <th>Tên báo cáo</th>
                <th>Loại báo cáo</th>
                <th>UAV</th>
                <th># Nhiệm vụ</th>
                <th>Khoảng thời gian</th>
                <th>Người tạo</th>
                <th>Ngày tạo</th>
                <th>Định dạng</th>
                <th>Kích thước</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {REPORT_LIST.map(r => (
                <tr key={r.id} className={selectedReport === r.id ? "selected-row" : ""} onClick={() => setSelectedReport(r.id)}>
                  <td className="font-mono">{r.id}</td>
                  <td><strong style={{color:"#f8fafc"}}>{r.name}</strong></td>
                  <td><span className="type-pill">{r.type}</span></td>
                  <td>{r.uav}</td>
                  <td>{r.mission}</td>
                  <td className="font-mono" style={{fontSize:"10px"}}>{r.range}</td>
                  <td>{r.author}</td>
                  <td className="font-mono" style={{fontSize:"10px"}}>{r.date}</td>
                  <td><span className="fmt-badge">📄 {r.format}</span></td>
                  <td className="font-mono">{r.size}</td>
                  <td>
                    <div className="rpt-actions">
                      <button className="icon-action-btn" title="Xem">👁️</button>
                      <button className="icon-action-btn" title="Tải xuống">📥</button>
                      <button className="icon-action-btn danger" title="Xoá">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="rpt-table-footer">
          <span className="footer-count">Hiện thị 1 - 5 của 24 báo cáo</span>
          <div className="rpt-pagination">
            <button className="p-btn">&lt;</button>
            {[1,2,3,4,5].map(p => (
              <button key={p} className={`p-num ${p === 1 ? "active" : ""}`}>{p}</button>
            ))}
            <button className="p-btn">&gt;</button>
          </div>
          <div className="rpt-page-size">
            Hiển thị <select className="mini-select" defaultValue="5"><option>5</option><option>10</option></select> / trang
          </div>
        </div>
      </div>

    </div>
  );
}
