import { useEffect, useState } from "react";
import {
  BarChart3,
  Crosshair,
  Wifi,
  Battery,
  User,
  Clock,
  Target,
  CheckCircle2,
  AlertTriangle,
  Siren,
  ArrowUpDown,
} from "lucide-react";
import { getAnalyticsStats, getLogs } from "../api";
import FlightHoursChart from "../components/FlightHoursChart";
import UavRadarChart from "../components/UavRadarChart";
import BatteryConsumptionChart from "../components/BatteryConsumptionChart";
import DonutChart from "../components/DonutChart";

function fmtHours(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

const PRIORITY_LABEL = { high: "Cao", medium: "Trung bình", low: "Thấp" };
const SEVERITY_LABEL_VI = { red: "Nguy hiểm", yellow: "Cảnh báo" };

export default function Analytics({ payload }) {
  const [currentTime, setCurrentTime] = useState("");
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);

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
      const [analytics, logs] = await Promise.all([getAnalyticsStats(days), getLogs()]);
      setStats(analytics);
      setRecentAlerts(Array.isArray(logs) ? logs.slice(0, 5) : []);
    }
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [days]);

  const perUav = stats?.per_uav ?? [];
  const alertRed = stats?.alerts_by_severity?.red ?? 0;
  const alertYellow = stats?.alerts_by_severity?.yellow ?? 0;

  const flightAllocSegments = perUav
    .filter((u) => u.flight_seconds_planned > 0)
    .map((u, i) => ({ label: u.name, value: Math.round(u.flight_seconds_planned / 60), color: ["#22c55e", "#3b82f6", "#a855f7", "#f97316", "#06b6d4", "#ef4444"][i % 6] }));

  const missionsByClass = {};
  perUav.forEach((u) => { missionsByClass[u.name] = u.missions_total; });

  const severitySegments = [
    { label: "Nguy hiểm", value: alertRed, color: "#ef4444" },
    { label: "Cảnh báo", value: alertYellow, color: "#facc15" },
  ];

  const targetClassEntries = Object.entries(stats?.targets_by_class ?? {});
  const targetClassColors = { person: "#f87171", car: "#60a5fa", motorcycle: "#facc15", bus: "#a855f7", truck: "#4ade80" };
  const targetClassSegments = targetClassEntries.map(([cls, n]) => ({ label: cls, value: n, color: targetClassColors[cls] ?? "#9aa2b1" }));

  return (
    <div className="analytics-page-layout">
      <div className="live-sub-header">
        <div className="header-left">
          <div className="uav-selector-wrapper">
            <BarChart3 size={18} color="#4ade80" />
            <span className="sub-title-label">PHÂN TÍCH</span>
            <span className="dot-divider">/</span>
            <span className="breadcrumb-sub">Trang chủ &gt; Phân tích</span>
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

      <div className="notes-top-bar" style={{ marginBottom: "10px" }}>
        <span className="muted" style={{ fontSize: "12px" }}>Khoảng thời gian tính cảnh báo/mục tiêu:</span>
        <select className="filter-select" value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>7 ngày</option>
          <option value={30}>30 ngày</option>
          <option value={90}>90 ngày</option>
        </select>
      </div>

      {/* Row 1: 6 KPI Cards — số thật/tính toán từ backend, không có so sánh tuần trước (không lưu lịch sử) */}
      <div className="analytics-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon blue"><Clock size={20} /></div>
          <div className="kpi-body">
            <span className="kpi-label">GIỜ BAY (KẾ HOẠCH)</span>
            <div className="kpi-val">{stats ? fmtHours(stats.flight_seconds_planned_total) : "-"}</div>
            <span className="kpi-trend">Tổng nhiệm vụ đã hoàn thành</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon purple"><Target size={20} /></div>
          <div className="kpi-body">
            <span className="kpi-label">MỤC TIÊU PHÁT HIỆN</span>
            <div className="kpi-val">{stats?.targets_total ?? "-"}</div>
            <span className="kpi-trend">Tổng số mục tiêu đã ghi nhận</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon green"><CheckCircle2 size={20} color="#4ade80" /></div>
          <div className="kpi-body">
            <span className="kpi-label">NHIỆM VỤ HOÀN THÀNH</span>
            <div className="kpi-val">{stats?.missions_completed ?? "-"} <span className="unit">/ {stats?.missions_total ?? "-"}</span></div>
            <span className="kpi-trend">{stats?.missions_active ?? 0} đang chạy</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon cyan"><BarChart3 size={20} /></div>
          <div className="kpi-body">
            <span className="kpi-label">TỶ LỆ THÀNH CÔNG</span>
            <div className="kpi-val">{stats?.success_rate ?? "-"}%</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon red"><AlertTriangle size={20} color="#f87171" /></div>
          <div className="kpi-body">
            <span className="kpi-label">CẢNH BÁO ({days}N)</span>
            <div className="kpi-val">{stats?.alerts_total ?? "-"}</div>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon red"><Siren size={20} color="#f87171" /></div>
          <div className="kpi-body">
            <span className="kpi-label">CẢNH BÁO MỨC NGUY HIỂM</span>
            <div className="kpi-val">{alertRed}</div>
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="analytics-row-3col">
        <FlightHoursChart perUav={perUav} />

        <div className="allocation-card">
          <div className="card-header-row"><span className="card-title">PHÂN BỔ GIỜ BAY THEO UAV (PHÚT)</span></div>
          {flightAllocSegments.length === 0 ? (
            <p className="muted">Chưa có nhiệm vụ hoàn thành nào.</p>
          ) : (
            <DonutChart segments={flightAllocSegments} />
          )}
        </div>

        <UavRadarChart perUav={perUav} />
      </div>

      {/* Row 3 */}
      <div className="analytics-row-3col">
        <div className="breakdown-card">
          <div className="card-header-row"><span className="card-title">MỤC TIÊU THEO LOẠI</span></div>
          {targetClassSegments.length === 0 ? (
            <p className="muted">Chưa có mục tiêu nào được ghi nhận.</p>
          ) : (
            <DonutChart segments={targetClassSegments} size={120} />
          )}
        </div>

        <BatteryConsumptionChart perUav={perUav} />

        <div className="incidents-card">
          <div className="card-header-row"><span className="card-title">CẢNH BÁO THEO MỨC ĐỘ ({days}N)</span></div>
          {alertRed + alertYellow === 0 ? (
            <p className="muted">Chưa có cảnh báo trong khoảng thời gian này.</p>
          ) : (
            <DonutChart segments={severitySegments} size={120} />
          )}
        </div>
      </div>

      {/* Row 4: Bảng hiệu suất + tóm tắt */}
      <div className="analytics-row-bottom">
        <div className="perf-table-card">
          <div className="card-header-row"><span className="card-title">HIỆU SUẤT UAV</span></div>
          <table>
            <thead>
              <tr>
                <th>UAV</th><th>Giờ bay (KH)</th><th>Nhiệm vụ</th><th>Tỷ lệ thành công</th><th>Pin hiện tại</th><th>Cảnh báo</th>
              </tr>
            </thead>
            <tbody>
              {perUav.map((row) => (
                <tr key={row.uav_id}>
                  <td><strong>{row.name}</strong></td>
                  <td>{fmtHours(row.flight_seconds_planned)}</td>
                  <td>{row.missions_completed} / {row.missions_total}</td>
                  <td>
                    <div className="rate-flex">
                      <span>{row.success_rate}%</span>
                      <div className="progress-bar">
                        <div className={`progress-fill ${row.success_rate >= 80 ? "green" : "yellow"}`} style={{ width: `${row.success_rate}%` }} />
                      </div>
                    </div>
                  </td>
                  <td>{row.battery_pct_now}%</td>
                  <td><span className={`badge ${row.alerts_count > 0 ? "red" : "grey"}`}>{row.alerts_count}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="trend-card">
          <div className="card-header-row"><span className="card-title">TÓM TẮT {days} NGÀY QUA</span></div>
          <div className="trend-rows">
            <div className="trend-row"><div className="trend-meta"><span className="lbl">Cảnh báo</span><strong className="val">{stats?.alerts_total ?? "-"}</strong></div></div>
            <div className="trend-row"><div className="trend-meta"><span className="lbl">Mục tiêu ghi nhận</span><strong className="val">{stats?.targets_total ?? "-"}</strong></div></div>
            <div className="trend-row"><div className="trend-meta"><span className="lbl">Nhiệm vụ hoàn thành</span><strong className="val">{stats?.missions_completed ?? "-"}</strong></div></div>
            <div className="trend-row"><div className="trend-meta"><span className="lbl">Tỷ lệ thành công</span><strong className="val">{stats?.success_rate ?? "-"}%</strong></div></div>
          </div>
        </div>

        <div className="recommendations-card">
          <div className="card-header-row"><span className="card-title">CẢNH BÁO GẦN ĐÂY</span></div>
          {recentAlerts.length === 0 && <p className="muted">Chưa có cảnh báo.</p>}
          <div className="recs-list">
            {recentAlerts.map((a) => (
              <div key={a.id} className="rec-item">
                <div className={`rec-icon ${a.severity === "red" ? "red" : "blue"}`}><ArrowUpDown size={16} /></div>
                <div className="rec-text">
                  <p className="main-desc">{a.class} · {a.distance_m}m · {SEVERITY_LABEL_VI[a.severity] ?? a.severity}</p>
                  <p className="sub-suggestion">{new Date(a.timestamp).toLocaleString("vi-VN")}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
