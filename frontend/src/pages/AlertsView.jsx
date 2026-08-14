import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Crosshair,
  Wifi,
  Battery,
  User,
  AlertTriangle,
  Info,
  Search,
  Map as MapIcon,
  Download,
} from "lucide-react";
import { API_BASE, getLogs, listTargets, listUAVs, logsExportUrl } from "../api";
import AlertsMap from "../components/AlertsMap";
import AlertsTimeChart from "../components/AlertsTimeChart";
import DonutChart from "../components/DonutChart";

const SEVERITY_LABEL = { red: "Nguy hiểm", yellow: "Cảnh báo" };
const SEVERITY_CLASS = { red: "critical", yellow: "moderate" }; // dùng lại CSS badge-severity có sẵn

export default function AlertsView({ onOpenMap }) {
  const [currentTime, setCurrentTime] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [targets, setTargets] = useState([]);
  const [uavs, setUavs] = useState([]);
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterUav, setFilterUav] = useState("");
  const [search, setSearch] = useState("");

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

  useEffect(() => {
    async function load() {
      const params = {};
      if (filterSeverity) params.severity = filterSeverity;
      if (filterClass) params.class_ = filterClass;
      if (filterUav) params.uav_id = filterUav;
      const [logs, targetList, uavList] = await Promise.all([getLogs(params), listTargets(), listUAVs()]);
      setAlerts(Array.isArray(logs) ? logs : []);
      setTargets(Array.isArray(targetList) ? targetList : []);
      setUavs(Array.isArray(uavList) ? uavList : []);
    }
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [filterSeverity, filterClass, filterUav]);

  const filtered = useMemo(() => {
    if (!search.trim()) return alerts;
    const q = search.toLowerCase();
    return alerts.filter((a) => a.class?.toLowerCase().includes(q));
  }, [alerts, search]);

  const selectedAlert = alerts.find((a) => a.id === selectedAlertId) ?? null;
  const matchedTarget = selectedAlert
    ? targets.find((t) => t.track_id === selectedAlert.track_id && t.uav_id === selectedAlert.uav_id)
    : null;

  function uavName(id) {
    return uavs.find((u) => u.id === id)?.name ?? `UAV #${id}`;
  }

  const redCount = alerts.filter((a) => a.severity === "red").length;
  const yellowCount = alerts.filter((a) => a.severity === "yellow").length;

  const classCounts = {};
  alerts.forEach((a) => { classCounts[a.class] = (classCounts[a.class] ?? 0) + 1; });
  const topClass = Object.entries(classCounts).sort((a, b) => b[1] - a[1])[0];

  const uavCounts = {};
  alerts.forEach((a) => { uavCounts[a.uav_id] = (uavCounts[a.uav_id] ?? 0) + 1; });
  const topUavAlerts = Object.entries(uavCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([uavId, count]) => ({ id: uavName(Number(uavId)), count }));
  const maxUavCount = Math.max(...topUavAlerts.map((u) => u.count), 1);

  // Bucket cảnh báo theo giờ trong 24h qua (dữ liệu thật từ alert_events)
  const now = Date.now();
  const redBuckets = Array(24).fill(0);
  const yellowBuckets = Array(24).fill(0);
  alerts.forEach((a) => {
    const ageHours = (now - new Date(a.timestamp).getTime()) / 3_600_000;
    if (ageHours < 0 || ageHours >= 24) return;
    const bucket = 23 - Math.floor(ageHours);
    if (a.severity === "red") redBuckets[bucket]++;
    else if (a.severity === "yellow") yellowBuckets[bucket]++;
  });

  const classSegments = Object.entries(classCounts).map(([cls, n], i) => ({
    label: cls, value: n, color: ["#f87171", "#60a5fa", "#facc15", "#a855f7", "#4ade80"][i % 5],
  }));

  return (
    <div className="alerts-page-layout">
      <div className="live-sub-header">
        <div className="header-left">
          <div className="uav-selector-wrapper">
            <Bell size={18} color="#4ade80" />
            <span className="sub-title-label">CẢNH BÁO</span>
            <span className="dot-divider">/</span>
            <span className="breadcrumb-sub">Trang chủ &gt; Cảnh báo</span>
          </div>
        </div>
        <div className="header-right-telemetry">
          <div className="telemetry-pill"><Crosshair size={14} color="#4ade80" /><span>GPS <strong>12</strong></span></div>
          <div className="telemetry-pill green"><Wifi size={14} /><span>Liên kết <strong>Strong</strong></span></div>
          <div className="telemetry-pill green"><Battery size={14} /><span>Pin <strong>78%</strong></span></div>
          <div className="telemetry-pill clock-pill"><span>{currentTime || "-"}</span></div>
          <div className="user-profile-badge">
            <div className="avatar"><User size={16} color="#e6e8ec" /></div>
            <div className="user-info"><span className="username">admin</span><span className="user-role">Quản trị viên</span></div>
          </div>
        </div>
      </div>

      {/* KPI row — chỉ 2 mức nghiêm trọng thật (red/yellow), không bịa 4 mức */}
      <div className="alerts-kpi-grid">
        <div className="kpi-card border-red">
          <div className="kpi-icon red"><AlertTriangle size={20} color="#f87171" /></div>
          <div className="kpi-body"><span className="kpi-label">MỨC NGUY HIỂM</span><div className="kpi-val red-text">{redCount}</div></div>
        </div>
        <div className="kpi-card border-yellow">
          <div className="kpi-icon yellow"><Bell size={20} color="#facc15" /></div>
          <div className="kpi-body"><span className="kpi-label">MỨC CẢNH BÁO</span><div className="kpi-val yellow-text">{yellowCount}</div></div>
        </div>
        <div className="kpi-card border-blue">
          <div className="kpi-icon blue"><Info size={20} color="#60a5fa" /></div>
          <div className="kpi-body"><span className="kpi-label">LOẠI PHỔ BIẾN NHẤT</span><div className="kpi-val blue-text">{topClass ? `${topClass[0]} (${topClass[1]})` : "-"}</div></div>
        </div>
        <div className="kpi-card total-donut-kpi-card">
          <div className="total-kpi-donut-box">
            <DonutChart segments={[{ label: "Nguy hiểm", value: redCount, color: "#ef4444" }, { label: "Cảnh báo", value: yellowCount, color: "#facc15" }]} size={60} />
          </div>
          <div className="kpi-body"><span className="kpi-label">TỔNG CẢNH BÁO</span><div className="kpi-val">{alerts.length}</div></div>
        </div>
      </div>

      {/* Row 2: table / map / detail */}
      <div className="alerts-main-split-grid">
        <div className="alerts-table-column">
          <div className="table-filter-row">
            <div className="search-box"><span><Search size={14} /></span><input type="text" placeholder="Tìm theo loại đối tượng..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <select className="filter-select" value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)}>
              <option value="">Tất cả mức độ</option>
              <option value="red">Nguy hiểm</option>
              <option value="yellow">Cảnh báo</option>
            </select>
            <select className="filter-select" value={filterUav} onChange={(e) => setFilterUav(e.target.value)}>
              <option value="">Tất cả UAV</option>
              {uavs.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <a className="btn-action dark-btn" href={logsExportUrl({ severity: filterSeverity || undefined, class_: filterClass || undefined })} style={{ textDecoration: "none" }}>
              <Download size={14} /> CSV
            </a>
          </div>

          <div className="alerts-table-wrapper">
            <table>
              <thead><tr><th>MỨC ĐỘ</th><th>ĐỐI TƯỢNG</th><th>UAV</th><th>THỜI GIAN</th></tr></thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className={`alert-tr ${item.id === selectedAlertId ? "selected" : ""}`} onClick={() => setSelectedAlertId(item.id)}>
                    <td><span className={`badge-severity ${SEVERITY_CLASS[item.severity] ?? "info"}`}>{SEVERITY_LABEL[item.severity] ?? item.severity}</span></td>
                    <td><div className="alert-title-cell"><strong>{item.class}</strong><span className="sub-desc">{item.distance_m} m</span></div></td>
                    <td className="uav-cell">{uavName(item.uav_id)}</td>
                    <td className="font-mono text-muted">{new Date(item.timestamp).toLocaleString("vi-VN")}</td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={4} className="muted" style={{ padding: "12px" }}>Chưa có cảnh báo phù hợp bộ lọc.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="table-footer-pagination"><span className="footer-count">Hiển thị {filtered.length} / {alerts.length} cảnh báo (tối đa 500 bản ghi gần nhất)</span></div>
        </div>

        <AlertsMap alerts={filtered} targets={targets} selectedAlert={selectedAlertId} onSelectAlert={setSelectedAlertId} />

        <div className="alert-detail-column">
          <div className="detail-header-row"><span className="detail-title">CHI TIẾT CẢNH BÁO</span></div>
          {!selectedAlert ? (
            <p className="muted">Chọn một dòng trong bảng để xem chi tiết.</p>
          ) : (
            <>
              <div className="detail-headline-box">
                <span className="headline-icon"><AlertTriangle size={20} color="#f87171" /></span>
                <div className="headline-meta">
                  <h3>{selectedAlert.class} · {selectedAlert.distance_m} m</h3>
                  <span className="alert-id-code">ID: #{selectedAlert.id} · Track {selectedAlert.track_id}</span>
                </div>
              </div>

              <img
                src={`${API_BASE}/api/logs/${selectedAlert.id}/snapshot`}
                alt="snapshot"
                style={{ width: "100%", borderRadius: "6px", marginBottom: "10px", border: "1px solid #1e293b" }}
                onError={(e) => { e.target.style.display = "none"; }}
              />

              <div className="alert-meta-grid">
                <div className="meta-row"><span className="lbl">Mức độ:</span><strong className={`val-severity ${SEVERITY_CLASS[selectedAlert.severity] ?? "info"}`}>{SEVERITY_LABEL[selectedAlert.severity] ?? selectedAlert.severity}</strong></div>
                <div className="meta-row"><span className="lbl">UAV:</span><strong className="val">{uavName(selectedAlert.uav_id)}</strong></div>
                <div className="meta-row"><span className="lbl">Thời gian:</span><strong className="val font-mono">{new Date(selectedAlert.timestamp).toLocaleString("vi-VN")}</strong></div>
                <div className="meta-row"><span className="lbl">Khoảng cách:</span><strong className="val">{selectedAlert.distance_m} m</strong></div>
                <div className="meta-row"><span className="lbl">Toạ độ ước tính:</span><strong className="val font-mono">{matchedTarget?.lat != null ? `${matchedTarget.lat.toFixed(5)}°, ${matchedTarget.lon.toFixed(5)}°` : "Không xác định được"}</strong></div>
              </div>

              <div className="alert-actions-section">
                <span className="section-title">HÀNH ĐỘNG</span>
                <div className="action-btn-grid">
                  <button className="btn-action dark-btn" onClick={() => onOpenMap && onOpenMap()} disabled={!onOpenMap}>
                    <MapIcon size={14} /> Xem trên bản đồ
                  </button>
                  <button className="btn-action red-emergency" disabled title="Chưa có hệ thống thông báo khẩn cấp">Đánh dấu khẩn cấp</button>
                  <button className="btn-action blue-outline" disabled title="Chưa nối MAVLink thật">Kích hoạt RTH</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 3: analytics thật */}
      <div className="alerts-bottom-grid">
        <AlertsTimeChart redBuckets={redBuckets} yellowBuckets={yellowBuckets} />

        <div className="type-donut-card">
          <div className="card-header-row"><span className="card-title">CẢNH BÁO THEO LOẠI ĐỐI TƯỢNG</span></div>
          {classSegments.length === 0 ? <p className="muted">Chưa có dữ liệu.</p> : <DonutChart segments={classSegments} size={120} />}
        </div>

        <div className="top-uav-card">
          <div className="card-header-row"><span className="card-title">TOP UAV CÓ NHIỀU CẢNH BÁO</span></div>
          {topUavAlerts.length === 0 && <p className="muted">Chưa có dữ liệu.</p>}
          <div className="uav-hbars-list">
            {topUavAlerts.map((u) => (
              <div key={u.id} className="hbar-item">
                <span className="u-name">{u.id}</span>
                <div className="hbar-track"><div className="hbar-fill" style={{ width: `${(u.count / maxUavCount) * 100}%`, background: "#ef4444" }} /></div>
                <strong className="u-val">{u.count}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="recent-stream-card">
          <div className="card-header-row"><span className="card-title">CẢNH BÁO GẦN ĐÂY</span></div>
          <div className="stream-items-list">
            {alerts.slice(0, 5).map((a) => (
              <div key={a.id} className="stream-item">
                <span className="st-time font-mono">{new Date(a.timestamp).toLocaleTimeString("vi-VN")}</span>
                <span className="st-title">{a.class} · {a.distance_m}m · {uavName(a.uav_id)}</span>
                <span className={`badge-severity ${SEVERITY_CLASS[a.severity] ?? "info"}`}>{SEVERITY_LABEL[a.severity] ?? a.severity}</span>
              </div>
            ))}
            {alerts.length === 0 && <p className="muted">Chưa có cảnh báo.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
