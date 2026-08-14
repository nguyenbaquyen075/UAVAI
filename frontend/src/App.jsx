import { useState } from "react";
import { useDetectionSocket } from "./hooks/useDetectionSocket";
import Overview from "./pages/Overview";
import UAVList from "./pages/UAVList";
import Missions from "./pages/Missions";
import LiveMonitoring from "./pages/LiveMonitoring";
import Targets from "./pages/Targets";
import LogViewer from "./pages/LogViewer";
import SettingsPage from "./pages/Settings";
import MapView from "./pages/MapView";
import Analytics from "./pages/Analytics";
import NotesView from "./pages/NotesView";
import AlertsView from "./pages/AlertsView";
import ReportsView from "./pages/ReportsView";

const TABS = [
  { key: "overview", label: "Tổng quan", icon: "📊" },
  { key: "uavs", label: "UAV", icon: "🛸" },
  { key: "missions", label: "Nhiệm vụ", icon: "🚩" },
  { key: "tracking", label: "Mục tiêu", icon: "🎯" },
  { key: "live", label: "Theo dõi trực tiếp", icon: "📹", highlight: true },
  { key: "map", label: "Bản đồ", icon: "🗺️" },
  { key: "analytics", label: "Phân tích", icon: "⏱️" },
  { key: "notes", label: "Ghi chép", icon: "📋" },
  { key: "logs", label: "Cảnh báo", icon: "🔔", badge: 12 },
  { key: "reports", label: "Báo cáo", icon: "📈" },
  { key: "settings", label: "Cài đặt", icon: "⚙️" },
];

export default function App() {
  const [tab, setTab] = useState("logs"); // Open Alerts view by default
  const { connected, payload } = useDetectionSocket();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand-header">
          <div className="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <div className="brand-titles">
            <h1 className="brand-main">UAV CONTROL</h1>
            <span className="brand-sub">HỆ THỐNG QUẢN LÝ UAV</span>
          </div>
        </div>

        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab-item ${tab === t.key ? "active" : ""} ${t.highlight ? "highlight" : ""}`}
              onClick={() => setTab(t.key)}
            >
              <span className="tab-icon">{t.icon}</span>
              <span className="tab-label">{t.label}</span>
              {t.badge && <span className="tab-badge red">{t.badge}</span>}
            </button>
          ))}
        </nav>

        <div className={`status ${connected ? "ok" : "down"}`}>
          {connected
            ? `Đã kết nối · ${payload?.uav_status?.latency_ms ?? "12"} ms`
            : "Chế độ mô phỏng (Offline)"}
        </div>
      </aside>

      <main className="content">
        {tab === "overview" && <Overview payload={payload} />}
        {tab === "uavs" && <UAVList activeUavId={payload?.active_uav_id} payload={payload} />}
        {tab === "missions" && <Missions payload={payload} />}
        {tab === "tracking" && <Targets payload={payload} />}
        {tab === "live" && <LiveMonitoring payload={payload} />}
        {tab === "map" && <MapView payload={payload} />}
        {tab === "analytics" && <Analytics payload={payload} />}
        {tab === "notes" && <NotesView />}
        {tab === "logs" && <AlertsView />}
        {tab === "reports" && <ReportsView />}
        {tab === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}
