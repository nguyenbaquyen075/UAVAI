import { useEffect, useState } from "react";
import {
  FileText,
  Crosshair,
  Wifi,
  Battery,
  User,
  Calendar,
  ClipboardList,
  Clock,
  Target,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Download,
  Siren,
} from "lucide-react";
import { getAnalyticsStats, listMissions } from "../api";
import MissionDayChart from "../components/MissionDayChart";
import DistanceChart from "../components/DistanceChart";
import DonutChart from "../components/DonutChart";

const PRIORITY_LABEL = { high: "Cao", medium: "Trung bình", low: "Thấp" };
const PRIORITY_COLOR = { high: "#ef4444", medium: "#facc15", low: "#3b82f6" };

function fmtHours(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}
function dayLabel(d) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function ReportsView() {
  const [currentTime, setCurrentTime] = useState("");
  const [days, setDays] = useState(13);
  const [stats, setStats] = useState(null);
  const [missions, setMissions] = useState([]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const t = now.toTimeString().slice(0, 8);
      const d = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
      setCurrentTime(`${t} ${d}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    async function load() {
      const [analytics, missionList] = await Promise.all([getAnalyticsStats(days), listMissions()]);
      setStats(analytics);
      setMissions(Array.isArray(missionList) ? missionList : []);
    }
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [days]);

  const rangeStart = Date.now() - days * 86_400_000;

  // Bucket THẬT theo ngày, từ dữ liệu missions/targets đã fetch (không có endpoint riêng cho việc này)
  const dayBuckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    dayBuckets.push({ date: d, label: dayLabel(d) });
  }
  const missionDays = dayBuckets.map((b) => {
    const key = b.date.toDateString();
    const dayMissions = missions.filter((m) => new Date(m.started_at).toDateString() === key);
    return {
      label: b.label,
      completed: dayMissions.filter((m) => m.status === "completed").length,
      other: dayMissions.filter((m) => m.status !== "completed").length,
    };
  });
  const perUav = stats?.per_uav ?? [];
  const missionsInRange = missions.filter((m) => new Date(m.started_at).getTime() >= rangeStart);
  const priorityCounts = { high: 0, medium: 0, low: 0 };
  missionsInRange.forEach((m) => { priorityCounts[m.priority] = (priorityCounts[m.priority] ?? 0) + 1; });
  const prioritySegments = Object.entries(priorityCounts).filter(([, v]) => v > 0).map(([p, v]) => ({ label: PRIORITY_LABEL[p] ?? p, value: v, color: PRIORITY_COLOR[p] }));

  const severitySegments = [
    { label: "Nguy hiểm", value: stats?.alerts_by_severity?.red ?? 0, color: "#ef4444" },
    { label: "Cảnh báo", value: stats?.alerts_by_severity?.yellow ?? 0, color: "#facc15" },
  ];
  const targetClassEntries = Object.entries(stats?.targets_by_class ?? {});

  // "Báo cáo" = tổng hợp thật từ nhiệm vụ đã hoàn thành — không có PDF generator nên "Tải PDF" bị vô hiệu hoá
  const completedMissions = missionsInRange.filter((m) => m.status === "completed").sort((a, b) => (a.expected_end_at < b.expected_end_at ? 1 : -1));

  return (
    <div className="reports-page-layout">

      <div className="reports-filter-bar">
        <div className="filter-group">
          <label>Khoảng thời gian</label>
          <div className="date-range-btn"><Calendar size={14} /> {days} ngày gần đây</div>
        </div>
        <select className="filter-select" value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>7 ngày</option>
          <option value={13}>13 ngày</option>
          <option value={30}>30 ngày</option>
        </select>
      </div>

      {/* Row 1: 6 KPI Cards — số thật/tính toán */}
      <div className="reports-kpi-grid">
        <div className="rpt-kpi-card">
          <div className="rpt-kpi-icon blue"><ClipboardList size={20} /></div>
          <div className="rpt-kpi-body"><span className="rpt-kpi-label">TỔNG SỐ NHIỆM VỤ</span><div className="rpt-kpi-val">{stats?.missions_total ?? "-"}</div></div>
        </div>
        <div className="rpt-kpi-card">
          <div className="rpt-kpi-icon cyan"><Clock size={20} /></div>
          <div className="rpt-kpi-body"><span className="rpt-kpi-label">GIỜ BAY (KẾ HOẠCH)</span><div className="rpt-kpi-val" style={{ fontSize: "18px" }}>{stats ? fmtHours(stats.flight_seconds_planned_total) : "-"}</div></div>
        </div>
        <div className="rpt-kpi-card">
          <div className="rpt-kpi-icon orange"><Target size={20} /></div>
          <div className="rpt-kpi-body"><span className="rpt-kpi-label">TỔNG MỤC TIÊU PHÁT HIỆN</span><div className="rpt-kpi-val">{stats?.targets_total ?? "-"}</div></div>
        </div>
        <div className="rpt-kpi-card">
          <div className="rpt-kpi-icon check"><CheckCircle2 size={20} color="#4ade80" /></div>
          <div className="rpt-kpi-body"><span className="rpt-kpi-label">TỶ LỆ HOÀN THÀNH</span><div className="rpt-kpi-val green-val">{stats?.success_rate ?? "-"}%</div></div>
        </div>
        <div className="rpt-kpi-card">
          <div className="rpt-kpi-icon red"><AlertTriangle size={20} color="#f87171" /></div>
          <div className="rpt-kpi-body"><span className="rpt-kpi-label">CẢNH BÁO</span><div className="rpt-kpi-val red-val">{stats?.alerts_total ?? "-"}</div></div>
        </div>
        <div className="rpt-kpi-card">
          <div className="rpt-kpi-icon red"><Siren size={20} color="#f87171" /></div>
          <div className="rpt-kpi-body"><span className="rpt-kpi-label">CẢNH BÁO MỨC NGUY HIỂM</span><div className="rpt-kpi-val red-val">{stats?.alerts_by_severity?.red ?? 0}</div></div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="reports-mid-grid">
        <MissionDayChart days={missionDays} />

        <div className="report-chart-card">
          <div className="card-header-row"><span className="card-title">NHIỆM VỤ THEO MỨC ƯU TIÊN</span></div>
          {prioritySegments.length === 0 ? <p className="muted">Chưa có nhiệm vụ trong khoảng thời gian này.</p> : <DonutChart segments={prioritySegments} size={120} />}
        </div>

        <div className="report-chart-card uav-perf-card">
          <div className="card-header-row"><span className="card-title">TỔNG HỢP THEO UAV</span></div>
          <table className="rpt-table">
            <thead><tr><th>UAV</th><th>Giờ bay (KH)</th><th>Nhiệm vụ</th><th>Tỷ lệ HT</th></tr></thead>
            <tbody>
              {perUav.map((u) => (
                <tr key={u.uav_id}>
                  <td><strong style={{ fontSize: "11px" }}>{u.name}</strong></td>
                  <td className="font-mono">{fmtHours(u.flight_seconds_planned)}</td>
                  <td>{u.missions_completed} / {u.missions_total}</td>
                  <td><span className={`rate-badge ${u.success_rate >= 80 ? "green" : "yellow"}`}>{u.success_rate}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Row 3 */}
      <div className="reports-bot-grid">
        <DistanceChart dayLabels={dayBuckets.map((b) => b.label)} />

        <div className="report-chart-card">
          <div className="card-header-row"><span className="card-title">MỤC TIÊU THEO LOẠI</span></div>
          <div className="target-stats-list">
            {targetClassEntries.length === 0 && <p className="muted">Chưa có dữ liệu.</p>}
            {targetClassEntries.map(([cls, n]) => (
              <div key={cls} className="tgt-stat-row">
                <span className="tgt-icon"><BarChart3 size={16} /></span>
                <span className="tgt-label">{cls}</span>
                <strong className="tgt-count">{n}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="report-chart-card">
          <div className="card-header-row"><span className="card-title">CẢNH BÁO THEO MỨC ĐỘ</span></div>
          {severitySegments.every((s) => s.value === 0) ? <p className="muted">Chưa có cảnh báo.</p> : <DonutChart segments={severitySegments} size={120} />}
        </div>

        <div className="report-chart-card recent-rpts-card">
          <div className="card-header-row"><span className="card-title">NHIỆM VỤ HOÀN THÀNH GẦN NHẤT</span></div>
          <div className="recent-rpt-list">
            {completedMissions.slice(0, 5).map((m) => (
              <div key={m.id} className="recent-rpt-item">
                <div className="rpt-file-icon"><FileText size={16} /></div>
                <div className="rpt-info"><strong>{m.name}</strong><span className="rpt-sub">{PRIORITY_LABEL[m.priority] ?? m.priority}</span></div>
                <span className="rpt-date font-mono">{new Date(m.expected_end_at).toLocaleDateString("vi-VN")}</span>
              </div>
            ))}
            {completedMissions.length === 0 && <p className="muted">Chưa có nhiệm vụ hoàn thành.</p>}
          </div>
        </div>
      </div>

      {/* Row 4: Danh sách "báo cáo" — tổng hợp thật từ nhiệm vụ đã hoàn thành, chưa có PDF generator */}
      <div className="report-list-card">
        <div className="card-header-row">
          <span className="card-title">DANH SÁCH BÁO CÁO NHIỆM VỤ</span>
          <span className="muted" style={{ fontSize: "11px" }}>Xem dữ liệu thật trực tuyến — chưa hỗ trợ xuất PDF</span>
        </div>
        <div className="rpt-table-wrapper">
          <table className="rpt-table full">
            <thead>
              <tr><th>#</th><th>Tên nhiệm vụ</th><th>Ưu tiên</th><th>Waypoints</th><th>Bắt đầu</th><th>Kết thúc</th><th>Thao tác</th></tr>
            </thead>
            <tbody>
              {completedMissions.map((m) => (
                <tr key={m.id}>
                  <td className="font-mono">{m.id}</td>
                  <td><strong style={{ color: "#f8fafc" }}>{m.name}</strong></td>
                  <td><span className="type-pill">{PRIORITY_LABEL[m.priority] ?? m.priority}</span></td>
                  <td>{m.waypoints_reached} / {m.waypoints?.length ?? 0}</td>
                  <td className="font-mono" style={{ fontSize: "10px" }}>{new Date(m.started_at).toLocaleString("vi-VN")}</td>
                  <td className="font-mono" style={{ fontSize: "10px" }}>{new Date(m.expected_end_at).toLocaleString("vi-VN")}</td>
                  <td>
                    <div className="rpt-actions">
                      <button className="icon-action-btn" disabled title="Chưa hỗ trợ xuất PDF"><Download size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {completedMissions.length === 0 && <tr><td colSpan={7} className="muted" style={{ padding: "12px" }}>Chưa có nhiệm vụ hoàn thành trong khoảng thời gian này.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
