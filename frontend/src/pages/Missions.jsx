import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Flag,
  PlaneTakeoff,
  MapPin,
  AlertTriangle,
  ClipboardList,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Crosshair,
  Wifi,
  Battery,
  User,
  Camera,
  Pause,
  Play,
  X,
  Trash2,
} from "lucide-react";
import {
  activateUAV,
  createMission,
  deleteMission,
  getMissionTimeline,
  getUavTelemetry,
  listMissions,
  listUAVs,
  patchMission,
} from "../api";
import ProgressRing from "../components/ProgressRing";
import TacticalVideoHUD from "../components/TacticalVideoHUD";

const START = [21.0285, 105.8542];
const PAGE_SIZE = 6;

const STATUS_LABEL = { active: "ĐANG THỰC HIỆN", paused: "TẠM DỪNG", completed: "HOÀN THÀNH", cancelled: "ĐÃ HUỶ", failed: "THẤT BẠI" };
const STATUS_CLASS = { active: "green", paused: "yellow", completed: "blue", cancelled: "grey", failed: "red" };
const PRIORITY_LABEL = { high: "Cao", medium: "Trung bình", low: "Thấp" };
const EVENT_ICON = { created: Flag, start: PlaneTakeoff, waypoint: MapPin, alert: AlertTriangle };

