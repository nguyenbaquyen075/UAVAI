import { useEffect, useRef, useState } from "react";
import {
  Plane,
  Clock,
  Wrench,
  AlertTriangle,
  X,
  Gamepad2,
  ArrowDown,
  RotateCcw,
  Eye,
  MapPin,
  Settings,
  MoreVertical,
  Plus,
  Wifi,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Camera,
  Layers,
} from "lucide-react";
import {
  createUAV,
  getOverviewStats,
  listMissions,
  listUAVs,
} from "../api";
import FleetMap from "../components/FleetMap";
import TacticalVideoHUD from "../components/TacticalVideoHUD";

const STATUS_LABEL = {
  flying: "ĐANG BAY",
  ready: "SẴN SÀNG",
  offline: "OFFLINE",
  maintenance: "BẢO TRÌ",
};

const STATUS_CLASS = {
  flying: "green-badge",
  ready: "blue-badge",
  offline: "gray-badge",
  maintenance: "orange-badge",
};

const DEFAULT_FLEET = [
  { id: 1, name: "UAV_01", type: "Falcon 8X", status: "flying", battery: 85, zone: "Khu vực A", alt: 120, speed: 45, signal: "Strong" },
  { id: 2, name: "UAV_02", type: "Eagle Pro", status: "flying", battery: 78, zone: "Khu vực B", alt: 150, speed: 48, signal: "Strong" },
  { id: 3, name: "UAV_03", type: "SkyEye 4K", status: "flying", battery: 62, zone: "Khu vực C", alt: 110, speed: 42, signal: "Strong" },
  { id: 4, name: "UAV_04", type: "Phantom 4 RTK", status: "ready", battery: 92, zone: "Căn cứ", alt: 0, speed: 0, signal: "Strong" },
  { id: 5, name: "UAV_05", type: "Matrice 300 RTK", status: "offline", battery: null, zone: "-", alt: 0, speed: 0, signal: "None" },
  { id: 6, name: "UAV_06", type: "Autel EVO II", status: "maintenance", battery: null, zone: "Căn cứ", alt: 0, speed: 0, signal: "None" },
];

