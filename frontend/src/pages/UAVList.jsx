import { useEffect, useState } from "react";
import {
  API_BASE,
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

const STATUS_LABEL = { flying: "ĐANG BAY", ready: "SẴN SÀNG", offline: "OFFLINE", maintenance: "BẢO TRÌ" };
const STATUS_CLASS = { flying: "green", ready: "blue", offline: "grey", maintenance: "yellow" };
const SEVERITY_LABEL = { red: "NGUY HIỂM", yellow: "CẢNH BÁO" };

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

export default function UAVList({ activeUavId, payload }) {
  const [uavs, setUavs] = useState([]);
  const [missions, setMissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [telemetry, setTelemetry] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [form, setForm] = useState({ name: "", video_source: "", type: "", zone: "" });
  const [showAdd, setShowAdd] = useState(false);

  async function refresh() {
    const list = await listUAVs();
    setUavs(list);
    setMissions(await listMissions());
    setStats(await getOverviewStats());
    if (selectedId == null && list.length) setSelectedId(list[0].id);
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

  const selected = uavs.find((u) => u.id === selectedId);
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

  const total = uavs.length;
  const flying = uavs.filter((u) => u.status === "flying").length;
  const ready = uavs.filter((u) => u.status === "ready").length;
  const maintenance = uavs.filter((u) => u.status === "maintenance").length;
  const offline = uavs.filter((u) => u.status === "offline").length;
  const alertCount = stats?.alert_count_24h ?? 0;

  const runningMissions = missions.filter((m) => m.status === "active");

  return (
    <div className="fleet-page">
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-icon">🛸</div>
          <div className="stat-label">TỔNG UAV</div>
          <div className="stat-value">{total}</div>
          <div className="stat-sub">{total - offline} online · {offline} offline</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🛰️</div>
          <div className="stat-label">ĐANG BAY</div>
          <div className="stat-value">{flying}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-label">SẴN SÀNG</div>
          <div className="stat-value">{ready}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔧</div>
          <div className="stat-label">BẢO TRÌ</div>
          <div className="stat-value">{maintenance}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-label">CẢNH BÁO</div>
          <div className="stat-value warn">{alertCount}</div>
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
                <th>Khu vực</th>
                <th>Độ cao</th>
                <th>Tốc độ</th>
                <th>Liên kết</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {uavs.map((u) => (
                <UavRow
                  key={u.id}
                  uav={u}
                  isActive={u.id === activeUavId}
                  selected={u.id === selectedId}
                  onSelect={() => setSelectedId(u.id)}
                  onActivate={() => activate(u.id)}
                  onDelete={() => removeUav(u.id)}
                />
              ))}
              {uavs.length === 0 && (
                <tr><td colSpan={8} className="muted">Chưa có UAV nào</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="panel detail-panel">
          <div className="panel-header">
            <h2>Chi tiết UAV</h2>
            {selected && <span className={`badge ${STATUS_CLASS[selected.status]}`}>{STATUS_LABEL[selected.status]}</span>}
          </div>

          {!selected && <p className="muted">Chọn 1 UAV trong danh sách</p>}

          {selected && !editing && (
            <>
              <div className="uav-hero">🛸</div>
              <h3>{selected.name}</h3>
              <p className="muted">{selected.type || "Chưa đặt loại"} · {selected.serial || "-"}</p>

              <dl className="telemetry-list">
                <dt>Trạng thái</dt><dd className={isLive ? "ok" : ""}>{isLive ? "Live" : "Giả lập"}</dd>
                <dt>Pin</dt><dd>{telemetry?.battery_pct ?? "-"}%</dd>
                <dt>Độ cao</dt><dd>{telemetry?.altitude_m ?? "-"} m</dd>
                <dt>Tốc độ</dt><dd>{telemetry?.speed_kmh ?? "-"} km/h</dd>
                <dt>Liên kết</dt><dd><SignalBars signal={telemetry?.signal} /></dd>
                {isLive && <><dt>Độ trễ</dt><dd>{payload?.uav_status?.latency_ms ?? "-"} ms</dd></>}
              </dl>

              <div className="detail-actions">
                {!isLive && <button onClick={() => activate(selected.id)}>▶ Theo dõi trực tiếp</button>}
                <button onClick={startEdit}>✎ Sửa</button>
                <button disabled title="Chưa nối điều khiển bay thật (MAVLink)">🕹 Điều khiển</button>
                <button disabled title="Chưa nối điều khiển bay thật (MAVLink)">↩ Quay về</button>
                <button disabled title="Chưa nối điều khiển bay thật (MAVLink)">⬇ Hạ cánh</button>
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
          <div className="video-frame small">
            <img className="video" src={`${API_BASE}/video`} alt="UAV live feed" />
            <div className="crosshair" />
            {!isLive && <div className="video-note">Chưa kích hoạt giám sát trực tiếp cho UAV này</div>}
          </div>
        </section>

        <section className="panel">
          <h2>Vị trí UAV</h2>
          <FleetMap uavs={uavs} onSelect={setSelectedId} />
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
                  <td>{uavs.find((u) => u.id === m.uav_id)?.name ?? m.uav_id}</td>
                  <td>{m.waypoints_reached} / {m.waypoints.length}</td>
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

function UavRow({ uav, isActive, selected, onSelect, onActivate, onDelete }) {
  const [telemetry, setTelemetry] = useState(null);

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
      <td>{uav.zone || "-"}</td>
      <td>{telemetry?.altitude_m ?? "-"} m</td>
      <td>{telemetry?.speed_kmh ?? "-"} km/h</td>
      <td><SignalBars signal={telemetry?.signal} /></td>
      <td className="row-actions">
        <button onClick={onSelect} title="Xem chi tiết">👁</button>
        {!isActive && <button onClick={onActivate} title="Theo dõi trực tiếp">▶</button>}
        {!isActive && <button onClick={onDelete} title="Xoá">🗑</button>}
      </td>
    </tr>
  );
}
