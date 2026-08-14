import { useState, useEffect } from "react";
import {
  LayoutGrid,
  Plane,
  ClipboardList,
  Target,
  Video,
  Map,
  Clock,
  Bell,
  Settings,
  Menu,
  Wifi,
  Crosshair,
  Battery,
  User,
  ChevronsLeft,
  ChevronsRight,
  BarChart2,
  TrendingUp,
} from "lucide-react";
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
  { key: "overview", label: "Tổng quan", Icon: LayoutGrid },
  { key: "uavs", label: "UAV", Icon: Plane },
  { key: "missions", label: "Nhiệm vụ", Icon: ClipboardList },
  { key: "tracking", label: "Mục tiêu", Icon: Target },
  { key: "live", label: "Giám sát trực tiếp", Icon: Video },
  { key: "map", label: "Bản đồ", Icon: Map },
  { key: "history", label: "Lịch sử bay", Icon: Clock },
  { key: "logs", label: "Cảnh báo", Icon: Bell, badge: 3 },
  { key: "settings", label: "Cài đặt", Icon: Settings },
];

export default function App() {
  const [tab, setTab] = useState("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const { connected, payload } = useDetectionSocket();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
      setCurrentTime(`${timeStr} ${dateStr}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`app ${collapsed ? "sidebar-collapsed" : ""}`}>
      {/* LEFT NAVIGATION SIDEBAR */}
      <aside className="sidebar">
        <div className="brand-header">
          <div className="brand-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <circle cx="12" cy="11" r="3" fill="#4ade80" fillOpacity="0.3" />
              <path d="m9 11 2 2 4-4" />
            </svg>
          </div>
          {!collapsed && (
            <div className="brand-titles">
              <h1 className="brand-main">UAV CONTROL</h1>
            </div>
          )}
        </div>

        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab-item ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
              title={collapsed ? t.label : undefined}
            >
              <span className="tab-icon">
                <t.Icon size={18} />
              </span>
              {!collapsed && <span className="tab-label">{t.label}</span>}
              {!collapsed && t.badge && <span className="tab-badge red">{t.badge}</span>}
              {collapsed && t.badge && <span className="tab-badge-dot red" />}
            </button>
          ))}
        </nav>

        <button className="sidebar-toggle-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          {!collapsed && <span>Thu gọn</span>}
        </button>
      </aside>

      {/* MAIN LAYOUT WRAPPER */}
      <div className="main-wrapper">
        {/* TOP HEADER BAR */}
        <header className="top-header">
          <div className="header-left-group">
            <button className="menu-toggle-icon" onClick={() => setCollapsed(!collapsed)} title="Toggle menu">
              <Menu size={18} />
            </button>
            <div className="header-page-title">
              <span className="title-text">THEO DÕI MỤC TIÊU</span>
              <span className="live-status-pill">
                <span className="status-dot green" />
                TRỰC TUYẾN
              </span>
            </div>
          </div>

          <div className="header-right-telemetry">
            <div className="telemetry-item signal">
              <Wifi size={15} className="green-text" />
              <span>Kết nối UAV</span>
              <strong className="green-text">Strong</strong>
            </div>

            <div className="telemetry-item gps">
              <Crosshair size={15} color="#4ade80" />
              <span>GPS</span>
              <strong>{payload?.uav_status?.gps?.satellites ?? 12}</strong>
            </div>

            <div className="telemetry-item battery">
              <Battery size={15} color="#4ade80" />
              <span>Pin</span>
              <strong className="green-text">{payload?.uav_status?.battery ?? 78}%</strong>
            </div>

            <div className="telemetry-item clock">
              <span>{currentTime || "18:42:10 13/05/2024"}</span>
            </div>

            <div className="user-profile-badge">
              <div className="avatar-circle">
                <User size={16} color="#e2e8f0" />
              </div>
              <div className="user-details">
                <span className="username">admin</span>
                <span className="user-role">Quản trị viên</span>
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT VIEW AREA */}
        <main className="content">
          {tab === "overview" && <Overview payload={payload} onNavigateTab={setTab} />}
          {tab === "uavs" && <UAVList activeUavId={payload?.active_uav_id} payload={payload} onOpenAlerts={() => setTab("logs")} />}
          {tab === "missions" && <Missions payload={payload} />}
          {tab === "tracking" && <Targets payload={payload} />}
          {tab === "live" && <LiveMonitoring payload={payload} />}
          {tab === "map" && <MapView payload={payload} />}
          {tab === "history" && <Analytics payload={payload} />}
          {tab === "logs" && <AlertsView onOpenMap={() => setTab("map")} />}
          {tab === "settings" && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}
