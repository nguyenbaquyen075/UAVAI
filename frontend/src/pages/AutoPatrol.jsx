import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Bot, Pause, Play, Home, Hand, Radar, Route, Battery, Gauge, Mountain, Compass, AlertTriangle } from "lucide-react";
import { autopilotCommand, autopilotList, autopilotSimulateThreat, autopilotStart, autopilotStop, listMissions, listUAVs } from "../api";

const BASE = [21.0285, 105.8542];
// Màu trạng thái luôn đi kèm nhãn chữ
const MODE = {
  patrol: ["Đang tuần tra", "#22c55e"],
  investigate: ["Quan sát mục tiêu", "#ef4444"],
  rtb: ["Đang về căn cứ", "#f59e0b"],
  hold: ["Tạm dừng", "#38bdf8"],
  landed: ["Đã hạ cánh", "#94a3b8"],
};
const MANUAL = ["Điều khiển tay", "#64748b"];
const EVENT_COLOR = { threat: "#ef4444", orbit: "#ef4444", battery: "#f59e0b", ignored: "#94a3b8", operator: "#38bdf8" };

const fmtClock = (iso) => new Date(iso).toLocaleTimeString("vi-VN", { hour12: false });

function PatrolMap({ states, selectedId, onSelect }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const fittedRef = useRef(null);

  useEffect(() => {
    const map = L.map(ref.current, { zoomControl: false, attributionControl: false }).setView(BASE, 14);
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, maxNativeZoom: 18 }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.marker(BASE, {
      icon: L.divIcon({ className: "", html: `<div class="ap-base">⌂ Căn cứ</div>`, iconSize: null, iconAnchor: [10, 10] }),
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    states.forEach((s) => {
      const sel = s.uav_id === selectedId;
      const [label, color] = MODE[s.mode] || MANUAL;
      const route = s.route.map((p) => [p.lat, p.lon]);
      const [g0, g1] = s.geofence;
      L.rectangle([[g0.lat, g0.lon], [g1.lat, g1.lon]], { color: "#facc15", weight: 1, dashArray: "6 6", fill: false, opacity: sel ? 0.8 : 0.3, interactive: false }).addTo(layer);
      L.polyline([...route, route[0]], { color: "#22c55e", weight: sel ? 3 : 2, opacity: sel ? 0.95 : 0.45 }).addTo(layer);
      route.forEach((p, i) =>
        L.circleMarker(p, {
          radius: i === s.waypoint_index ? 7 : 5,
          color: "#0f172a",
          weight: 2,
          fillColor: i === s.waypoint_index ? "#facc15" : "#22c55e",
          fillOpacity: 1,
        })
          .bindTooltip(`Điểm ${i + 1}${i === s.waypoint_index ? " (đang tới)" : ""}`)
          .addTo(layer)
      );
      if (s.investigation) {
        const c = [s.investigation.lat, s.investigation.lon];
        L.circle(c, { radius: s.investigation.radius_m, color: "#ef4444", weight: 2, dashArray: "4 4", fillOpacity: 0.08 }).addTo(layer);
        L.marker(c, { icon: L.divIcon({ className: "", html: `<div class="ap-threat">!</div>`, iconSize: [22, 22], iconAnchor: [11, 11] }) })
          .bindTooltip("Mục tiêu nguy hiểm")
          .addTo(layer);
      }
      const t = s.telemetry;
      L.marker([t.lat, t.lon], {
        icon: L.divIcon({
          className: "",
          html: `<div class="ap-uav ${sel ? "sel" : ""}" style="--c:${color}"><span class="ap-arrow" style="transform:rotate(${t.heading_deg}deg)">▲</span>${s.name}</div>`,
          iconSize: null,
          iconAnchor: [10, 10],
        }),
        zIndexOffset: sel ? 1000 : 0,
      })
        .bindTooltip(`${s.name} · ${label} · Pin ${Math.round(t.battery_pct)}%`)
        .on("click", () => onSelect(s.uav_id))
        .addTo(layer);
    });

    // Căn khung bản đồ theo lộ trình của UAV đang chọn (1 lần mỗi khi đổi UAV)
    const sel = states.find((s) => s.uav_id === selectedId);
    if (sel && fittedRef.current !== selectedId) {
      const [g0, g1] = sel.geofence;
      mapRef.current.fitBounds([[g0.lat, g0.lon], [g1.lat, g1.lon], [sel.telemetry.lat, sel.telemetry.lon]], { padding: [30, 30] });
      fittedRef.current = selectedId;
    }
  }, [states, selectedId]);

  return <div ref={ref} className="ap-map" />;
}

export default function AutoPatrol() {
  const [uavs, setUavs] = useState([]);
  const [missions, setMissions] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ mission_id: "", altitude_m: 100, speed_kmh: 43 });
  const [msg, setMsg] = useState(null); // {type: "error"|"ok", text}
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const loadStatic = () =>
      Promise.all([listUAVs(), listMissions()]).then(([u, m]) => {
        setUavs(Array.isArray(u) ? u : []);
        setMissions((Array.isArray(m) ? m : []).filter((x) => (x.waypoints || []).length >= 2));
      });
    const loadStates = () => autopilotList().then(setStates).catch(() => {});
    loadStatic();
    loadStates();
    const a = setInterval(loadStates, 1000); // vị trí tự lái cập nhật mỗi giây
    const b = setInterval(loadStatic, 5000);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, []);

  useEffect(() => {
    if (selectedId == null && uavs.length) setSelectedId(uavs.find((u) => u.status === "flying")?.id ?? uavs[0].id);
  }, [uavs, selectedId]);
  useEffect(() => {
    if (!form.mission_id && missions.length) setForm((f) => ({ ...f, mission_id: missions[0].id }));
  }, [missions]);

  const named = states.map((s) => ({ ...s, name: uavs.find((u) => u.id === s.uav_id)?.name || `UAV #${s.uav_id}` }));
  const selUav = uavs.find((u) => u.id === selectedId);
  const sel = named.find((s) => s.uav_id === selectedId);
  const missionName = (id) => missions.find((m) => m.id === id)?.name || `Nhiệm vụ #${id}`;

  async function act(fn, okText) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      if (okText) setMsg({ type: "ok", text: okText });
      setStates(await autopilotList());
    } catch (e) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setBusy(false);
    }
  }

  const start = () =>
    act(
      () => autopilotStart(selectedId, { mission_id: Number(form.mission_id), altitude_m: Number(form.altitude_m), speed_kmh: Number(form.speed_kmh) }),
      `${selUav?.name} bắt đầu tự tuần tra`
    );
  const command = (action, text) => act(() => autopilotCommand(selectedId, action), text);
  const toManual = () => {
    if (confirm(`Tắt tự lái ${selUav?.name} và chuyển sang điều khiển tay?`)) act(() => autopilotStop(selectedId), `${selUav?.name} đã chuyển sang điều khiển tay`);
  };

  const blocked = selUav && ["maintenance", "offline"].includes(selUav.status);
  const [modeLabel, modeColor] = sel ? MODE[sel.mode] : MANUAL;

  return (
    <div className="ap-page">
      <div className="ap-grid">
        {/* Danh sách UAV */}
        <section className="dashboard-panel ap-list">
          <div className="panel-section-header">
            <h3 className="section-title">ĐỘI UAV</h3>
            <span className="ap-count">{states.length} đang tự lái</span>
          </div>
          {uavs.map((u) => {
            const s = named.find((x) => x.uav_id === u.id);
            const [label, color] = s ? MODE[s.mode] : MANUAL;
            return (
              <button key={u.id} className={`ap-uav-row ${u.id === selectedId ? "active" : ""}`} onClick={() => setSelectedId(u.id)}>
                <span className="ap-uav-name">
                  {s && <Bot size={13} color="#4ade80" />}
                  <strong>{u.name}</strong>
                  <small>{u.type}</small>
                </span>
                <span className="ov-pill" style={{ color, borderColor: color }}>
                  {["maintenance", "offline"].includes(u.status) ? (u.status === "offline" ? "Offline" : "Bảo trì") : label}
                </span>
              </button>
            );
          })}
        </section>

        {/* Bản đồ */}
        <section className="dashboard-panel ap-map-panel">
          <div className="panel-section-header">
            <h3 className="section-title">BẢN ĐỒ TỰ TUẦN TRA</h3>
            <div className="ap-legend">
              <span><i style={{ background: "#22c55e" }} /> Lộ trình</span>
              <span><i style={{ background: "#facc15" }} /> Điểm đang tới</span>
              <span><i className="dash" /> Vùng tuần tra</span>
              <span><i style={{ background: "#ef4444" }} /> Vùng quan sát mục tiêu</span>
            </div>
          </div>
          <PatrolMap states={named} selectedId={selectedId} onSelect={setSelectedId} />
          {states.length === 0 && <div className="ap-map-hint">Chưa có UAV nào tự lái — chọn UAV bên trái và bấm "Bắt đầu tự tuần tra"</div>}
        </section>

        {/* Bảng điều khiển */}
        <section className="dashboard-panel ap-control">
          <div className="panel-section-header">
            <h3 className="section-title">{selUav?.name || "—"}</h3>
            <span className="ov-pill" style={{ color: modeColor, borderColor: modeColor }}>
              {modeLabel}
            </span>
          </div>

          {msg && <div className={`ap-msg ${msg.type}`}>{msg.text}</div>}

          {!sel ? (
            <div className="ap-form">
              {blocked ? (
                <p className="ap-note">UAV đang {selUav.status === "offline" ? "offline" : "bảo trì"} — không thể bật tự lái.</p>
              ) : (
                <>
                  <label>
                    Lộ trình tuần tra (theo nhiệm vụ)
                    <select value={form.mission_id} onChange={(e) => setForm({ ...form, mission_id: e.target.value })}>
                      {missions.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.waypoints.length} điểm)
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="ap-form-row">
                    <label>
                      Độ cao (m)
                      <input type="number" min="30" max="400" value={form.altitude_m} onChange={(e) => setForm({ ...form, altitude_m: e.target.value })} />
                    </label>
                    <label>
                      Tốc độ (km/h)
                      <input type="number" min="10" max="90" value={form.speed_kmh} onChange={(e) => setForm({ ...form, speed_kmh: e.target.value })} />
                    </label>
                  </div>
                  <ul className="ap-rules">
                    <li><Route size={12} /> Bay lặp lại các điểm của lộ trình</li>
                    <li><Radar size={12} /> AI thấy mục tiêu nguy hiểm trong vùng → bay vòng quan sát 45 giây rồi quay lại lộ trình</li>
                    <li><Battery size={12} /> Pin dưới 25% → tự về căn cứ, sạc đủ 95% tự bay tiếp</li>
                  </ul>
                  <button className="ap-btn primary" disabled={busy || !form.mission_id} onClick={start}>
                    <Bot size={16} /> Bắt đầu tự tuần tra
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="ap-stats">
                <div><Route size={13} /> Điểm {sel.waypoint_index + 1}/{sel.waypoint_total} · vòng {sel.laps}</div>
                <div><Battery size={13} /> {Math.round(sel.telemetry.battery_pct)}%</div>
                <div><Mountain size={13} /> {sel.telemetry.altitude_m} m</div>
                <div><Gauge size={13} /> {sel.telemetry.speed_kmh} km/h</div>
                <div><Compass size={13} /> {sel.telemetry.heading_deg}°</div>
              </div>
              <div className="ap-mission">Lộ trình: {missionName(sel.mission_id)}</div>
              {sel.investigation && (
                <div className="ap-alert">
                  <AlertTriangle size={14} />
                  {sel.investigation.seconds_left == null ? "Đang bay tới mục tiêu" : `Đang bay vòng quan sát — còn ${sel.investigation.seconds_left} giây`}
                </div>
              )}
              {sel.mode === "landed" && sel.resume_after_charge && <div className="ap-note">Đang sạc — đủ 95% sẽ tự cất cánh tuần tra tiếp.</div>}

              <div className="ap-actions">
                {sel.mode === "hold" || sel.mode === "landed" ? (
                  <button className="ap-btn" disabled={busy} onClick={() => command("resume", "Tiếp tục tuần tra")}>
                    <Play size={15} /> Tiếp tục
                  </button>
                ) : (
                  <button className="ap-btn" disabled={busy || sel.mode === "rtb"} onClick={() => command("pause", "Đã tạm dừng, giữ vị trí")}>
                    <Pause size={15} /> Tạm dừng
                  </button>
                )}
                <button className="ap-btn warn" disabled={busy || sel.mode === "rtb" || sel.mode === "landed"} onClick={() => command("rtb", "Đang về căn cứ")}>
                  <Home size={15} /> Về căn cứ
                </button>
                <button className="ap-btn danger" disabled={busy} onClick={toManual}>
                  <Hand size={15} /> Điều khiển tay
                </button>
              </div>
              <button className="ap-btn ghost" disabled={busy || sel.mode !== "patrol"} onClick={() => act(() => autopilotSimulateThreat(selectedId), "Đã giả lập 1 mục tiêu nguy hiểm trên lộ trình")} title="Dùng để thử khi YOLO đang tắt">
                <Radar size={14} /> Giả lập phát hiện mục tiêu (thử)
              </button>

              <div className="ap-events">
                <span className="ov-stat-title">Nhật ký tự lái</span>
                {sel.events.map((e, i) => (
                  <div key={i} className="ap-event">
                    <span className="ap-event-time">{fmtClock(e.time)}</span>
                    <i style={{ background: EVENT_COLOR[e.kind] || "#22c55e" }} />
                    <span className="ap-event-text" title={e.text}>{e.text}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
