import { useEffect, useState } from "react";
import {
  Plane,
  Satellite,
  Clock,
  Wrench,
  AlertTriangle,
  X,
  Pencil,
  Gamepad2,
  ArrowDown,
  Play,
  Trash2,
  Eye,
  MapPin,
  Settings,
  MoreVertical,
} from "lucide-react";
import {
  activateUAV,
  createUAV,
  deleteUAV,
  getOverviewStats,
  getUavTelemetry,
  listMissions,
  listUAVs,
  updateUAV,
} from "../api";
import FleetMap from "../components/FleetMap";
import TacticalVideoHUD from "../components/TacticalVideoHUD";

const STATUS_LABEL = { flying: "ĐANG BAY", ready: "SẴN SÀNG", offline: "OFFLINE", maintenance: "BẢO TRÌ" };
const STATUS_CLASS = { flying: "green", ready: "blue", offline: "grey", maintenance: "yellow" };
const SEVERITY_LABEL = { red: "NGUY HIỂM", yellow: "CẢNH BÁO" };
const PAGE_SIZE = 6;
const BASE_LAT = 21.0285; // ponytail: trùng CENTER_LAT/LON giả lập ở backend/telemetry.py — dùng để tính khoảng cách
const BASE_LON = 105.8542;

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function flightDuration(flyingSince) {
  if (!flyingSince) return "-";
  const ms = Date.now() - new Date(flyingSince).getTime();
  if (ms < 0) return "-";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

function SignalBars({ signal }) {
  const level = signal === "Strong" ? 4 : signal === "Weak" ? 2 : 0;
  return (
    <span className="signal-bars">
      {[1, 2, 3, 4].map((i) => (
        <i key={i} className={i <= level ? "on" : ""} />
      ))}
    </span>
  );
}

function PinBar({ pct }) {
  if (pct == null) return <span className="muted">-</span>;
  const level = pct > 50 ? "green" : pct > 20 ? "yellow" : "red";
  return (
    <div className="pin-cell">
      <span>{pct}%</span>
      <div className="progress-bar small"><div className={`progress-fill ${level}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export default function UAVList({ activeUavId, payload, onOpenAlerts }) {
  const [uavs, setUavs] = useState([]);
  const [missions, setMissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [form, setForm] = useState({ name: "", video_source: "", type: "", zone: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [page, setPage] = useState(1);

  async function refresh() {
    const list = await listUAVs();
    const safeList = Array.isArray(list) ? list : [];
    setUavs(safeList);

    const mList = await listMissions();
    setMissions(Array.isArray(mList) ? mList : []);

    setStats(await getOverviewStats());
    if (selectedId == null && safeList.length) setSelectedId(safeList[0].id);
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, [selectedId]);

  useEffect(() => {
    if (selectedId == null) return;
    let cancelled = false;
    async function poll() {
      const t = await getUavTelemetry(selectedId);
      if (!cancelled) setTelemetry(t);
    }
    poll();
    const id = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [selectedId]);

  const safeUavs = Array.isArray(uavs) ? uavs : [];
  const safeMissions = Array.isArray(missions) ? missions : [];

  const selected = safeUavs.find((u) => u.id === selectedId);
  const isLive = selectedId === activeUavId && activeUavId != null;

  async function addUav(e) {
    e.preventDefault();
    if (!form.name || !form.video_source) return;
    await createUAV(form);
    setForm({ name: "", video_source: "", type: "", zone: "" });
    setShowAdd(false);
    refresh();
  }

  async function removeUav(id) {
    await deleteUAV(id);
    if (selectedId === id) setSelectedId(null);
    refresh();
  }

  function startEdit() {
    setEditForm({ status: selected.status, type: selected.type, serial: selected.serial, zone: selected.zone });
    setEditing(true);
  }

  async function saveEdit() {
    await updateUAV(selectedId, editForm);
    setEditing(false);
    refresh();
  }

  async function activate(id) {
    await activateUAV(id);
    refresh();
  }

  const total = safeUavs.length;
  const flying = safeUavs.filter((u) => u.status === "flying").length;
  const ready = safeUavs.filter((u) => u.status === "ready").length;
  const maintenance = safeUavs.filter((u) => u.status === "maintenance").length;
  const offline = safeUavs.filter((u) => u.status === "offline").length;
  const alertCount = stats?.alert_count_24h ?? 0;
  const pct = (n) => (total ? Math.round((n / total) * 1000) / 10 : 0);

  const runningMissions = safeMissions.filter((m) => m.status === "active");

  const pageCount = Math.max(1, Math.ceil(safeUavs.length / PAGE_SIZE));
  const pageItems = safeUavs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const uavGps = isLive ? payload?.uav_status?.gps : telemetry;
  const distanceKm = uavGps ? haversineKm(BASE_LAT, BASE_LON, uavGps.lat, uavGps.lon).toFixed(1) : null;

  return (
    <div className="fleet-page">
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-icon"><Plane size={20} /></div>
          <div className="stat-label">TỔNG UAV</div>
          <div className="stat-value">{total}</div>
          <div className="stat-sub">{total - offline} online · {offline} offline</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Satellite size={20} /></div>
          <div className="stat-label">ĐANG BAY</div>
          <div className="stat-value">{flying}</div>
          <div className="stat-sub">{pct(flying)}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Clock size={20} /></div>
          <div className="stat-label">SẴN SÀNG</div>
          <div className="stat-value">{ready}</div>
          <div className="stat-sub">{pct(ready)}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Wrench size={20} /></div>
          <div className="stat-label">BẢO TRÌ</div>
          <div className="stat-value">{maintenance}</div>
          <div className="stat-sub">{pct(maintenance)}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><AlertTriangle size={20} color="#f87171" /></div>
          <div className="stat-label">CẢNH BÁO</div>
          <div className="stat-value warn">{alertCount}</div>
          {onOpenAlerts && <button className="stat-link" onClick={onOpenAlerts}>Xem chi tiết ›</button>}
        </div>
      </div>

      <div className="fleet-row">
        <section className="panel wide">
          <div className="panel-header">
            <h2>Danh sách UAV</h2>
            <button onClick={() => setShowAdd((s) => !s)}>+ Thêm UAV</button>
          </div>

          {showAdd && (
            <form onSubmit={addUav} className="inline-form">
              <input placeholder="Tên UAV" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <input placeholder="Nguồn video" value={form.video_source} onChange={(e) => setForm({ ...form, video_source: e.target.value })} />
              <input placeholder="Loại (vd. Eagle Pro)" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
              <input placeholder="Khu vực" value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })} />
              <button type="submit">Lưu</button>
            </form>
          )}

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên UAV</th>
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
              {pageItems.map((u) => (
                <UavRow
                  key={u.id}
                  uav={u}
                  isActive={u.id === activeUavId}
                  selected={u.id === selectedId}
                  onSelect={() => setSelectedId(u.id)}
                  onActivate={() => activate(u.id)}
                  onDelete={() => removeUav(u.id)}
                  onFocusMap={() => setSelectedId(u.id)}
                  onEdit={() => { setSelectedId(u.id); startEdit(); }}
                />
              ))}
              {pageItems.length === 0 && (
                <tr><td colSpan={9} className="muted">Chưa có UAV nào</td></tr>
              )}
            </tbody>
          </table>

          <div className="table-footer-pagination">
            <span>Hiển thị {pageItems.length ? (page - 1) * PAGE_SIZE + 1 : 0} đến {(page - 1) * PAGE_SIZE + pageItems.length} của {total} UAV</span>
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹</button>
              <span>{page}</span>
              <button disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>›</button>
            </div>
          </div>
        </section>

        <section className="panel detail-panel">
          <div className="panel-header">
            <h2>Chi tiết UAV</h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {selected && <span className={`badge ${STATUS_CLASS[selected.status]}`}>{STATUS_LABEL[selected.status]}</span>}
              {selected && <button className="icon-close" onClick={() => setSelectedId(null)} title="Đóng"><X size={14} /></button>}
            </div>
          </div>

          {!selected && <p className="muted">Chọn 1 UAV trong danh sách</p>}

          {selected && !editing && (
            <>
              <div className="uav-profile-box">
                <div className="uav-image-preview">
                  <Plane size={32} color="#60a5fa" strokeWidth={1.5} />
                </div>
                <div className="uav-meta">
                  <h3>{selected.name}</h3>
                  <p>{selected.type || "Chưa đặt loại"}</p>
                  <span className={`badge ${STATUS_CLASS[selected.status]}`}>● {STATUS_LABEL[selected.status]}</span>
                </div>
              </div>

              <dl className="telemetry-list">
                <dt>Loại UAV</dt><dd>{selected.type || "-"}</dd>
                <dt>Serial</dt><dd>{selected.serial || "-"}</dd>
                <dt>Trạng thái</dt><dd className={isLive ? "ok" : ""}>{isLive ? "Live" : "Giả lập"}</dd>
                <dt>Thời gian bay</dt><dd>{flightDuration(selected.flying_since)}</dd>
                <dt>Độ cao</dt><dd>{telemetry?.altitude_m ?? "-"} m</dd>
                <dt>Khoảng cách</dt><dd>{distanceKm ?? "-"} km</dd>
                <dt>Pin</dt><dd>{telemetry?.battery_pct ?? "-"}%</dd>
                <dt>Tốc độ</dt><dd>{telemetry?.speed_kmh ?? "-"} km/h</dd>
                <dt>Liên kết</dt><dd><SignalBars signal={telemetry?.signal} /></dd>
                {isLive && <><dt>Độ trễ</dt><dd>{payload?.uav_status?.latency_ms ?? "-"} ms</dd></>}
              </dl>

              <div className="detail-actions">
                {!isLive && <button onClick={() => activate(selected.id)}><Play size={14} /> Theo dõi trực tiếp</button>}
                <button onClick={startEdit}><Pencil size={14} /> Sửa</button>
                <button disabled title="Chưa nối điều khiển bay thật (MAVLink)"><Gamepad2 size={14} /> Điều khiển</button>
                <button disabled title="Chưa nối điều khiển bay thật (MAVLink)">↩ Quay về</button>
                <button disabled title="Chưa nối điều khiển bay thật (MAVLink)"><ArrowDown size={14} /> Hạ cánh</button>
              </div>
            </>
          )}

          {selected && editing && (
            <div className="stacked-form">
              <label>
                Trạng thái
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  <option value="flying">Đang bay</option>
                  <option value="ready">Sẵn sàng</option>
                  <option value="maintenance">Bảo trì</option>
                  <option value="offline">Offline</option>
                </select>
              </label>
              <label>
                Loại UAV
                <input value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} />
              </label>
              <label>
                Serial
                <input value={editForm.serial} onChange={(e) => setEditForm({ ...editForm, serial: e.target.value })} />
              </label>
              <label>
                Khu vực
                <input value={editForm.zone} onChange={(e) => setEditForm({ ...editForm, zone: e.target.value })} />
              </label>
              <div className="detail-actions">
                <button onClick={saveEdit}>Lưu</button>
                <button onClick={() => setEditing(false)}>Huỷ</button>
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="fleet-row">
        <section className="panel wide">
          <h2>Theo dõi trực tiếp {selected ? `- ${selected.name}` : ""} {isLive && <span className="live-dot">● LIVE</span>}</h2>
          <div className="main-video-hud-container">
            <TacticalVideoHUD
              isLive={isLive}
              telemetry={telemetry}
              latencyMs={payload?.uav_status?.latency_ms}
              frameSize={payload?.uav_status}
              objects={payload?.objects ?? []}
            />
          </div>
        </section>

        <section className="panel">
          <h2>Vị trí UAV</h2>
          <FleetMap uavs={safeUavs} onSelect={setSelectedId} />
        </section>
      </div>

      <div className="fleet-row">
        <section className="panel wide">
          <h2>Nhiệm vụ đang thực hiện</h2>
          <table>
            <thead>
              <tr>
                <th>Tên nhiệm vụ</th>
                <th>UAV</th>
                <th>Waypoints</th>
                <th>Tiến độ</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {runningMissions.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{safeUavs.find((u) => u.id === m.uav_id)?.name ?? m.uav_id}</td>
                  <td>{m.waypoints_reached} / {m.waypoints?.length ?? 0}</td>
                  <td>
                    <div className="progress-bar small"><div className="progress-fill" style={{ width: `${m.progress_pct}%` }} /></div>
                  </td>
                  <td><span className="badge green">ĐANG THỰC HIỆN</span></td>
                </tr>
              ))}
              {runningMissions.length === 0 && (
                <tr><td colSpan={5} className="muted">Không có nhiệm vụ nào đang chạy</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="panel">
          <h2>Cảnh báo gần nhất</h2>
          <div className="alert-list">
            {(stats?.recent_alerts ?? []).map((a) => (
              <div key={a.id} className={`alert-card ${a.severity}`}>
                <strong>{SEVERITY_LABEL[a.severity]}</strong>
                <span>{a.class} · {a.distance_m}m · {a.timestamp}</span>
              </div>
            ))}
            {(stats?.recent_alerts ?? []).length === 0 && <p className="muted">Không có cảnh báo</p>}
          </div>
        </section>
      </div>
    </div>
  );
}

function UavRow({ uav, isActive, selected, onSelect, onActivate, onDelete, onFocusMap, onEdit }) {
  const [telemetry, setTelemetry] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getUavTelemetry(uav.id).then((t) => !cancelled && setTelemetry(t));
    const id = setInterval(() => getUavTelemetry(uav.id).then((t) => !cancelled && setTelemetry(t)), 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [uav.id]);

  return (
    <tr className={selected ? "row-selected" : ""}>
      <td>{uav.id}</td>
      <td>{uav.name}</td>
      <td><span className={`badge ${STATUS_CLASS[uav.status]}`}>{STATUS_LABEL[uav.status]}</span></td>
      <td><PinBar pct={telemetry?.battery_pct} /></td>
      <td>{uav.zone || "-"}</td>
      <td>{telemetry?.altitude_m ?? "-"} m</td>
      <td>{telemetry?.speed_kmh ?? "-"} km/h</td>
      <td><SignalBars signal={telemetry?.signal} /></td>
      <td className="row-actions">
        <button onClick={onSelect} title="Xem chi tiết"><Eye size={14} /></button>
        <button onClick={onFocusMap} title="Xem trên bản đồ"><MapPin size={14} /></button>
        <button onClick={onEdit} title="Sửa"><Settings size={14} /></button>
        <span className="row-menu">
          <button onClick={() => setMenuOpen((v) => !v)} title="Thêm"><MoreVertical size={14} /></button>
          {menuOpen && (
            <div className="row-menu-dropdown" onMouseLeave={() => setMenuOpen(false)}>
              {!isActive && <button onClick={() => { onActivate(); setMenuOpen(false); }}><Play size={14} /> Theo dõi trực tiếp</button>}
              {!isActive && <button onClick={() => { onDelete(); setMenuOpen(false); }}><Trash2 size={14} /> Xoá</button>}
              {isActive && <span className="muted">Đang giám sát trực tiếp</span>}
            </div>
          )}
        </span>
      </td>
    </tr>
  );
}
