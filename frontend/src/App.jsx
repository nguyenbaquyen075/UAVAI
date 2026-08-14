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

const TABS = [
  { key: "overview", label: "Tổng quan" },
  { key: "uavs", label: "UAV" },
  { key: "missions", label: "Nhiệm vụ" },
  { key: "tracking", label: "Mục tiêu" },
  { key: "live", label: "Giám sát trực tiếp" },
  { key: "map", label: "Bản đồ" },
  { key: "logs", label: "Cảnh báo" },
  { key: "settings", label: "Cài đặt" },
];

export default function App() {
  const [tab, setTab] = useState("overview");
  const { connected, payload } = useDetectionSocket();

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>UAV Patrol</h1>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={tab === t.key ? "active" : ""}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className={`status ${connected ? "ok" : "down"}`}>
          {connected
            ? `Đã kết nối · ${payload?.uav_status?.latency_ms ?? "-"} ms`
            : "Mất kết nối"}
        </div>
      </aside>

      <main className="content">
        {tab === "overview" && <Overview payload={payload} />}
        {tab === "uavs" && <UAVList activeUavId={payload?.active_uav_id} payload={payload} />}
        {tab === "missions" && <Missions payload={payload} />}
        {tab === "live" && <LiveMonitoring payload={payload} />}
        {tab === "tracking" && <Targets payload={payload} />}
        {tab === "logs" && <LogViewer />}
        {tab === "map" && <MapView payload={payload} />}
        {tab === "settings" && <SettingsPage />}
      </main>
    </div>
  );
}
