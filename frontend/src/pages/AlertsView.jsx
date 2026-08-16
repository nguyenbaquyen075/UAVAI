import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Search,
  Maximize2,
  ShieldAlert,
  Download,
} from "lucide-react";
import AlertsMap from "../components/AlertsMap";
import AlertsTimeChart from "../components/AlertsTimeChart";
import DonutChart from "../components/DonutChart";
import { API_BASE, getLogs, listTargets, listUAVs, logsExportUrl } from "../api";

const SEVERITY_LABEL = { red: "Nguy hiểm", yellow: "Cảnh báo nhẹ" };
const CLASS_LABEL = { person: "Người", car: "Ô tô", motorcycle: "Xe máy", bus: "Xe buýt", truck: "Xe tải" };
const CLASS_COLOR = { person: "#22c55e", car: "#3b82f6", motorcycle: "#f59e0b", bus: "#a855f7", truck: "#ef4444" };
const PAGE_SIZE = 10;

function fmtTime(iso) {
  if (!iso) return "--";
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")} ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function bucketByHour(rows) {
  const buckets = Array.from({ length: 13 }, () => ({ red: 0, yellow: 0 }));
  rows.forEach((r) => {
    const d = new Date(r.timestamp);
    if (Number.isNaN(d.getTime())) return;
    const idx = Math.min(12, Math.floor(d.getHours() / 2));
    if (r.severity === "red") buckets[idx].red += 1;
    else if (r.severity === "yellow") buckets[idx].yellow += 1;
  });
  return buckets;
}

