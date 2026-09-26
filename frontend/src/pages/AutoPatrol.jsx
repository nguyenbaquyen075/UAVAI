import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Bot, Pause, Play, Home, Hand, Radar, Route, Battery, Gauge, Mountain, AlertTriangle, PenLine, Undo2, Trash2, X } from "lucide-react";
import { autopilotCommand, autopilotList, autopilotSimulateThreat, autopilotStart, autopilotStop, listMissions, listUAVs } from "../api";
import { LiveFrame } from "./MultiMonitor";

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
const EVENT_COLOR = { threat: "#ef4444", orbit: "#ef4444", battery: "#f59e0b", ignored: "#94a3b8", operator: "#38bdf8", done: "#f59e0b" };
const DRAFT_COLOR = "#22d3ee";
const MAX_POINTS = 100;

const fmtClock = (iso) => new Date(iso).toLocaleTimeString("vi-VN", { hour12: false });

// Tổng chiều dài đường bay (m); lặp lại thì tính cả đoạn khép vòng về điểm đầu
function routeLengthM(points, loop) {
  const ll = points.map((p) => L.latLng(p.lat, p.lon));
  let m = ll.slice(1).reduce((sum, p, i) => sum + ll[i].distanceTo(p), 0);
  if (loop && ll.length > 2) m += ll[ll.length - 1].distanceTo(ll[0]);
  return m;
}

function fmtDuration(s) {
  const m = Math.round(s / 60);
  return m < 60 ? `${m} phút` : `${Math.floor(m / 60)} giờ ${m % 60} phút`;
}

const INTERP_MS = 1000; // khớp nhịp cập nhật vị trí 1 giây -> UAV trượt đều giữa 2 lần cập nhật
const TRAIL_POINTS = 90;  // vệt đường đã bay ~1,5 phút gần nhất

// Biểu tượng drone nhìn từ trên xuống: mũi hướng lên = hướng bắc, xoay theo heading; cánh quạt quay bằng CSS
const DRONE_SVG = `<svg viewBox="-22 -22 44 44" width="36" height="36" aria-hidden="true">
  <g class="apd-arms"><line x1="-13" y1="-13" x2="13" y2="13"/><line x1="13" y1="-13" x2="-13" y2="13"/></g>
  ${[[-13, -13], [13, -13], [13, 13], [-13, 13]]
    .map(([x, y]) => `<g transform="translate(${x} ${y})"><circle r="7" class="apd-ring"/><g class="apd-rotor"><line x1="-6" y1="0" x2="6" y2="0"/></g></g>`)
    .join("")}
  <rect x="-6" y="-7" width="12" height="14" rx="4" class="apd-core"/>
  <path d="M0 -15 L5 -8 L-5 -8 Z" class="apd-nose"/>
</svg>`;