export default function UAVList({ activeUavId, payload, onOpenAlerts }) {
  const [uavs, setUavs] = useState([]);
  const [missions, setMissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedId, setSelectedId] = useState(2);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", video_source: "", type: "Eagle Pro", zone: "Khu vực A" });
  const [isVideoFull, setIsVideoFull] = useState(false);
  const videoCardRef = useRef(null);

  const toggleVideoFullscreen = () => {
    if (!videoCardRef.current) return;
    if (!document.fullscreenElement) {
      videoCardRef.current.requestFullscreen().catch(() => {});
      setIsVideoFull(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsVideoFull(false);
    }
  };

  async function refresh() {
    try {
      const list = await listUAVs();
      const safeList = Array.isArray(list) && list.length > 0 ? list : DEFAULT_FLEET;
      setUavs(safeList);

      const mList = await listMissions();
      setMissions(Array.isArray(mList) ? mList : []);

      setStats(await getOverviewStats());
    } catch (err) {
      setUavs(DEFAULT_FLEET);
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, []);

  const safeUavs = uavs.length > 0 ? uavs : DEFAULT_FLEET;
  const selected = safeUavs.find((u) => u.id === selectedId) || safeUavs[1] || safeUavs[0];

  async function handleAddUav(e) {
    e.preventDefault();
    if (!form.name) return;
    try {
      await createUAV(form);
      setShowAdd(false);
      refresh();
    } catch (err) {
      console.error(err);
    }
  }

  const flyingCount = safeUavs.filter((u) => u.status === "flying").length;
  const readyCount = safeUavs.filter((u) => u.status === "ready").length;
  const maintCount = safeUavs.filter((u) => u.status === "maintenance").length;
  const offlineCount = safeUavs.filter((u) => u.status === "offline").length;

  return (
    <div className="uav-management-page">
      {/* ROW 1: TOP 5 SUMMARY KPI CARDS */}
      <div className="uav-kpi-row">
        {/* CARD 1: TỔNG UAV */}
        <div className="uav-kpi-card">
          <div className="kpi-icon-box green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <div className="kpi-body">
            <span className="kpi-label">TỔNG UAV</span>
            <div className="kpi-val-group">
              <span className="big-num">{safeUavs.length}</span>
            </div>
            <div className="kpi-sub-text">
              <span className="dot green-dot" /> {flyingCount + readyCount} online{" "}
              <span className="dot gray-dot" /> {offlineCount + maintCount} offline
            </div>
          </div>
        </div>

        {/* CARD 2: ĐANG BAY */}
        <div className="uav-kpi-card">
          <div className="kpi-icon-box green-circle">
            <Plane size={22} color="#4ade80" />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">ĐANG BAY</span>
            <div className="kpi-val-group">
              <span className="big-num">{flyingCount}</span>
            </div>
            <div className="kpi-sub-text green-text">
              {((flyingCount / safeUavs.length) * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* CARD 3: SẴN SÀNG */}
        <div className="uav-kpi-card">
          <div className="kpi-icon-box blue-circle">
            <Clock size={22} color="#60a5fa" />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">SẴN SÀNG</span>
            <div className="kpi-val-group">
              <span className="big-num">{readyCount}</span>
            </div>
            <div className="kpi-sub-text blue-text">
              {((readyCount / safeUavs.length) * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* CARD 4: BẢO TRÌ */}
        <div className="uav-kpi-card">
          <div className="kpi-icon-box orange-circle">
            <Wrench size={22} color="#f97316" />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">BẢO TRÌ</span>
            <div className="kpi-val-group">
              <span className="big-num">{maintCount}</span>
            </div>
            <div className="kpi-sub-text orange-text">
              {((maintCount / safeUavs.length) * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* CARD 5: CẢNH BÁO */}
        <div className="uav-kpi-card">
          <div className="kpi-icon-box red-circle">
            <AlertTriangle size={22} color="#ef4444" fill="#ef4444" fillOpacity="0.2" />
          </div>
          <div className="kpi-body">
            <span className="kpi-label">CẢNH BÁO</span>
            <div className="kpi-val-group">
              <span className="big-num red-text">{stats?.alert_count_24h ?? 2}</span>
            </div>
            <button className="kpi-link-btn" onClick={onOpenAlerts}>
              Xem chi tiết
            </button>
          </div>
        </div>
      </div>

      {/* ROW 2: FLEET TABLE + UAV DETAIL PANEL */}
      <div className="uav-middle-grid">
        {/* LEFT PANEL: DANH SÁCH UAV */}
        <div className="uav-table-card">
          <div className="card-top-bar">
            <span className="card-title">DANH SÁCH UAV</span>
            <button className="add-uav-btn" onClick={() => setShowAdd(!showAdd)}>
              <Plus size={15} /> Thêm UAV
            </button>
          </div>

          {showAdd && (
            <form className="add-uav-form" onSubmit={handleAddUav}>
              <input
                placeholder="Tên UAV (vd. UAV_07)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                placeholder="Loại UAV"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              />
              <input
                placeholder="Khu vực"
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
              />
              <button type="submit" className="save-btn">
                Lưu
              </button>
            </form>
          )}

          <div className="uav-table-container">
            <table className="uav-fleet-table">
              <thead>
                <tr>
                  <th>ID UAV</th>
                  <th>TÊN UAV</th>
                  <th>Trạng thái</th>
                  <th>Pin</th>
                  <th>Vị trí</th>
                  <th>Độ cao</th>
                  <th>Tốc độ</th>
                  <th>Liên kết</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {safeUavs.map((u) => {
                  const isSel = u.id === selectedId;
                  const statusKey = u.status || "flying";
                  return (
                    <tr
                      key={u.id}
                      className={isSel ? "selected-row" : ""}
                      onClick={() => setSelectedId(u.id)}
                    >
                      <td className="id-cell">{u.id}</td>
                      <td className="name-cell">
                        <div className="uav-thumb-cell">
                          <img src="/uav_drone.png" alt="" className="thumb-drone" />
                          <div className="uav-name-group">
                            <span className="u-name">{u.name || `UAV_0${u.id}`}</span>
                            <span className="u-type">{u.type || "Eagle Pro"}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill-badge ${STATUS_CLASS[statusKey] || "green-badge"}`}>
                          {STATUS_LABEL[statusKey] || "ĐANG BAY"}
                        </span>
                      </td>
                      <td className="battery-cell">
                        {u.battery != null ? (
                          <div className="bat-flex">
                            <span className="bat-num">{u.battery}%</span>
                            <div className="bat-mini-meter">
                              <div
                                className={`bat-fill-${u.battery < 30 ? "red" : u.battery < 70 ? "yellow" : "green"}`}
                                style={{ width: `${u.battery}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="muted-dash">-</span>
                        )}
                      </td>
                      <td className="zone-cell">{u.zone || "-"}</td>
                      <td className="num-cell">{u.alt != null ? `${u.alt} m` : "0 m"}</td>
                      <td className="num-cell">{u.speed != null ? `${u.speed} km/h` : "0 km/h"}</td>
                      <td className="signal-cell">
                        {u.status === "offline" || u.status === "maintenance" ? (
                          <span className="signal-bars-off">
                            <i className="red" /><i /><i /><i />
                          </span>
                        ) : (
                          <span className="signal-bars-on">
                            <i className="active" /><i className="active" /><i className="active" /><i className="active" />
                          </span>
                        )}
                      </td>
                      <td className="actions-cell">
                        <div className="action-buttons-group">
                          <button className="act-icon-btn" title="Xem chi tiết" onClick={(e) => { e.stopPropagation(); setSelectedId(u.id); }}>
                            <Eye size={14} />
                          </button>
                          <button className="act-icon-btn" title="Xem vị trí" onClick={(e) => e.stopPropagation()}>
                            <MapPin size={14} />
                          </button>
                          <button className="act-icon-btn" title="Cài đặt" onClick={(e) => e.stopPropagation()}>
                            <Settings size={14} />
                          </button>
                          <button className="act-icon-btn" title="Tùy chọn" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="table-bottom-pagination">
            <span className="pagination-info">
              Hiển thị 1 đến {safeUavs.length} của {safeUavs.length} UAV
            </span>
            <div className="pagination-controls">
              <button className="pag-btn" disabled>
                <ChevronLeft size={14} />
              </button>
              <span className="pag-page active">1</span>
              <button className="pag-btn" disabled>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: CHI TIẾT UAV (EXACT USER SCREENSHOT) */}
        <div className="uav-detail-card">
          <div className="card-top-bar">
            <span className="card-title">CHI TIẾT UAV</span>
            <div className="right-detail-header-actions">
              <span className="status-badge-green">ĐANG BAY</span>
              <button className="close-detail-btn" onClick={() => setSelectedId(null)}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* DRONE RENDER & META (SIDE BY SIDE LIKE SCREENSHOT) */}
          <div className="detail-drone-header-split">
            <div className="detail-drone-preview">
              <img src="/uav_drone.png" alt="Drone Render" className="detail-drone-img" />
            </div>

            <div className="detail-name-group-right">
              <h3 className="d-title">{selected.name || "UAV_02"}</h3>
              <span className="d-sub">{selected.type || "Eagle Pro"}</span>

              <div className="detail-specs-compact">
                <div className="spec-item">
                  <span className="lbl">Loại UAV</span>
                  <strong className="val">{selected.type || "Eagle Pro"}</strong>
                </div>
                <div className="spec-item">
                  <span className="lbl">Serial</span>
                  <strong className="val">EP23041801</strong>
                </div>
              </div>
            </div>
          </div>

          {/* TELEMETRY METRICS LIST */}
          <div className="detail-telemetry-grid">
            <div className="t-row">
              <span className="lbl">Trạng thái</span>
              <span className="val green-text bold-text">Đang bay</span>
            </div>

            <div className="t-row split-2">
              <div>
                <span className="lbl">Thời gian bay</span> <strong className="val">28:45</strong>
              </div>
              <div>
                <span className="lbl">Khoảng cách</span> <strong className="val">5.2 km</strong>
              </div>
            </div>

            <div className="t-row split-2">
              <div>
                <span className="lbl">Độ cao</span> <strong className="val">150 m</strong>
              </div>
              <div>
                <span className="lbl">Tốc độ</span> <strong className="val">48 km/h</strong>
              </div>
            </div>

            <div className="t-row battery">
              <span className="lbl">Pin</span>
              <div className="bat-progress-group">
                <div className="bat-meter-track">
                  <div className="bat-fill-bar" style={{ width: `${selected.battery ?? 78}%` }} />
                </div>
                <span className="pct-num green-text">{selected.battery ?? 78}%</span>
              </div>
            </div>

            <div className="t-row">
              <span className="lbl">Liên kết</span>
              <span className="val green-text signal-val">
                12 <Wifi size={14} className="green-text" /> <strong>Strong &gt;</strong>
              </span>
            </div>
          </div>

          {/* 4 ACTION BUTTONS HORIZONTAL ROW */}
          <div className="detail-action-buttons-grid">
            <button className="act-btn ctrl">
              <Gamepad2 size={14} /> ĐIỀU KHIỂN
            </button>
            <button className="act-btn observe green-outline">
              <Eye size={14} color="#4ade80" /> THEO DÕI
            </button>
            <button className="act-btn return red-btn">
              <RotateCcw size={14} color="#ef4444" /> QUAY VỀ
            </button>
            <button className="act-btn land red-btn">
              <ArrowDown size={14} color="#ef4444" /> HẠ CÁNH
            </button>
          </div>
        </div>
      </div>

      {/* ROW 3: LIVE MONITORING & FLEET MAP (2 COLUMNS) */}
      <div className="uav-row-3-grid">
        {/* LEFT: THEO DÕI TRỰC TIẾP */}
        <div ref={videoCardRef} className="video-monitoring-card">
          <div className="card-top-bar">
            <span className="card-title">
              THEO DÕI TRỰC TIẾP - {selected.name || "UAV_02"} <span className="live-dot-green">● LIVE</span>
            </span>
            <div className="hud-card-top-right-actions">
              <button className="top-hud-act-btn" onClick={toggleVideoFullscreen} title="Toàn màn hình VIDEO">
                {isVideoFull ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
              <button className="top-hud-act-btn" title="Chụp ảnh">
                <Camera size={13} />
              </button>
              <button className="top-hud-act-btn" title="Tùy chọn">
                <Layers size={13} />
              </button>
            </div>
          </div>

          <div className="video-hud-wrapper">
            <TacticalVideoHUD
              isLive={true}
              telemetry={payload?.uav_status}
              objects={payload?.objects ?? []}
              zoomLevel={5.2}
            />
          </div>
        </div>

        {/* RIGHT: VỊ TRÍ UAV (FLEET MAP) */}
        <div className="fleet-map-card">
          <FleetMap uavs={safeUavs} onSelect={(id) => setSelectedId(id)} />
        </div>
      </div>

      {/* ROW 4: ACTIVE MISSIONS & RECENT ALERTS (2 COLUMNS) */}
      <div className="uav-row-4-grid">
        {/* LEFT: NHIỆM VỤ ĐANG THỰC HIỆN */}
        <div className="active-missions-card">
          <div className="card-top-bar">
            <span className="card-title">NHIỆM VỤ ĐANG THỰC HIỆN</span>
            <button className="view-all-link" onClick={() => onNavigateTab && onNavigateTab("missions")}>
              Xem tất cả <ChevronRight size={13} />
            </button>
          </div>

          <div className="table-responsive">
            <table className="mini-missions-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên nhiệm vụ</th>
                  <th>UAV</th>
                  <th>Mục tiêu</th>
                  <th>Khu vực</th>
                  <th>Bắt đầu</th>
                  <th>Thời gian</th>
                  <th>Tiến độ</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="id-col">MT_240513_01</td>
                  <td className="bold-col">Tuần tra khu vực A</td>
                  <td>UAV_01</td>
                  <td>3</td>
                  <td>Khu vực A</td>
                  <td>18:20</td>
                  <td>00:22:45</td>
                  <td>
                    <div className="progress-flex">
                      <div className="p-bar"><div className="p-fill" style={{ width: "75%" }} /></div>
                      <span>75%</span>
                    </div>
                  </td>
                  <td><span className="status-badge-green">ĐANG THỰC HIỆN</span></td>
                </tr>

                <tr>
                  <td className="id-col">MT_240513_02</td>
                  <td className="bold-col">Giám sát biên giới</td>
                  <td>UAV_02</td>
                  <td>2</td>
                  <td>Khu vực B</td>
                  <td>18:15</td>
                  <td>00:27:10</td>
                  <td>
                    <div className="progress-flex">
                      <div className="p-bar"><div className="p-fill" style={{ width: "60%" }} /></div>
                      <span>60%</span>
                    </div>
                  </td>
                  <td><span className="status-badge-green">ĐANG THỰC HIỆN</span></td>
                </tr>

                <tr>
                  <td className="id-col">MT_240513_03</td>
                  <td className="bold-col">Theo dõi mục tiêu</td>
                  <td>UAV_03</td>
                  <td>1</td>
                  <td>Khu vực C</td>
                  <td>18:10</td>
                  <td>00:31:50</td>
                  <td>
                    <div className="progress-flex">
                      <div className="p-bar"><div className="p-fill" style={{ width: "50%" }} /></div>
                      <span>50%</span>
                    </div>
                  </td>
                  <td><span className="status-badge-green">ĐANG THỰC HIỆN</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: CẢNH BÁO GẦN NHẤT */}
        <div className="recent-alerts-card">
          <div className="card-top-bar">
            <span className="card-title">CẢNH BÁO GẦN NHẤT</span>
            <button className="view-all-link" onClick={onOpenAlerts}>
              Xem tất cả <ChevronRight size={13} />
            </button>
          </div>

          <div className="alerts-list-group">
            <div className="alert-item red">
              <AlertTriangle size={16} className="red-icon" />
              <div className="alert-msg">
                <strong>UAV_06:</strong> Mất tín hiệu liên lạc
              </div>
              <span className="alert-time">18:35:21 <ChevronRight size={14} /></span>
            </div>

            <div className="alert-item yellow">
              <AlertTriangle size={16} className="yellow-icon" />
              <div className="alert-msg">
                <strong>UAV_03:</strong> Pin yếu (20%)
              </div>
              <span className="alert-time">18:32:10 <ChevronRight size={14} /></span>
            </div>

            <div className="alert-item orange">
              <AlertTriangle size={16} className="orange-icon" />
              <div className="alert-msg">
                <strong>UAV_04:</strong> Bảo trì định kỳ
              </div>
              <span className="alert-time">13/05/2024 17:45:00 <ChevronRight size={14} /></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
