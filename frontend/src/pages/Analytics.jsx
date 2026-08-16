import { useEffect, useState } from "react";
import {
  Clock,
  Navigation,
  CheckCircle,
  AlertTriangle,
  Target,
  Activity,
} from "lucide-react";
import FlightHoursChart from "../components/FlightHoursChart";
import UavRadarChart from "../components/UavRadarChart";
import BatteryConsumptionChart from "../components/BatteryConsumptionChart";
import DonutChart from "../components/DonutChart";
import { getAnalyticsStats, listMissions } from "../api";

const CLASS_LABEL = { person: "Người", car: "Ô tô", motorcycle: "Xe máy", bus: "Xe buýt", truck: "Xe tải" };
const CLASS_COLOR = { person: "#22c55e", car: "#3b82f6", motorcycle: "#f59e0b", bus: "#a855f7", truck: "#ef4444" };
const PRIORITY_LABEL = { high: "Cao", medium: "Trung bình", low: "Thấp" };
const PRIORITY_COLOR = { high: "#ef4444", medium: "#f59e0b", low: "#3b82f6" };

function fmtHours(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function Analytics() {
  const [timeFilter, setTimeFilter] = useState("30");
  const [stats, setStats] = useState(null);
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getAnalyticsStats(Number(timeFilter)), listMissions()]).then(([s, m]) => {
      if (cancelled) return;
      setStats(s);
      setMissions(Array.isArray(m) ? m : []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [timeFilter]);

  if (loading || !stats) {
    return <div className="analytics-page-v2"><div className="chart-empty-state">Đang tải dữ liệu…</div></div>;
  }

  const perUav = stats.per_uav || [];
  const priorityCounts = missions.reduce((acc, m) => {
    acc[m.priority] = (acc[m.priority] || 0) + 1;
    return acc;
  }, {});
  const otherMissions = stats.missions_total - stats.missions_completed - stats.missions_active;

  return (
    <div className="analytics-page-v2">
      {/* Top KPI Summary Cards */}
      <div className="analytics-top-6-kpi">
        <div className="kpi-card-v2">
          <div className="kpi-ic-box icon-blue"><Clock size={18} /></div>
          <div className="kpi-info">
            <span className="lbl">GIỜ BAY KẾ HOẠCH ({timeFilter} NGÀY)</span>
            <span className="val">{fmtHours(stats.flight_seconds_planned_total)}</span>
          </div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-ic-box icon-green"><CheckCircle size={18} /></div>
          <div className="kpi-info">
            <span className="lbl">NHIỆM VỤ HOÀN THÀNH</span>
            <span className="val">{stats.missions_completed} / {stats.missions_total}</span>
          </div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-ic-box icon-blue"><Activity size={18} /></div>
          <div className="kpi-info">
            <span className="lbl">ĐANG HOẠT ĐỘNG</span>
            <span className="val">{stats.missions_active}</span>
          </div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-ic-box icon-green"><Navigation size={18} /></div>
          <div className="kpi-info">
            <span className="lbl">TỶ LỆ THÀNH CÔNG</span>
            <span className="val">{stats.success_rate}%</span>
          </div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-ic-box icon-red"><AlertTriangle size={18} /></div>
          <div className="kpi-info">
            <span className="lbl">SỰ CỐ / CẢNH BÁO</span>
            <span className="val text-red">{stats.alerts_total}</span>
          </div>
        </div>

        <div className="kpi-card-v2">
          <div className="kpi-ic-box icon-yellow"><Target size={18} /></div>
          <div className="kpi-info">
            <span className="lbl">MỤC TIÊU PHÁT HIỆN</span>
            <span className="val">{stats.targets_total}</span>
          </div>
        </div>
      </div>

      {/* Row 1: Flight Hours + Allocation Donut + Radar */}
      <div className="analytics-row-3col-v2">
        <div className="dashboard-panel flight-hours-panel">
          <div className="panel-section-header">
            <h3 className="section-title">THỐNG KÊ GIỜ BAY THEO UAV</h3>
            <div className="header-filters-row">
              <button className={`filter-btn ${timeFilter === "7" ? "active" : ""}`} onClick={() => setTimeFilter("7")}>7 ngày</button>
              <button className={`filter-btn ${timeFilter === "30" ? "active" : ""}`} onClick={() => setTimeFilter("30")}>30 ngày</button>
              <button className={`filter-btn ${timeFilter === "90" ? "active" : ""}`} onClick={() => setTimeFilter("90")}>90 ngày</button>
            </div>
          </div>
          <div className="chart-canvas-container">
            <FlightHoursChart perUav={perUav} />
          </div>
        </div>

        <div className="dashboard-panel alloc-donut-panel">
          <div className="panel-section-header">
            <h3 className="section-title">PHÂN BỔ GIỜ BAY THEO UAV</h3>
          </div>
          <DonutChart segments={perUav.map((u, i) => ({
            label: u.name,
            value: Math.round(u.flight_seconds_planned / 60),
            color: ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#06b6d4", "#ef4444"][i % 6],
          }))} />
        </div>

        <div className="dashboard-panel radar-panel">
          <div className="panel-section-header">
            <h3 className="section-title">HIỆU SUẤT UAV</h3>
          </div>
          <div className="radar-canvas-box">
            <UavRadarChart perUav={perUav} />
          </div>
        </div>
      </div>

      {/* Row 2: Mission breakdown + Battery + Alert severity */}
      <div className="analytics-row-3col-v2">
        <div className="dashboard-panel task-breakdown-panel-v2">
          <div className="task-breakdown-body-v2">
            <div className="task-half-left">
              <h3 className="section-title">TRẠNG THÁI NHIỆM VỤ</h3>
              <DonutChart segments={[
                { label: "Hoàn thành", value: stats.missions_completed, color: "#22c55e" },
                { label: "Đang thực hiện", value: stats.missions_active, color: "#3b82f6" },
                { label: "Khác (tạm dừng/huỷ/thất bại)", value: Math.max(0, otherMissions), color: "#94a3b8" },
              ]} size={105} />
            </div>

            <div className="task-half-right">
              <h3 className="section-title">NHIỆM VỤ THEO ƯU TIÊN</h3>
              <div className="task-types-progress-list">
                {Object.entries(PRIORITY_LABEL).map(([key, label]) => {
                  const count = priorityCounts[key] || 0;
                  const pct = missions.length ? Math.round((count / missions.length) * 1000) / 10 : 0;
                  return (
                    <div key={key} className="type-progress-item">
                      <div className="type-meta-row">
                        <span className="name">{label}</span>
                        <span className="val">{count} ({pct}%)</span>
                      </div>
                      <div className="type-bar-track">
                        <div className="type-bar-fill" style={{ width: `${pct}%`, background: PRIORITY_COLOR[key] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-panel battery-chart-panel">
          <div className="panel-section-header">
            <h3 className="section-title">PIN HIỆN TẠI THEO UAV</h3>
          </div>
          <div className="battery-chart-box">
            <BatteryConsumptionChart perUav={perUav} />
          </div>
        </div>

        <div className="dashboard-panel incident-stats-panel-v2">
          <div className="panel-section-header">
            <h3 className="section-title">CẢNH BÁO THEO MỨC ĐỘ</h3>
          </div>
          <DonutChart segments={[
            { label: "Nguy hiểm", value: stats.alerts_by_severity.red || 0, color: "#ef4444" },
            { label: "Cảnh báo nhẹ", value: stats.alerts_by_severity.yellow || 0, color: "#f59e0b" },
          ]} size={105} />
        </div>
      </div>

      {/* Row 3: UAV performance table + targets by class */}
      <div className="analytics-row-3col-v2">
        <div className="dashboard-panel perf-table-panel" style={{ gridColumn: "span 2" }}>
          <div className="panel-section-header">
            <h3 className="section-title">HIỆU SUẤT UAV</h3>
          </div>
          <div className="perf-table-wrapper">
            <table className="perf-table">
              <thead>
                <tr>
                  <th>UAV</th>
                  <th>GIỜ BAY KH</th>
                  <th>NHIỆM VỤ</th>
                  <th>TỶ LỆ THÀNH CÔNG</th>
                  <th>CẢNH BÁO</th>
                  <th>PIN HIỆN TẠI</th>
                </tr>
              </thead>
              <tbody>
                {perUav.map((u) => (
                  <tr key={u.uav_id}>
                    <td className="font-mono font-bold">{u.name}</td>
                    <td>{fmtHours(u.flight_seconds_planned)}</td>
                    <td>{u.missions_completed} / {u.missions_total}</td>
                    <td>
                      <div className="rate-bar-flex">
                        <span>{u.success_rate}%</span>
                        <div className="bar-track"><div className="bar-fill green" style={{ width: `${u.success_rate}%` }} /></div>
                      </div>
                    </td>
                    <td className={u.alerts_count > 0 ? "text-red font-bold" : "text-green font-bold"}>{u.alerts_count}</td>
                    <td>{u.battery_pct_now}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard-panel task-breakdown-panel-v2">
          <div className="panel-section-header">
            <h3 className="section-title">MỤC TIÊU THEO LOẠI</h3>
          </div>
          <div className="task-types-progress-list" style={{ padding: "8px 12px" }}>
            {Object.entries(stats.targets_by_class).length === 0 && (
              <div className="chart-empty-state">Chưa có mục tiêu nào</div>
            )}
            {Object.entries(stats.targets_by_class).map(([cls, count]) => {
              const pct = stats.targets_total ? Math.round((count / stats.targets_total) * 1000) / 10 : 0;
              return (
                <div key={cls} className="type-progress-item">
                  <div className="type-meta-row">
                    <span className="name">{CLASS_LABEL[cls] || cls}</span>
                    <span className="val">{count} ({pct}%)</span>
                  </div>
                  <div className="type-bar-track">
                    <div className="type-bar-fill" style={{ width: `${pct}%`, background: CLASS_COLOR[cls] || "#94a3b8" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