function droneIcon(name) {
  return L.divIcon({
    className: "",
    html: `<div class="apd"><span class="apd-halo"></span><span class="apd-body">${DRONE_SVG}</span><span class="apd-label">${name}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

const lerp = (a, b, t) => a + (b - a) * t;
const metersPerPixel = (lat, zoom) => (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;

function PatrolMap({ states, selectedId, onSelect, drawing, draft, onDraftChange, loop }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const staticLayerRef = useRef(null);
  const trailLayerRef = useRef(null);
  const draftLayerRef = useRef(null);
  const dronesRef = useRef(new Map()); // uav_id -> {marker, from, to, t0, angle}
  const trailsRef = useRef(new Map()); // uav_id -> [[lat, lon], ...]
  const staticKeyRef = useRef("");
  const fittedRef = useRef(null);
  const [zoom, setZoom] = useState(14);
  const drawRef = useRef({});
  drawRef.current = { drawing, draft, onDraftChange, onSelect };

  useEffect(() => {
    const map = L.map(ref.current, { zoomControl: false, attributionControl: false, doubleClickZoom: false }).setView(BASE, 14);
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 19, maxNativeZoom: 18 }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.marker(BASE, {
      icon: L.divIcon({ className: "", html: `<div class="ap-base"><span class="ap-base-pulse"></span>⌂ Căn cứ</div>`, iconSize: null, iconAnchor: [10, 10] }),
    }).addTo(map);
    trailLayerRef.current = L.layerGroup().addTo(map);
    staticLayerRef.current = L.layerGroup().addTo(map);
    draftLayerRef.current = L.layerGroup().addTo(map);
    // Chế độ vẽ: click lên bản đồ để thêm điểm
    map.on("click", (e) => {
      const { drawing, draft, onDraftChange } = drawRef.current;
      if (!drawing || draft.length >= MAX_POINTS) return;
      onDraftChange([...draft, { lat: e.latlng.lat, lon: e.latlng.lng }]);
    });
    map.on("zoomend", () => setZoom(map.getZoom()));
    mapRef.current = map;

    // Vòng hoạt hình: trượt drone từ vị trí cũ tới vị trí mới trong INTERP_MS
    let raf;
    const animate = () => {
      const now = performance.now();
      dronesRef.current.forEach((d) => {
        const t = Math.min(1, (now - d.t0) / INTERP_MS);
        d.marker.setLatLng([lerp(d.from[0], d.to[0], t), lerp(d.from[1], d.to[1], t)]);
      });
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(raf);
      map.remove();
    };
  }, []);

  // Drone: giữ 1 marker cho mỗi UAV, chỉ đổi đích/hướng/màu (không tạo lại -> không giật)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const alive = new Set();
    states.forEach((s) => {
      alive.add(s.uav_id);
      const t = s.telemetry;
      const to = [t.lat, t.lon];
      let d = dronesRef.current.get(s.uav_id);
      if (!d) {
        const marker = L.marker(to, { icon: droneIcon(s.name) })
          .on("click", () => !drawRef.current.drawing && drawRef.current.onSelect(s.uav_id))
          .addTo(map);
        d = { marker, from: to, to, t0: performance.now(), angle: t.heading_deg };
        dronesRef.current.set(s.uav_id, d);
      } else {
        const cur = d.marker.getLatLng();
        Object.assign(d, { from: [cur.lat, cur.lng], to, t0: performance.now() });
        d.angle += ((t.heading_deg - (d.angle % 360) + 540) % 360) - 180; // xoay theo đường ngắn nhất
      }
      const [label, color] = MODE[s.mode] || MANUAL;
      const el = d.marker.getElement()?.querySelector(".apd");
      if (el) {
        el.className = `apd m-${s.mode}${s.uav_id === selectedId ? " sel" : ""}`;
        el.style.setProperty("--c", color);
        el.querySelector(".apd-body").style.transform = `rotate(${d.angle}deg)`;
      }
      d.marker.setZIndexOffset(s.uav_id === selectedId ? 1000 : 0);
      d.marker.unbindTooltip().bindTooltip(`${s.name} · ${label} · Pin ${Math.round(t.battery_pct)}% · ${t.altitude_m} m`, { direction: "top", offset: [0, -16] });

      const trail = trailsRef.current.get(s.uav_id) || [];
      const last = trail[trail.length - 1];
      if (!last || last[0] !== to[0] || last[1] !== to[1]) trail.push(to);
      trailsRef.current.set(s.uav_id, trail.slice(-TRAIL_POINTS));
    });
    dronesRef.current.forEach((d, id) => {
      if (!alive.has(id)) {
        d.marker.remove();
        dronesRef.current.delete(id);
        trailsRef.current.delete(id);
      }
    });

    // Vệt đã bay: chia khúc, khúc cũ mờ dần
    const trailLayer = trailLayerRef.current;
    trailLayer.clearLayers();
    trailsRef.current.forEach((pts, id) => {
      const color = (MODE[states.find((s) => s.uav_id === id)?.mode] || MANUAL)[1];
      const chunk = Math.max(2, Math.ceil(pts.length / 6));
      for (let i = 0; i < pts.length - 1; i += chunk - 1) {
        const seg = pts.slice(i, i + chunk);
        if (seg.length > 1) L.polyline(seg, { color, weight: 3, opacity: 0.12 + 0.6 * (i / pts.length), interactive: false }).addTo(trailLayer);
      }
    });
  }, [states, selectedId]);

  // Lớp tĩnh: vùng tuần tra, đường bay (vạch chạy theo chiều bay), điểm bay, vùng quan sát + tia radar.
  // Chỉ vẽ lại khi có thay đổi thật -> hiệu ứng CSS không bị khởi động lại mỗi giây.
  useEffect(() => {
    const layer = staticLayerRef.current;
    if (!layer) return;
    const key = JSON.stringify([
      states.map((s) => [s.uav_id, s.route, s.waypoint_index, s.on_finish, s.investigation && [s.investigation.lat, s.investigation.lon]]),
      selectedId,
      drawing,
      zoom,
    ]);
    if (key === staticKeyRef.current) return;
    staticKeyRef.current = key;
    layer.clearLayers();
    states.forEach((s) => {
      const sel = s.uav_id === selectedId;
      const faded = drawing && sel; // đang vẽ đường mới cho UAV này -> làm mờ đường cũ
      const route = s.route.map((p) => [p.lat, p.lon]);
      const path = s.on_finish === "loop" ? [...route, route[0]] : route;
      const [g0, g1] = s.geofence;
      L.rectangle([[g0.lat, g0.lon], [g1.lat, g1.lon]], { color: "#facc15", weight: 1, dashArray: "6 6", fill: false, opacity: sel && !faded ? 0.8 : 0.3, interactive: false }).addTo(layer);
      L.polyline(path, { color: "#22c55e", weight: sel ? 5 : 3, opacity: faded ? 0.15 : sel ? 0.35 : 0.2, interactive: false }).addTo(layer);
      L.polyline(path, { color: "#bbf7d0", weight: sel ? 2 : 1.5, opacity: faded ? 0.2 : sel ? 0.95 : 0.5, interactive: false, className: "ap-route-flow" }).addTo(layer);
      route.forEach((p, i) => {
        const next = i === s.waypoint_index;
        if (next && !faded) {
          L.marker(p, { icon: L.divIcon({ className: "", html: `<div class="ap-wp-next"></div>`, iconSize: [28, 28], iconAnchor: [14, 14] }), interactive: false }).addTo(layer);
        }
        L.circleMarker(p, { radius: next ? 7 : 5, color: "#0f172a", weight: 2, fillColor: next ? "#facc15" : "#22c55e", fillOpacity: faded ? 0.3 : 1, interactive: !drawing })
          .bindTooltip(`Điểm ${i + 1}${next ? " (đang tới)" : ""}`)
          .addTo(layer);
      });
      if (s.investigation) {
        const c = [s.investigation.lat, s.investigation.lon];
        const px = Math.round((2 * s.investigation.radius_m) / metersPerPixel(c[0], zoom));
        L.circle(c, { radius: s.investigation.radius_m, color: "#ef4444", weight: 2, dashArray: "4 4", fillOpacity: 0.06, interactive: false }).addTo(layer);
        L.marker(c, { icon: L.divIcon({ className: "", html: `<div class="ap-radar" style="width:${px}px;height:${px}px"></div>`, iconSize: [px, px], iconAnchor: [px / 2, px / 2] }), interactive: false }).addTo(layer);
        L.marker(c, { icon: L.divIcon({ className: "", html: `<div class="ap-threat">!</div>`, iconSize: [22, 22], iconAnchor: [11, 11] }) })
          .bindTooltip("Mục tiêu nguy hiểm")
          .addTo(layer);
      }
    });

    // Căn khung theo lộ trình UAV đang chọn (1 lần mỗi khi đổi UAV; không căn lại khi đang vẽ)
    const sel = states.find((s) => s.uav_id === selectedId);
    if (sel && fittedRef.current !== selectedId && !drawing) {
      const [g0, g1] = sel.geofence;
      mapRef.current.fitBounds([[g0.lat, g0.lon], [g1.lat, g1.lon], [sel.telemetry.lat, sel.telemetry.lon]], { padding: [30, 30] });
      fittedRef.current = selectedId;
    }
  }, [states, selectedId, drawing, zoom]);

  // Đường đang vẽ: điểm đánh số, kéo để sửa vị trí
  useEffect(() => {
    const layer = draftLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!drawing) return;
    const pts = draft.map((p) => [p.lat, p.lon]);
    if (pts.length > 1) {
      L.polyline(loop && pts.length > 2 ? [...pts, pts[0]] : pts, { color: DRAFT_COLOR, weight: 3, dashArray: "8 6", className: "ap-route-flow draft" }).addTo(layer);
    }
    draft.forEach((p, i) => {
      L.marker([p.lat, p.lon], {
        draggable: true,
        icon: L.divIcon({ className: "", html: `<div class="ap-draft-pt">${i + 1}</div>`, iconSize: [22, 22], iconAnchor: [11, 11] }),
        zIndexOffset: 2000,
      })
        .bindTooltip(i === 0 ? "Điểm đầu — kéo để sửa" : "Kéo để sửa vị trí")
        .on("dragend", (e) => {
          const { draft, onDraftChange } = drawRef.current;
          const { lat, lng } = e.target.getLatLng();
          onDraftChange(draft.map((q, j) => (j === i ? { lat, lon: lng } : q)));
        })
        .addTo(layer);
    });
  }, [drawing, draft, loop]);

  useEffect(() => {
    ref.current?.classList.toggle("ap-drawing", !!drawing);
  }, [drawing]);

  return <div ref={ref} className="ap-map" />;
}

// Vòng đo pin nhỏ (màu theo mức, luôn kèm số %)
function BatteryRing({ pct }) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const color = pct < 25 ? "#ef4444" : pct < 50 ? "#f59e0b" : "#22c55e";
  return (
    <div className="ap-batt" title={`Pin ${Math.round(pct)}%`}>
      <svg width="42" height="42" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r={r} className="ap-batt-track" />
        <circle cx="21" cy="21" r={r} stroke={color} className="ap-batt-fill" strokeDasharray={`${(pct / 100) * c} ${c}`} transform="rotate(-90 21 21)" />
      </svg>
      <span>{Math.round(pct)}%</span>
    </div>
  );
}

export default function AutoPatrol() {
  const [uavs, setUavs] = useState([]);
  const [missions, setMissions] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ source: "draw", mission_id: "", altitude_m: 100, speed_kmh: 43, on_finish: "loop" });
  const [draft, setDraft] = useState([]);
  const [rerouting, setRerouting] = useState(false); // UAV đang tự lái: mở form vẽ đường mới
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

  const selectUav = (id) => {
    setSelectedId(id);
    setRerouting(false);
    setMsg(null);
  };

  const named = states.map((s) => ({ ...s, name: uavs.find((u) => u.id === s.uav_id)?.name || `UAV #${s.uav_id}` }));
  const selUav = uavs.find((u) => u.id === selectedId);
  const sel = named.find((s) => s.uav_id === selectedId);
  const missionName = (id) => missions.find((m) => m.id === id)?.name || `Nhiệm vụ #${id}`;
  const showForm = !sel || rerouting;
  const drawing = showForm && form.source === "draw" && !!selUav && !["maintenance", "offline"].includes(selUav.status);

  async function act(fn, okText) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      if (okText) setMsg({ type: "ok", text: okText });
      setStates(await autopilotList());
      return true;
    } catch (e) {
      setMsg({ type: "error", text: e.message });
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    const opts = { altitude_m: Number(form.altitude_m), speed_kmh: Number(form.speed_kmh), on_finish: form.on_finish };
    if (form.source === "draw") opts.route = draft;
    else opts.mission_id = Number(form.mission_id);
    const ok = await act(() => autopilotStart(selectedId, opts), rerouting ? `${selUav?.name} chuyển sang bay theo đường mới` : `${selUav?.name} bắt đầu tự tuần tra`);
    if (ok) {
      setRerouting(false);
      setDraft([]);
    }
  }
  const command = (action, text) => act(() => autopilotCommand(selectedId, action), text);
  const toManual = () => {
    if (confirm(`Tắt tự lái ${selUav?.name} và chuyển sang điều khiển tay?`)) act(() => autopilotStop(selectedId), `${selUav?.name} đã chuyển sang điều khiển tay`);
  };

  const blocked = selUav && ["maintenance", "offline"].includes(selUav.status);
  const [modeLabel, modeColor] = sel ? MODE[sel.mode] : MANUAL;
  const loop = form.on_finish === "loop";
  const lengthM = routeLengthM(draft, loop);
  const canStart = form.source === "draw" ? draft.length >= 2 : !!form.mission_id;

  // Tiến độ tới điểm kế tiếp: khoảng cách còn lại, % chặng, thời gian dự kiến
  let nextWp = null;
  if (sel && sel.mode === "patrol") {
    const r = sel.route;
    const here = L.latLng(sel.telemetry.lat, sel.telemetry.lon);
    const to = L.latLng(r[sel.waypoint_index].lat, r[sel.waypoint_index].lon);
    const prevIdx = (sel.waypoint_index - 1 + r.length) % r.length;
    const leg = L.latLng(r[prevIdx].lat, r[prevIdx].lon).distanceTo(to) || 1;
    const left = here.distanceTo(to);
    const mps = sel.telemetry.speed_kmh / 3.6 || 1;
    nextWp = { n: sel.waypoint_index + 1, left, pct: Math.max(0, Math.min(100, 100 - (left / leg) * 100)), eta: left / mps };
  }
  const modeCounts = named.reduce((acc, s) => ({ ...acc, [s.mode]: (acc[s.mode] || 0) + 1 }), {});

  const routeForm = (
    <div className="ap-form">
      <div className="ap-seg" role="tablist">
        <button role="tab" className={form.source === "draw" ? "on" : ""} onClick={() => setForm({ ...form, source: "draw" })}>
          <PenLine size={13} /> Vẽ đường bay
        </button>
        <button role="tab" className={form.source === "mission" ? "on" : ""} onClick={() => setForm({ ...form, source: "mission" })}>
          <Route size={13} /> Theo nhiệm vụ
        </button>
      </div>

      {form.source === "draw" ? (
        <div className="ap-draw-box">
          <p className="ap-note">
            {draft.length === 0
              ? "Click lên bản đồ để đặt các điểm bay theo thứ tự. Kéo điểm để sửa vị trí."
              : `${draft.length} điểm · dài ${(lengthM / 1000).toFixed(2)} km · ${loop ? "mỗi vòng" : "bay hết"} khoảng ${fmtDuration(lengthM / (Number(form.speed_kmh) / 3.6 || 12))}`}
          </p>
          <div className="ap-draw-actions">
            <button className="ap-btn" disabled={!draft.length} onClick={() => setDraft(draft.slice(0, -1))}>
              <Undo2 size={14} /> Xoá điểm cuối
            </button>
            <button className="ap-btn" disabled={!draft.length} onClick={() => setDraft([])}>
              <Trash2 size={14} /> Xoá hết
            </button>
          </div>
        </div>
      ) : (
        <label>
          Lộ trình của nhiệm vụ
          <select value={form.mission_id} onChange={(e) => setForm({ ...form, mission_id: e.target.value })}>
            {missions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.waypoints.length} điểm)
              </option>
            ))}
          </select>
        </label>
      )}

      <label>
        Khi bay hết đường
        <select value={form.on_finish} onChange={(e) => setForm({ ...form, on_finish: e.target.value })}>
          <option value="loop">Lặp lại — tuần tra liên tục</option>
          <option value="rtb">Bay 1 lượt rồi về căn cứ</option>
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
        <li title="AI thấy mục tiêu nguy hiểm trong vùng tuần tra → bay vòng quan sát 45 giây rồi quay lại đường bay">
          <Radar size={12} /> <span>Mục tiêu nguy hiểm → bay vòng 45s</span>
        </li>
        <li title={`Pin dưới 25% → tự về căn cứ${loop ? ", sạc đủ 95% tự bay tiếp" : ""}`}>
          <Battery size={12} /> <span>Pin &lt; 25% → về căn cứ{loop ? ", đủ 95% bay tiếp" : ""}</span>
        </li>
      </ul>
      <button className="ap-btn primary" disabled={busy || !canStart} onClick={start}>
        <Bot size={16} /> {rerouting ? "Bay theo đường mới" : "Bắt đầu tự tuần tra"}
      </button>
      {rerouting && (
        <button className="ap-btn ghost" onClick={() => { setRerouting(false); setDraft([]); }}>
          <X size={14} /> Huỷ, giữ đường cũ
        </button>
      )}
    </div>
  );

  return (
    <div className="ap-page">
      <div className="ap-summary">
        <span className="ap-live"><i /> LIVE</span>
        <span className="ap-summary-total">
          <Bot size={14} /> {states.length}/{uavs.length} UAV đang tự lái
        </span>
        {Object.entries(MODE).map(([k, [label, color]]) =>
          modeCounts[k] ? (
            <span key={k} className="ap-summary-chip" style={{ "--c": color }}>
              <i /> {label} <b>{modeCounts[k]}</b>
            </span>
          ) : null
        )}
        <span className="ap-summary-note">Vị trí cập nhật mỗi giây</span>
      </div>
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
              <button key={u.id} className={`ap-uav-row ${u.id === selectedId ? "active" : ""}`} onClick={() => selectUav(u.id)}>
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
            <h3 className="section-title">{drawing ? `VẼ ĐƯỜNG BAY CHO ${selUav?.name}` : "BẢN ĐỒ TỰ TUẦN TRA"}</h3>
            <div className="ap-legend">
              {drawing && <span><i style={{ background: DRAFT_COLOR }} /> Đường đang vẽ</span>}
              <span><i style={{ background: "#22c55e" }} /> Đường đang bay</span>
              <span><i style={{ background: "#facc15" }} /> Điểm đang tới</span>
              <span><i className="dash" /> Vùng tuần tra</span>
              <span><i style={{ background: "#ef4444" }} /> Vùng quan sát mục tiêu</span>
            </div>
          </div>
          <PatrolMap states={named} selectedId={selectedId} onSelect={selectUav} drawing={drawing} draft={draft} onDraftChange={setDraft} loop={loop} />
          {drawing && draft.length === 0 && <div className="ap-map-hint">Click lên bản đồ để đặt điểm bay đầu tiên</div>}
          {!drawing && states.length === 0 && <div className="ap-map-hint">Chưa có UAV nào tự lái — chọn UAV bên trái để bắt đầu</div>}
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

          {blocked ? (
            <p className="ap-note">UAV đang {selUav.status === "offline" ? "offline" : "bảo trì"} — không thể bật tự lái.</p>
          ) : showForm ? (
            routeForm
          ) : (
            <>
              <div className="ap-cam">
                <LiveFrame uavId={selectedId} />
                <span className="ap-cam-tag"><i /> CAMERA · {selUav?.name}</span>
                <span className="ap-cam-hud">
                  ALT {sel.telemetry.altitude_m}m · {sel.telemetry.speed_kmh}km/h · HDG {Math.round(sel.telemetry.heading_deg)}°
                </span>
              </div>
              <div className="ap-stats">
                <BatteryRing pct={sel.telemetry.battery_pct} />
                <div><Route size={13} /> Điểm {sel.waypoint_index + 1}/{sel.waypoint_total} · vòng {sel.laps}</div>
                <div><Mountain size={13} /> {sel.telemetry.altitude_m} m</div>
                <div><Gauge size={13} /> {sel.telemetry.speed_kmh} km/h</div>
              </div>
              {nextWp && (
                <div className="ap-next">
                  <div className="ap-next-head">
                    <span>Tới điểm {nextWp.n}</span>
                    <span>
                      {nextWp.left >= 1000 ? `${(nextWp.left / 1000).toFixed(2)} km` : `${Math.round(nextWp.left)} m`} · còn ~{Math.max(1, Math.round(nextWp.eta))} giây
                    </span>
                  </div>
                  <div className="ap-next-track">
                    <span style={{ width: `${nextWp.pct}%` }} />
                  </div>
                </div>
              )}
              <div className="ap-mission">
                {sel.mission_id ? `Lộ trình: ${missionName(sel.mission_id)}` : "Đường bay vẽ tay"} · hết đường thì {sel.on_finish === "loop" ? "lặp lại" : "về căn cứ"}
              </div>
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
                <button
                  className="ap-btn wide"
                  disabled={busy}
                  onClick={() => {
                    setRerouting(true);
                    setForm((f) => ({ ...f, source: "draw", on_finish: sel.on_finish }));
                    setDraft([]);
                    setMsg(null);
                  }}
                >
                  <PenLine size={15} /> Vẽ đường mới
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
                {sel.events.map((e) => (
                  <div key={`${e.time}|${e.text}`} className="ap-event">
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
