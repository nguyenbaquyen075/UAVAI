import { useEffect, useState } from "react";
import {
  ClipboardList,
  Clock,
  Target,
  CheckCircle2,
  AlertTriangle,
  Download,
  Car,
  User,
  Package,
} from "lucide-react";
import MissionDayChart from "../components/MissionDayChart";
import DonutChart from "../components/DonutChart";
import { getAnalyticsStats, listMissions, logsExportUrl } from "../api";

const PRIORITY_LABEL = { high: "Cao", medium: "Trung bình", low: "Thấp" };
const PRIORITY_COLOR = { high: "#ef4444", medium: "#f59e0b", low: "#3b82f6" };
const CLASS_LABEL = { person: "Người", car: "Ô tô", motorcycle: "Xe máy", bus: "Xe buýt", truck: "Xe tải" };
const CLASS_ICON = { person: User, car: Car, motorcycle: Car, bus: Car, truck: Package };
const STATUS_LABEL = { active: "Đang thực hiện", paused: "Tạm dừng", completed: "Hoàn thành", cancelled: "Đã huỷ", failed: "Thất bại" };
const PAGE_SIZE = 8;

function fmtHours(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function fmtDate(iso) {
  if (!iso) return "--";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function bucketMissionsByDay(missions, numDays) {
  const pad = (n) => String(n).padStart(2, "0");
  const now = new Date();
  const buckets = [];
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    buckets.push({ key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, day: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`, completed: 0, active: 0 });
  }
  const byKey = Object.fromEntries(buckets.map((b) => [b.key, b]));
  missions.forEach((m) => {
    const started = new Date(m.started_at);
    const key = `${started.getFullYear()}-${pad(started.getMonth() + 1)}-${pad(started.getDate())}`;
    const b = byKey[key];
    if (!b) return;
    if (m.status === "completed") b.completed += 1; else b.active += 1;
  });
  buckets.forEach((b) => { b.ratePct = b.completed + b.active ? Math.round((b.completed / (b.completed + b.active)) * 100) : 0; });
  return buckets;
}

export default function ReportsView() {
  const [stats, setStats] = useState(null);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([getAnalyticsStats(30), listMissions()]).then(([s, m]) => {
      setStats(s);
      setMissions(Array.isArray(m) ? m : []);
      setLoading(false);
    });
  }, []);

  if (loading || !stats) {
    return <div className="reports-page-layout-v2"><div className="chart-empty-state">Đang tải báo cáo…</div></div>;
  }

  const priorityCounts = missions.reduce((acc, m) => { acc[m.priority] = (acc[m.priority] || 0) + 1; return acc; }, {});
  const dayBuckets = bucketMissionsByDay(missions, 14);
  const recentCompleted = missions
    .filter((m) => m.status === "completed")
    .sort((a, b) => new Date(b.expected_end_at) - new Date(a.expected_end_at))
    .slice(0, 5);
  const totalPages = Math.max(1, Math.ceil(missions.length / PAGE_SIZE));
  const pageMissions = missions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="reports-page-layout-v2">
      <div className="reports-top-filter-bar">
        <div className="filters-left">
          <span className="lbl">Dữ liệu 30 ngày gần nhất — tính từ SQLite thật (nhiệm vụ/mục tiêu/cảnh báo)</span>
        </div>
        <div className="actions-right">
          <a className="btn-act dark-outline" href={logsExportUrl()} target="_blank" rel="noreferrer">
            <Download size={14} /> Xuất CSV cảnh báo
          </a>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="reports-top-6-kpi">
        <div className="kpi-card-v2">
          <div className="kpi-ic-box icon-purple"><ClipboardList size={18} /></div>
          <div className="kpi-info">
            <span className="lbl">Tổng số nhiệm vụ</span>
            <span className="val font-mono">{stats.missions_total}</span>
          </div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-ic-box icon-blue"><Clock size={18} /></div>
          <div className="kpi-info">
            <span className="lbl">Tổng giờ bay kế hoạch</span>
            <span className="val font-mono">{fmtHours(stats.flight_seconds_planned_total)}</span>
          </div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-ic-box icon-yellow"><Target size={18} /></div>
          <div className="kpi-info">
            <span className="lbl">Tổng mục tiêu phát hiện</span>
            <span className="val font-mono">{stats.targets_total}</span>
          </div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-ic-box icon-green"><CheckCircle2 size={18} /></div>
          <div className="kpi-info">
            <span className="lbl">Tỷ lệ hoàn thành nhiệm vụ</span>
            <span className="val text-green font-mono">{stats.success_rate}%</span>
          </div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-ic-box icon-red"><AlertTriangle size={18} /></div>
          <div className="kpi-info">
            <span className="lbl">Sự cố / cảnh báo</span>
            <span className="val text-red font-mono">{stats.alerts_total}</span>
          </div>
        </div>
      </div>

      {/* Middle Grid Row: 3 Cards */}
      <div className="reports-mid-3col">
        <MissionDayChart days={dayBuckets} />

        <div className="dashboard-panel donut-panel-1fr">
          <div className="panel-section-header">
            <h3 className="section-title">NHIỆM VỤ THEO ƯU TIÊN</h3>
          </div>
          <DonutChart segments={Object.entries(PRIORITY_LABEL).map(([key, label]) => ({
            label,
            value: priorityCounts[key] || 0,
            color: PRIORITY_COLOR[key],
          }))} />
        </div>

        <div className="dashboard-panel uav-summary-panel-1fr">
          <div className="panel-section-header">
            <h3 className="section-title">TỔNG HỢP THEO UAV</h3>
          </div>
          <table className="mini-table-uav">
            <thead>
              <tr>
                <th>UAV</th>
                <th>Giờ bay KH</th>
                <th>Nhiệm vụ</th>
                <th>Tỷ lệ HT</th>
              </tr>
            </thead>
            <tbody>
              {stats.per_uav.map((u) => (
                <tr key={u.uav_id}>
                  <td className="u-name">{u.name}</td>
                  <td className="font-mono">{fmtHours(u.flight_seconds_planned)}</td>
                  <td className="font-mono">{u.missions_total}</td>
                  <td className="text-green font-bold font-mono">{u.success_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lower Row: 2 Split Grid */}
      <div className="reports-lower-grid">
        <div className="left-sub-3cards">
          <div className="dashboard-panel target-sub-card">
            <div className="panel-section-header">
              <h3 className="section-title">THỐNG KÊ MỤC TIÊU PHÁT HIỆN</h3>
            </div>
            <div className="tgt-rows-list">
              {Object.entries(stats.targets_by_class).length === 0 && <div className="chart-empty-state">Chưa có mục tiêu nào</div>}
              {Object.entries(stats.targets_by_class).map(([cls, count]) => {
                const Icon = CLASS_ICON[cls] || Package;
                return (
                  <div key={cls} className="tgt-item">
                    <Icon size={14} className="ic-tgt" />
                    <span className="name">{CLASS_LABEL[cls] || cls}</span>
                    <span className="val font-mono">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="dashboard-panel incident-sub-card">
            <div className="panel-section-header">
              <h3 className="section-title">THỐNG KÊ CẢNH BÁO</h3>
            </div>
            <DonutChart segments={[
              { label: "Nguy hiểm", value: stats.alerts_by_severity.red || 0, color: "#ef4444" },
              { label: "Cảnh báo nhẹ", value: stats.alerts_by_severity.yellow || 0, color: "#f59e0b" },
            ]} size={140} />
          </div>
        </div>

        <div className="dashboard-panel recent-reports-panel">
          <div className="panel-section-header">
            <h3 className="section-title">NHIỆM VỤ HOÀN THÀNH GẦN NHẤT</h3>
          </div>
          <div className="recent-reports-stack">
            {recentCompleted.length === 0 && <div className="chart-empty-state">Chưa có nhiệm vụ hoàn thành</div>}
            {recentCompleted.map((m) => (
              <div key={m.id} className="recent-rpt-card">
                <ClipboardList size={20} className="ic-green" />
                <div className="rpt-details">
                  <h5 className="name">{m.name}</h5>
                  <span className="sub">{m.code || `NV_${m.id}`}</span>
                </div>
                <span className="date font-mono">{fmtDate(m.expected_end_at)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Data Table: DANH SÁCH NHIỆM VỤ */}
      <div className="dashboard-panel reports-table-panel">
        <div className="panel-section-header">
          <h3 className="section-title">DANH SÁCH NHIỆM VỤ</h3>
        </div>
        <div className="reports-table-wrapper">
          <table className="reports-data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>TÊN NHIỆM VỤ</th>
                <th>UAV</th>
                <th>ƯU TIÊN</th>
                <th>TRẠNG THÁI</th>
                <th>BẮT ĐẦU</th>
                <th>DỰ KIẾN KẾT THÚC</th>
              </tr>
            </thead>
            <tbody>
              {pageMissions.map((m) => {
                const uav = stats.per_uav.find((u) => u.uav_id === m.uav_id);
                return (
                  <tr key={m.id}>
                    <td className="font-mono text-muted">{m.id}</td>
                    <td className="font-bold text-white">{m.name}</td>
                    <td>{uav ? uav.name : m.uav_id}</td>
                    <td>{PRIORITY_LABEL[m.priority] || m.priority}</td>
                    <td>{STATUS_LABEL[m.status] || m.status}</td>
                    <td className="font-mono text-muted">{fmtDate(m.started_at)}</td>
                    <td className="font-mono text-muted">{fmtDate(m.expected_end_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="reports-pagination-bar">
            <span className="count-info">Hiển thị {(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, missions.length)} của {missions.length} nhiệm vụ</span>
            <div className="pages-flex">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>&lt;</button>
              <span className="page-btn active">{page} / {totalPages}</span>
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>&gt;</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