function toLocalInput(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fmtTime(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
}

function timeRemaining(expectedEndIso) {
  const ms = new Date(expectedEndIso).getTime() - Date.now();
  if (ms <= 0) return "00:00:00";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function Missions({ payload }) {
  const [missions, setMissions] = useState([]);
  const [uavs, setUavs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [uavFilter, setUavFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const [creating, setCreating] = useState(false);
  const [newWaypoints, setNewWaypoints] = useState([]);
  const [form, setForm] = useState({
    name: "", uav_id: "", priority: "medium", description: "",
    expected_end: toLocalInput(new Date(Date.now() + 3600_000)),
  });

  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const markerRef = useRef(null);

  async function refresh() {
    const missionList = await listMissions();
    const safeMissions = Array.isArray(missionList) ? missionList : [];
    setMissions(safeMissions);

    const uavList = await listUAVs();
    const safeUavs = Array.isArray(uavList) ? uavList : [];
    setUavs(safeUavs);

    if (!form.uav_id && safeUavs.length) setForm((f) => ({ ...f, uav_id: safeUavs[0].id }));
    if (selectedId == null && safeMissions.length) setSelectedId(safeMissions[0].id);
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, [selectedId]);

  useEffect(() => {
    if (selectedId == null || creating) return;
    let cancelled = false;
    getMissionTimeline(selectedId).then((t) => !cancelled && setTimeline(Array.isArray(t) ? t : []));
    return () => { cancelled = true; };
  }, [selectedId, missions, creating]);

  const safeMissions = Array.isArray(missions) ? missions : [];
  const safeUavs = Array.isArray(uavs) ? uavs : [];
  const safeTimeline = Array.isArray(timeline) ? timeline : [];

  const selected = safeMissions.find((m) => m.id === selectedId);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    async function poll() {
      const t = await getUavTelemetry(selected.uav_id);
      if (!cancelled) setTelemetry(t);
    }
    poll();
    const id = setInterval(poll, 2000);
    return () => { cancelled = true; clearInterval(id); };
  }, [selected?.uav_id]);

  // --- map ---
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current).setView(START, 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    markerRef.current = L.marker(START, {
      icon: L.divIcon({
        className: "drone-marker",
        html: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path></svg>',
        iconSize: [20, 20],
      }),
    }).addTo(map);
    mapRef.current = map;
    map.on("click", (e) => {
      setNewWaypoints((prev) => [...prev, { lat: e.latlng.lat, lon: e.latlng.lng }]);
    });
    return () => map.remove();
  }, []);

  useEffect(() => {
    if (!layerRef.current) return;
    layerRef.current.clearLayers();
    const waypoints = creating ? newWaypoints : selected?.waypoints ?? [];
    waypoints.forEach((wp, i) => {
      L.marker([wp.lat, wp.lon]).addTo(layerRef.current).bindTooltip(String(i + 1), { permanent: true });
    });
    if (waypoints.length > 1) {
      L.polyline(waypoints.map((w) => [w.lat, w.lon]), { color: "#4ade80" }).addTo(layerRef.current);
    }
    if (waypoints.length && mapRef.current) {
      mapRef.current.fitBounds(waypoints.map((w) => [w.lat, w.lon]), { padding: [30, 30] });
    }
  }, [creating, newWaypoints, selected]);

  useEffect(() => {
    if (!telemetry || !markerRef.current) return;
    markerRef.current.setLatLng([telemetry.lat, telemetry.lon]);
  }, [telemetry]);

  async function submitMission(e) {
    e.preventDefault();
    if (!form.name || !form.uav_id || newWaypoints.length === 0) return;
    const res = await createMission({
      name: form.name,
      uav_id: Number(form.uav_id),
      priority: form.priority,
      description: form.description,
      waypoints: newWaypoints,
      started_at: `${toLocalInput(new Date())}:00Z`,
      expected_end_at: `${form.expected_end}:00Z`,
    });
    setCreating(false);
    setNewWaypoints([]);
    setForm({ ...form, name: "", description: "" });
    if (res?.id) setSelectedId(res.id);
    refresh();
  }

  async function setStatus(status) {
    await patchMission(selectedId, { status });
    refresh();
  }

  async function remove(id) {
    await deleteMission(id);
    if (selectedId === id) setSelectedId(null);
    refresh();
  }

  const filtered = safeMissions.filter((m) => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && m.status !== statusFilter) return false;
    if (uavFilter && String(m.uav_id) !== uavFilter) return false;
    if (priorityFilter && m.priority !== priorityFilter) return false;
    return true;
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const total = safeMissions.length;
  const active = safeMissions.filter((m) => m.status === "active").length;
  const completed = safeMissions.filter((m) => m.status === "completed").length;
  const failedOrCancelled = safeMissions.filter((m) => m.status === "cancelled" || m.status === "failed").length;
  const totalFlightHours = safeMissions
    .filter((m) => m.status === "completed")
    .reduce((sum, m) => sum + (new Date(m.expected_end_at) - new Date(m.started_at)) / 3_600_000, 0);

  const isLive = selected && payload?.active_uav_id === selected.uav_id;
  const alertEvents = safeTimeline.filter((e) => e.type === "alert");

  return (
    <div className="missions-page">
      <div className="live-sub-header" style={{ marginBottom: "10px" }}>
        <div className="header-left">
          <div className="uav-selector-wrapper">
            <span className="sub-title-label"><Flag size={16} /> QUẢN LÝ NHIỆM VỤ</span>
            <span className="dot-divider">/</span>
            <span className="breadcrumb-sub">Trang chủ &gt; Nhiệm vụ</span>
          </div>
        </div>
        <div className="header-right-telemetry">
          <div className="telemetry-pill"><Crosshair size={14} color="#4ade80" /><span>GPS <strong>12</strong></span></div>
          <div className="telemetry-pill green"><Wifi size={14} /><span>Liên kết <strong>Strong</strong></span></div>
          <div className="telemetry-pill green"><Battery size={14} /><span>Pin <strong>78%</strong></span></div>
          <div className="telemetry-pill clock-pill">18:42:10 13/05/2024</div>
          <div className="user-profile-badge">
            <div className="avatar"><User size={16} color="#e6e8ec" /></div>
            <div className="user-info"><span className="username">admin</span><span className="user-role">Quản trị viên</span></div>
          </div>
        </div>
      </div>
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-icon"><ClipboardList size={20} /></div>
          <div className="stat-label">TỔNG NHIỆM VỤ</div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><PlayCircle size={20} color="#4ade80" /></div>
          <div className="stat-label">ĐANG THỰC HIỆN</div>
          <div className="stat-value">{active}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><CheckCircle2 size={20} color="#4ade80" /></div>
          <div className="stat-label">HOÀN THÀNH</div>
          <div className="stat-value">{completed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><XCircle size={20} color="#f87171" /></div>
          <div className="stat-label">THẤT BẠI / HUỶ</div>
          <div className="stat-value warn">{failedOrCancelled}</div>
        </div>
        <div className="stat-card" title="Tổng theo kế hoạch của nhiệm vụ đã hoàn thành, không phải thời gian bay đo thật">
          <div className="stat-icon"><Clock size={20} /></div>
          <div className="stat-label">TỔNG THỜI GIAN (KẾ HOẠCH)</div>
          <div className="stat-value">{totalFlightHours.toFixed(1)}h</div>
        </div>
      </div>

      <div className="missions-body-2col">
        <div className="missions-left">
          <section className="panel wide">
            <div className="panel-header">
              <h2>Danh sách nhiệm vụ</h2>
              <button onClick={() => setCreating((c) => !c)}>{creating ? "Đóng" : "+ Tạo nhiệm vụ"}</button>
            </div>

            {creating && (
              <form onSubmit={submitMission} className="inline-form wrap">
                <input placeholder="Tên nhiệm vụ" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <select value={form.uav_id} onChange={(e) => setForm({ ...form, uav_id: e.target.value })}>
                  {safeUavs.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="high">Ưu tiên cao</option>
                  <option value="medium">Ưu tiên trung bình</option>
                  <option value="low">Ưu tiên thấp</option>
                </select>
                <input type="datetime-local" value={form.expected_end} onChange={(e) => setForm({ ...form, expected_end: e.target.value })} />
                <input placeholder="Mô tả" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <span className="muted">Click trên bản đồ để thêm waypoint ({newWaypoints.length} điểm)</span>
                <button type="button" onClick={() => setNewWaypoints([])}>Xoá waypoint</button>
                <button type="submit">Lưu nhiệm vụ</button>
              </form>
            )}

            <div className="filters">
              <input placeholder="Tìm kiếm nhiệm vụ..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="">Trạng thái: Tất cả</option>
                {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <select value={uavFilter} onChange={(e) => { setUavFilter(e.target.value); setPage(1); }}>
                <option value="">UAV: Tất cả</option>
                {safeUavs.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}>
                <option value="">Ưu tiên: Tất cả</option>
                {Object.entries(PRIORITY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Tên nhiệm vụ</th>
                  <th>Waypoints</th>
                  <th>UAV</th>
                  <th>Trạng thái</th>
                  <th>Ưu tiên</th>
                  <th>Bắt đầu</th>
                  <th>Tiến độ</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((m) => (
                  <tr key={m.id} className={m.id === selectedId ? "row-selected" : ""} style={{ cursor: "pointer" }} onClick={() => setSelectedId(m.id)}>
                    <td>{m.name}</td>
                    <td>{m.waypoints?.length ?? 0} điểm</td>
                    <td>{safeUavs.find((u) => u.id === m.uav_id)?.name ?? m.uav_id}</td>
                    <td><span className={`badge ${STATUS_CLASS[m.status]}`}>{STATUS_LABEL[m.status]}</span></td>
                    <td>{PRIORITY_LABEL[m.priority]}</td>
                    <td>{fmtTime(m.started_at)}</td>
                    <td><div className="progress-bar small"><div className="progress-fill" style={{ width: `${m.progress_pct}%` }} /></div></td>
                  </tr>
                ))}
                {pageItems.length === 0 && <tr><td colSpan={7} className="muted">Không có nhiệm vụ nào</td></tr>}
              </tbody>
            </table>

            <div className="pagination">
              <span className="muted">Hiển thị {pageItems.length ? (page - 1) * PAGE_SIZE + 1 : 0} đến {(page - 1) * PAGE_SIZE + pageItems.length} của {filtered.length} nhiệm vụ</span>
              <div className="pagination-controls">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
                <span>{page} / {pageCount}</span>
                <button disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>›</button>
              </div>
            </div>
          </section>

          <div className="fleet-row">
            <section className="panel">
              <h2>Bản đồ nhiệm vụ {creating && <span className="muted">(đang chọn waypoint)</span>}</h2>
              <div ref={containerRef} className="mission-map" />
            </section>

            <section className="panel">
              <h2>Trực tiếp nhiệm vụ {isLive && <span className="live-dot">● LIVE</span>}</h2>
              <div className="main-video-hud-container">
                <TacticalVideoHUD
                  isLive={isLive}
                  telemetry={telemetry}
                  latencyMs={payload?.uav_status?.latency_ms}
                  frameSize={payload?.uav_status}
                  objects={isLive ? payload?.objects ?? [] : []}
                />
              </div>
            </section>
          </div>
        </div>

        <aside className="missions-right side-panel">
          <section>
            <div className="panel-header">
              <h2>Chi tiết nhiệm vụ</h2>
              {selected && <span className={`badge ${STATUS_CLASS[selected.status]}`}>{STATUS_LABEL[selected.status]}</span>}
            </div>
            {!selected && <p className="muted">Chọn 1 nhiệm vụ trong danh sách</p>}
            {selected && (
              <>
                <dl className="telemetry-list">
                  <dt>Tên</dt><dd>{selected.name}</dd>
                  <dt>UAV</dt><dd>{safeUavs.find((u) => u.id === selected.uav_id)?.name}</dd>
                  <dt>Ưu tiên</dt><dd>{PRIORITY_LABEL[selected.priority]}</dd>
                  <dt>Bắt đầu</dt><dd>{fmtTime(selected.started_at)}</dd>
                  <dt>Dự kiến kết thúc</dt><dd>{fmtTime(selected.expected_end_at)}</dd>
                  <dt>Waypoints</dt><dd>{selected.waypoints_reached}/{selected.waypoints?.length ?? 0}</dd>
                </dl>
                {selected.description && <p className="muted">{selected.description}</p>}
                <div className="detail-actions">
                  {!isLive && <button onClick={() => activateUAV(selected.uav_id).then(refresh)}><Camera size={14} /> Xem trực tiếp</button>}
                  {selected.status === "active" && <button onClick={() => setStatus("paused")}><Pause size={14} /> Tạm dừng</button>}
                  {selected.status === "paused" && <button onClick={() => setStatus("active")}><Play size={14} /> Tiếp tục</button>}
                  {(selected.status === "active" || selected.status === "paused") && (
                    <button className="danger" onClick={() => setStatus("cancelled")}><X size={14} /> Huỷ nhiệm vụ</button>
                  )}
                  <button onClick={() => remove(selected.id)}><Trash2 size={14} /> Xoá</button>
                </div>
              </>
            )}
          </section>

          {selected && (
            <section>
              <h2>Trạng thái UAV</h2>
              <dl className="telemetry-list">
                <dt>Pin</dt><dd>{telemetry?.battery_pct ?? "-"}%</dd>
                <dt>Tốc độ</dt><dd>{telemetry?.speed_kmh ?? "-"} km/h</dd>
                <dt>Độ cao</dt><dd>{telemetry?.altitude_m ?? "-"} m</dd>
                <dt>Tín hiệu</dt><dd>{telemetry?.signal ?? "-"}</dd>
              </dl>
            </section>
          )}

          {selected && (
            <section className="progress-section">
              <h2>Tiến độ nhiệm vụ</h2>
              <div className="progress-section-body">
                <ProgressRing pct={selected.progress_pct} />
                <div className="progress-section-stats">
                  <div><span className="muted">Waypoints</span><strong>{selected.waypoints_reached}/{selected.waypoints?.length ?? 0}</strong></div>
                  <div><span className="muted">Cảnh báo</span><strong>{alertEvents.length}</strong></div>
                  <div><span className="muted">Còn lại</span><strong>{selected.status === "active" ? timeRemaining(selected.expected_end_at) : "-"}</strong></div>
                </div>
              </div>
            </section>
          )}
        </aside>
      </div>

      <section className="panel wide">
        <h2>Dòng thời gian</h2>
        {!selected && <p className="muted">Chọn 1 nhiệm vụ để xem dòng thời gian</p>}
        {selected && (
          <div className="timeline">
            {safeTimeline.map((e, i) => {
              const EventIcon = EVENT_ICON[e.type] ?? Flag;
              return (
                <div key={i} className={`timeline-item ${e.type}`}>
                  <span className="timeline-icon"><EventIcon size={14} /></span>
                  <span className="timeline-time">{fmtTime(e.time)}</span>
                  <span className="timeline-label">{e.label}</span>
                </div>
              );
            })}
            {safeTimeline.length === 0 && <p className="muted">Chưa có sự kiện nào</p>}
          </div>
        )}
      </section>
    </div>
  );
}