export default function AlertsView({ onOpenMap }) {
  const [rows, setRows] = useState([]);
  const [targets, setTargets] = useState([]);
  const [uavs, setUavs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ severity: "", class_: "", start: "", end: "" });
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState(1);

  async function refresh() {
    const params = {};
    if (filters.severity) params.severity = filters.severity;
    if (filters.class_) params.class_ = filters.class_;
    if (filters.start) params.start = `${filters.start}:00Z`;
    if (filters.end) params.end = `${filters.end}:59Z`;
    const [logs, tgs, uavList] = await Promise.all([getLogs(params), listTargets(), listUAVs()]);
    const list = Array.isArray(logs) ? logs : [];
    setRows(list);
    setTargets(Array.isArray(tgs) ? tgs : []);
    setUavs(Array.isArray(uavList) ? uavList : []);
    setSelectedId((cur) => (list.some((r) => r.id === cur) ? cur : list[0]?.id ?? null));
    setLoading(false);
    setPage(1);
  }

  useEffect(() => { refresh(); }, []);

  const filtered = rows.filter((r) => !search || `${r.class} ${r.uav_id}`.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = rows.find((r) => r.id === selectedId) || null;
  const selectedUav = selected ? uavs.find((u) => u.id === selected.uav_id) : null;

  const redCount = rows.filter((r) => r.severity === "red").length;
  const yellowCount = rows.filter((r) => r.severity === "yellow").length;

  const byClass = rows.reduce((acc, r) => { acc[r.class] = (acc[r.class] || 0) + 1; return acc; }, {});

  const byUav = rows.reduce((acc, r) => { acc[r.uav_id] = (acc[r.uav_id] || 0) + 1; return acc; }, {});
  const uavBars = Object.entries(byUav)
    .map(([uavId, count]) => ({ uavId: Number(uavId), name: uavs.find((u) => u.id === Number(uavId))?.name || `UAV#${uavId}`, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
  const maxUavCount = Math.max(1, ...uavBars.map((u) => u.count));

  const recent = [...rows].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);

  if (loading) {
    return <div className="alerts-page-layout-v2"><div className="chart-empty-state">Đang tải cảnh báo…</div></div>;
  }

  return (
    <div className="alerts-page-layout-v2">
      {/* Top Summary Cards */}
      <div className="alerts-top-5-summary">
        <div className="alerts-sum-card card-red">
          <div className="ic-box icon-red"><AlertTriangle size={18} /></div>
          <div className="card-info">
            <span className="lbl">Cảnh báo nguy hiểm</span>
            <span className="val text-red">{redCount}</span>
          </div>
        </div>

        <div className="alerts-sum-card card-yellow">
          <div className="ic-box icon-yellow"><AlertTriangle size={18} /></div>
          <div className="card-info">
            <span className="lbl">Cảnh báo nhẹ</span>
            <span className="val text-yellow">{yellowCount}</span>
          </div>
        </div>

        <div className="alerts-sum-card total-donut-sum-card">
          <DonutChart segments={[
            { label: "Nguy hiểm", value: redCount, color: "#ef4444" },
            { label: "Cảnh báo nhẹ", value: yellowCount, color: "#f59e0b" },
          ]} size={90} />
        </div>
      </div>

      {/* Main Split Section */}
      <div className="alerts-main-split-v2">
        <div className="dashboard-panel alerts-table-panel">
          <div className="panel-tabs-header">
            <div className="tabs-flex">
              <span className="tab-btn active">Danh sách cảnh báo</span>
            </div>
          </div>

          <div className="alerts-filters-row">
            <div className="search-box-wrap">
              <Search size={14} className="search-ic" />
              <input type="text" placeholder="Tìm theo loại / UAV..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="filter-select-sm" value={filters.severity} onChange={(e) => setFilters({ ...filters, severity: e.target.value })}>
              <option value="">Tất cả mức độ</option>
              <option value="red">Nguy hiểm</option>
              <option value="yellow">Cảnh báo nhẹ</option>
            </select>
            <select className="filter-select-sm" value={filters.class_} onChange={(e) => setFilters({ ...filters, class_: e.target.value })}>
              <option value="">Tất cả loại</option>
              {Object.entries(CLASS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input type="datetime-local" value={filters.start} onChange={(e) => setFilters({ ...filters, start: e.target.value })} />
            <input type="datetime-local" value={filters.end} onChange={(e) => setFilters({ ...filters, end: e.target.value })} />
            <button className="btn-act dark-outline" onClick={refresh}>Lọc</button>
            <a className="btn-act dark-outline" href={logsExportUrl()} target="_blank" rel="noreferrer"><Download size={14} /> CSV</a>
          </div>

          <div className="alerts-table-wrapper">
            <table className="alerts-table">
              <thead>
                <tr>
                  <th>MỨC ĐỘ</th>
                  <th>LOẠI / KHOẢNG CÁCH</th>
                  <th>UAV</th>
                  <th>THỜI GIAN</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 && (
                  <tr><td colSpan={4} className="chart-empty-state">Không có cảnh báo nào</td></tr>
                )}
                {pageRows.map((a) => {
                  const isSelected = a.id === selectedId;
                  const uav = uavs.find((u) => u.id === a.uav_id);
                  return (
                    <tr key={a.id} className={`alert-tr ${isSelected ? "selected" : ""}`} onClick={() => setSelectedId(a.id)}>
                      <td>
                        <span className={`sev-tag ${a.severity === "red" ? "critical" : "medium"}`}>
                          {a.severity === "red" ? "⚠️ " : "🔔 "}{SEVERITY_LABEL[a.severity] || a.severity}
                        </span>
                      </td>
                      <td>
                        <div className="alert-content-cell">
                          <span className="main-title">{CLASS_LABEL[a.class] || a.class}</span>
                          <span className="sub-desc">{a.distance_m} m</span>
                        </div>
                      </td>
                      <td>{uav ? uav.name : `UAV#${a.uav_id}`}</td>
                      <td className="font-mono text-muted">{fmtTime(a.timestamp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="alerts-pagination-bar">
              <span className="count-text">Hiển thị {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, filtered.length)} của {filtered.length} cảnh báo</span>
              <div className="pages-flex">
                <button className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>&lt;</button>
                <span className="page-btn active">{page} / {totalPages}</span>
                <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>&gt;</button>
              </div>
            </div>
          )}
        </div>

        <div className="dashboard-panel alerts-map-panel">
          <div className="panel-section-header">
            <h3 className="section-title">VỊ TRÍ CẢNH BÁO</h3>
            <div className="map-actions">
              <button className="btn-ic" onClick={onOpenMap}><Maximize2 size={14} /></button>
            </div>
          </div>
          <div className="map-leaflet-wrapper">
            <AlertsMap alerts={rows} targets={targets} selectedAlert={selectedId} onSelectAlert={setSelectedId} />
          </div>
        </div>

        <div className="dashboard-panel alert-detail-panel">
          <div className="panel-section-header">
            <h3 className="section-title">CHI TIẾT CẢNH BÁO</h3>
            {selected && <span className={`status-pill ${selected.severity === "red" ? "red" : "yellow"}`}>{SEVERITY_LABEL[selected.severity]}</span>}
          </div>

          {!selected ? (
            <div className="chart-empty-state">Chọn một cảnh báo để xem chi tiết</div>
          ) : (
            <>
              <div className="detail-headline-card">
                <ShieldAlert size={24} className={selected.severity === "red" ? "ic-red" : "ic-yellow"} />
                <div className="headline-text">
                  <h4 className="title">{CLASS_LABEL[selected.class] || selected.class} cách {selected.distance_m}m</h4>
                  <span className="id-code">ID: AL_{selected.id}</span>
                </div>
              </div>

              <div className="detail-kv-list">
                <div className="kv-row">
                  <span className="lbl">Mức độ:</span>
                  <strong className={`val ${selected.severity === "red" ? "text-red" : "text-yellow"}`}>{SEVERITY_LABEL[selected.severity]}</strong>
                </div>
                <div className="kv-row">
                  <span className="lbl">Loại đối tượng:</span>
                  <span className="val">{CLASS_LABEL[selected.class] || selected.class}</span>
                </div>
                <div className="kv-row">
                  <span className="lbl">UAV:</span>
                  <span className="val">{selectedUav ? selectedUav.name : `UAV#${selected.uav_id}`}</span>
                </div>
                <div className="kv-row">
                  <span className="lbl">Khoảng cách:</span>
                  <span className="val font-mono">{selected.distance_m} m</span>
                </div>
                <div className="kv-row">
                  <span className="lbl">Thời gian:</span>
                  <span className="val font-mono">{fmtTime(selected.timestamp)}</span>
                </div>
              </div>

              <div className="action-buttons-group">
                <span className="section-label">ẢNH SNAPSHOT</span>
                <a href={`${API_BASE}/api/logs/${selected.id}/snapshot`} target="_blank" rel="noreferrer">
                  <img src={`${API_BASE}/api/logs/${selected.id}/snapshot`} alt="snapshot" style={{ width: "100%", borderRadius: 6, marginTop: 6 }} />
                </a>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Row Grid */}
      <div className="alerts-bottom-4col">
        <AlertsTimeChart buckets={bucketByHour(rows)} />

        <div className="dashboard-panel btm-donut-card">
          <div className="panel-section-header">
            <h3 className="section-title">THỐNG KÊ CẢNH BÁO THEO LOẠI</h3>
          </div>
          <DonutChart segments={Object.entries(byClass).map(([cls, count]) => ({
            label: CLASS_LABEL[cls] || cls,
            value: count,
            color: CLASS_COLOR[cls] || "#94a3b8",
          }))} size={90} />
        </div>

        <div className="dashboard-panel btm-top-uav-card">
          <div className="panel-section-header">
            <h3 className="section-title">TOP UAV CÓ NHIỀU CẢNH BÁO</h3>
          </div>
          <div className="top-uav-bars-list">
            {uavBars.length === 0 && <div className="chart-empty-state">Chưa có dữ liệu</div>}
            {uavBars.map((u) => (
              <div key={u.uavId} className="uav-bar-item">
                <span className="name font-mono">{u.name}</span>
                <div className="bar-track"><div className="bar-fill red" style={{ width: `${(u.count / maxUavCount) * 100}%` }} /></div>
                <span className="val font-mono">{u.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-panel btm-recent-card">
          <div className="panel-section-header">
            <h3 className="section-title">CẢNH BÁO GẦN ĐÂY</h3>
          </div>
          <div className="recent-alerts-stream">
            {recent.length === 0 && <div className="chart-empty-state">Chưa có cảnh báo</div>}
            {recent.map((a) => (
              <div key={a.id} className="stream-row" onClick={() => setSelectedId(a.id)}>
                <AlertTriangle size={14} className={a.severity === "red" ? "ic-red" : "ic-yellow"} />
                <span className="time font-mono">{fmtTime(a.timestamp).split(" ")[0]}</span>
                <span className="title">{CLASS_LABEL[a.class] || a.class} · {a.distance_m}m</span>
                <span className={`badge ${a.severity === "red" ? "red" : "yellow"}`}>{SEVERITY_LABEL[a.severity]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
