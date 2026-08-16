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
  Sun,
  CloudSun,
  Wind,
  Droplets,
  TrendingUp,
  FileText,
  BarChart2,
} from "lucide-react";
import { useDetectionSocket } from "./hooks/useDetectionSocket";
import Overview from "./pages/Overview";
import UAVList from "./pages/UAVList";
import Missions from "./pages/Missions";
import LiveMonitoring from "./pages/LiveMonitoring";
import Targets from "./pages/Targets";
import SettingsPage from "./pages/Settings";
import MapView from "./pages/MapView";
import Analytics from "./pages/Analytics";
import NotesView from "./pages/NotesView";
import AlertsView from "./pages/AlertsView";
import ReportsView from "./pages/ReportsView";
import ErrorBoundary from "./components/ErrorBoundary";

const TABS = [
  { key: "overview", label: "Tổng quan", Icon: LayoutGrid },
  { key: "uavs", label: "UAV", Icon: Plane },
  { key: "missions", label: "Nhiệm vụ", Icon: ClipboardList },
  { key: "tracking", label: "Mục tiêu", Icon: Target },
  { key: "live", label: "Theo dõi trực tiếp", Icon: Video },
  { key: "map", label: "Bản đồ", Icon: Map },
  { key: "analytics", label: "Phân tích", Icon: TrendingUp },
  { key: "notes", label: "Ghi chép", Icon: FileText },
  { key: "logs", label: "Cảnh báo", Icon: Bell, badge: 3 },
  { key: "reports", label: "Báo cáo", Icon: BarChart2 },
  { key: "settings", label: "Cài đặt", Icon: Settings },
];

export default function App() {
  const [tab, setTab] = useState("uavs");
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
              <span className="brand-sub">HỆ THỐNG QUẢN LÝ UAV</span>
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

        {/* SIDEBAR WEATHER WIDGET (EXACT MATCH REFERENCE IMAGE) */}
        {!collapsed && (
          <div className="sidebar-weather-widget">
            <div className="weather-title">THỜI TIẾT</div>
            <div className="weather-main-row">
              <CloudSun size={26} color="#facc15" />
              <div className="weather-temp-group">
                <span className="temp-val">28°C</span>
                <span className="weather-desc">Nhiều mây</span>
              </div>
            </div>
            <div className="weather-details-row">
              <div className="w-detail">
                <Wind size={13} color="#94a3b8" />
                <span>Gió <strong>12 km/h</strong></span>
              </div>
              <div className="w-detail">
                <Droplets size={13} color="#60a5fa" />
                <span>Độ ẩm <strong>72%</strong></span>
              </div>
            </div>
          </div>
        )}

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
              <span className="title-text">
                {tab === "settings"
                  ? "CÀI ĐẶT HỆ THỐNG"
                  : tab === "map"
                  ? "BẢN ĐỒ TÁC CHIẾN"
                  : tab === "uavs"
                  ? "DANH SÁCH UAV"
                  : tab === "overview"
                  ? "TỔNG QUAN"
                  : tab === "missions"
                  ? "NHIỆM VỤ"
                  : tab === "tracking"
                  ? "THEO DÕI MỤC TIÊU"
                  : tab === "live"
                  ? "THEO DÕI TRỰC TIẾP"
                  : tab === "analytics"
                  ? "PHÂN TÍCH"
                  : tab === "notes"
                  ? "GHI CHÉP"
                  : tab === "logs"
                  ? "CẢNH BÁO"
                  : tab === "reports"
                  ? "BÁO CÁO"
                  : "UAV CONTROL"}
              </span>
              <span className="breadcrumb-sub-text">Trang chủ &gt; {tab.toUpperCase()}</span>
            </div>
          </div>

          <div className="header-right-telemetry">
            <div className="telemetry-item gps">
              <Crosshair size={15} color="#4ade80" />
              <span>GPS</span>
              <strong>{payload?.uav_status?.gps?.satellites ?? 12}</strong>
            </div>

            <div className="telemetry-item signal">
              <Wifi size={15} className="green-text" />
              <span>Liên kết</span>
              <strong className="green-text">Strong</strong>
            </div>

            <div className="telemetry-item battery">
              <Battery size={15} color="#4ade80" />
              <span>Pin hệ thống</span>
              <strong className="green-text">{payload?.uav_status?.gps?.battery_pct ?? 78}%</strong>
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
          <ErrorBoundary key={tab}>
            {tab === "overview" && <Overview payload={payload} onNavigateTab={setTab} />}
            {tab === "uavs" && <UAVList activeUavId={payload?.active_uav_id} payload={payload} onOpenAlerts={() => setTab("logs")} />}
            {tab === "missions" && <Missions payload={payload} />}
            {tab === "tracking" && <Targets payload={payload} />}
            {tab === "live" && <LiveMonitoring payload={payload} />}
            {tab === "map" && <MapView payload={payload} />}
            {tab === "analytics" && <Analytics payload={payload} />}
            {tab === "notes" && <NotesView />}
            {tab === "logs" && <AlertsView onOpenMap={() => setTab("map")} />}
            {tab === "reports" && <ReportsView />}
            {tab === "settings" && <SettingsPage />}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
