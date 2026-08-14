import { useEffect, useState } from "react";
import {
  Layers,
  Crosshair,
  Wifi,
  Battery,
  User,
  Plane,
  Briefcase,
  Target,
  AlertTriangle,
  CloudSun,
  Wind,
  Droplets,
  Star,
  Trash2,
} from "lucide-react";
import {
  createPoi,
  deletePoi,
  getLogs,
  getUavTelemetry,
  listMissions,
  listPois,
  listTargets,
  listUAVs,
} from "../api";
import FullTacticalMap from "../components/FullTacticalMap";
import MapInfoSidebar from "../components/MapInfoSidebar";

const STATUS_LABEL = { flying: "Đang bay", ready: "Sẵn sàng", offline: "Ngoại tuyến", maintenance: "Bảo trì" };
const STATUS_COLOR = { flying: "green", ready: "blue", offline: "grey", maintenance: "yellow" };

export default function MapView({ payload }) {
  const [cursorPos, setCursorPos] = useState(null);
  const [currentTime, setCurrentTime] = useState("");
  const [uavs, setUavs] = useState([]);
  const [uavPositions, setUavPositions] = useState({});
  const [missions, setMissions] = useState([]);
  const [targets, setTargets] = useState([]);
  const [pois, setPois] = useState([]);
  const [alertCount, setAlertCount] = useState(0);
  const [newPoiName, setNewPoiName] = useState("");
  const [layers, setLayers] = useState({
    satellite: true,
    streets: true,
    nofly: true,
    hazard: true,
    targets: true,
    uavs: true,
    poi: true,
  });

  const activeUavId = payload?.active_uav_id ?? null;

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
      const [uavList, missionList, targetList, poiList, logs] = await Promise.all([
        listUAVs(), listMissions(), listTargets(), listPois(), getLogs(),
      ]);
      const safeUavs = Array.isArray(uavList) ? uavList : [];
      setUavs(safeUavs);
      setMissions(Array.isArray(missionList) ? missionList : []);
      setTargets(Array.isArray(targetList) ? targetList : []);
      setPois(Array.isArray(poiList) ? poiList : []);
      setAlertCount(Array.isArray(logs) ? logs.length : 0);

      const positions = {};
      await Promise.all(
        safeUavs.map(async (u) => {
          positions[u.id] = await getUavTelemetry(u.id);
        })
      );
      setUavPositions(positions);
    }
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, []);

  const handleToggleLayer = (key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  async function addPoi() {
    if (!cursorPos || !newPoiName.trim()) return;
    await createPoi({ name: newPoiName.trim(), type: "poi", lat: Number(cursorPos.lat), lon: Number(cursorPos.lng) });
    setNewPoiName("");
    setPois(await listPois());
  }

  async function addPin() {
    if (!cursorPos) return;
    await createPoi({ name: `Toạ độ ${new Date().toLocaleTimeString("vi-VN")}`, type: "pin", lat: Number(cursorPos.lat), lon: Number(cursorPos.lng) });
    setPois(await listPois());
  }

  async function removePoi(id) {
    await deletePoi(id);
    setPois(await listPois());
  }

  async function clearPins() {
    const pins = pois.filter((p) => p.type === "pin");
    await Promise.all(pins.map((p) => deletePoi(p.id)));
    setPois(await listPois());
  }

  const uavMarkers = uavs.map((u) => ({
    ...u,
    lat: uavPositions[u.id]?.lat,
    lon: uavPositions[u.id]?.lon,
    isActive: u.id === activeUavId,
  }));
  const poiList = pois.filter((p) => p.type !== "pin");
  const pinnedCoords = pois.filter((p) => p.type === "pin");
  const missionsRunning = missions.filter((m) => m.status === "active").length;
  const uavOnline = uavs.filter((u) => u.status !== "offline").length;

  return (
    <div className="map-page-layout">
      {/* Sub Header */}
      <div className="live-sub-header">
        <div className="header-left">
          <div className="uav-selector-wrapper">
            <Layers size={18} color="#4ade80" />
            <span className="sub-title-label">BẢN ĐỒ</span>
            <span className="dot-divider">/</span>
            <span className="breadcrumb-sub">Trang chủ &gt; Bản đồ</span>
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

      {/* Top Summary Bar */}
      <div className="map-top-summary-grid">
        <div className="summary-card">
          <div className="sum-icon"><Plane size={20} color="#60a5fa" /></div>
          <div className="sum-info">
            <span className="sum-label">UAV HOẠT ĐỘNG</span>
            <div className="sum-value">{uavOnline} <span className="sub-slash">/ {uavs.length}</span></div>
            <div className="sum-sub-status">
              <span className="green-dot">●</span> {uavOnline} online &nbsp;
              <span className="grey-dot">●</span> {uavs.length - uavOnline} offline
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="sum-icon"><Briefcase size={20} color="#4ade80" /></div>
          <div className="sum-info">
            <span className="sum-label">NHIỆM VỤ ĐANG THỰC HIỆN</span>
            <div className="sum-value">{missionsRunning}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="sum-icon"><Target size={20} color="#facc15" /></div>
          <div className="sum-info">
            <span className="sum-label">MỤC TIÊU ĐANG THEO DÕI</span>
            <div className="sum-value">{targets.length}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="sum-icon"><AlertTriangle size={20} color="#f87171" /></div>
          <div className="sum-info">
            <span className="sum-label">CẢNH BÁO</span>
            <div className="sum-value">{alertCount}</div>
          </div>
        </div>

        {/* ponytail: chưa tích hợp API thời tiết thật — số liệu minh hoạ tĩnh, giống các pill "GPS 12" ở header */}
        <div className="summary-card weather-card">
          <div className="weather-left">
            <span className="cloud-icon"><CloudSun size={20} color="#facc15" /></span>
            <div>
              <div className="sum-value" style={{ fontSize: "16px" }}>28°C</div>
              <span className="weather-desc">Nhiều mây</span>
            </div>
          </div>
          <div className="weather-details">
            <span><Wind size={10} style={{ verticalAlign: "-1px" }} /> Gió <strong>12 km/h</strong></span>
            <span><Droplets size={10} style={{ verticalAlign: "-1px" }} /> Độ ẩm <strong>72%</strong></span>
          </div>
        </div>
      </div>

      {/* Main Split View */}
      <div className="map-main-split">
        <FullTacticalMap
          cursorPos={cursorPos}
          onCursorMove={setCursorPos}
          activeLayers={layers}
          uavs={uavMarkers}
          targets={layers.targets ? targets : []}
          pois={layers.poi ? poiList : []}
        />
        <MapInfoSidebar cursorPos={cursorPos} layers={layers} onToggleLayer={handleToggleLayer} />
      </div>

      {/* Bottom Grid: 3 Panels */}
      <div className="map-bottom-grid">
        {/* Panel 1: DANH SÁCH UAV */}
        <div className="map-bottom-card">
          <div className="panel-title">DANH SÁCH UAV</div>
          <div className="map-uav-list">
            {uavs.map((uav) => (
              <div key={uav.id} className="map-uav-item">
                <div className="uav-item-icon"><Plane size={16} /></div>
                <div className="uav-item-meta">
                  <div className="uav-item-id">{uav.name}</div>
                  <div className="uav-item-model">{uav.type || "-"}</div>
                </div>
                <span className={`uav-status-badge ${STATUS_COLOR[uav.status] ?? "grey"}`}>{STATUS_LABEL[uav.status] ?? uav.status}</span>
                <div className="uav-battery-bar">
                  <strong>{uavPositions[uav.id]?.battery_pct ?? "-"}%</strong>
                  <div className="bat-track">
                    <div className="bat-fill" style={{ width: `${uavPositions[uav.id]?.battery_pct ?? 0}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: ĐIỂM QUAN TÂM (POI) — bảng pois thật trong SQLite */}
        <div className="map-bottom-card">
          <div className="panel-title-row">
            <span className="panel-title">ĐIỂM QUAN TÂM (POI)</span>
          </div>
          <div className="map-poi-list">
            {poiList.length === 0 && <p className="muted">Chưa có POI nào. Rê chuột trên bản đồ rồi đặt tên + "Thêm POI".</p>}
            {poiList.map((poi) => (
              <div key={poi.id} className="map-poi-item">
                <span className="poi-icon purple"><Star size={14} /></span>
                <span className="poi-id">#{poi.id}</span>
                <span className="poi-name">{poi.name}</span>
                <span className="poi-coords">{poi.lat.toFixed(6)}° N, {poi.lon.toFixed(6)}° E</span>
                <button className="icon-action-btn danger" title="Xoá" onClick={() => removePoi(poi.id)}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
          <div className="poi-add-row" style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            <input
              className="filter-select"
              style={{ flex: 1 }}
              placeholder={cursorPos ? "Tên POI tại vị trí con trỏ..." : "Di chuột trên bản đồ trước"}
              value={newPoiName}
              onChange={(e) => setNewPoiName(e.target.value)}
              disabled={!cursorPos}
            />
            <button className="add-btn" onClick={addPoi} disabled={!cursorPos || !newPoiName.trim()}>+ Thêm POI</button>
          </div>
        </div>

        {/* Panel 3: TỌA ĐỘ ĐÃ ĐÁNH DẤU — cùng bảng pois, type="pin" */}
        <div className="map-bottom-card">
          <div className="panel-title-row">
            <span className="panel-title">TỌA ĐỘ ĐÃ ĐÁNH DẤU</span>
            <button className="add-btn" onClick={addPin} disabled={!cursorPos}>+ Thêm tọa độ</button>
          </div>
          <div className="map-coords-list">
            {pinnedCoords.length === 0 && <p className="muted">Chưa có tọa độ nào được đánh dấu.</p>}
            {pinnedCoords.map((coord, i) => (
              <div key={coord.id} className="map-coord-item">
                <span className="coord-num-badge">{i + 1}</span>
                <span className="coord-text">{coord.lat.toFixed(6)}° N, {coord.lon.toFixed(6)}° E</span>
              </div>
            ))}
          </div>
          <div className="link-action-footer danger-link">
            <a href="#clear" onClick={(e) => { e.preventDefault(); clearPins(); }}><Trash2 size={14} /> Xóa tất cả</a>
          </div>
        </div>
      </div>
    </div>
  );
}
