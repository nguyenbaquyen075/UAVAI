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
  Wifi,
  Pause,
  Play,
  X,
  Trash2,
  Eye,
  Edit3,
  MoreVertical,
  Search,
  Filter,
  Maximize2,
  ChevronRight,
  ChevronLeft,
  Layers,
  Ruler,
  RefreshCw,
  Download,
  Radio,
} from "lucide-react";
import {
  activateUAV,
  createMission,
  deleteMission,
  getMissionTimeline,
  getUavTelemetry,
  listMissions,
  listTargets,
  listUAVs,
  patchMission,
} from "../api";
import ProgressRing from "../components/ProgressRing";
import TacticalVideoHUD from "../components/TacticalVideoHUD";

const START = [21.0285, 105.8542];
const PAGE_SIZE = 6;

const STATUS_LABEL = {
  active: "ĐANG THỰC HIỆN",
  paused: "TẠM DỪNG",
  completed: "HOÀN THÀNH",
  cancelled: "ĐÃ HUỶ",
  failed: "THẤT BẠI",
};

const STATUS_CLASS = {
  active: "badge-active",
  paused: "badge-warning",
  completed: "badge-success",
  cancelled: "badge-secondary",
  failed: "badge-danger",
};

const PRIORITY_LABEL = { high: "Cao", medium: "Trung bình", low: "Thấp" };
const PRIORITY_CLASS = { high: "priority-high", medium: "priority-medium", low: "priority-low" };

const UAV_STATUS_LABEL = { flying: "ĐANG BAY", ready: "SẴN SÀNG", offline: "OFFLINE", maintenance: "BẢO TRÌ" };

const EVENT_COLOR = { created: "blue", start: "green", waypoint: "green", alert: "red" };

const BASE_LAYERS = {
  satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  street: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
};

// Mẫu nhiệm vụ: chọn 1 mẫu sẽ điền sẵn form tạo nhiệm vụ, người dùng chỉ cần vẽ waypoint
const TEMPLATES = [
  { name: "Tuần tra biên giới", description: "Tuần tra dọc tuyến biên giới, phát hiện người/phương tiện xâm nhập", priority: "high", durationMin: 90 },
  { name: "Giám sát giao thông", description: "Theo dõi mật độ phương tiện tại các nút giao trọng điểm", priority: "medium", durationMin: 60 },
  { name: "Kiểm tra hạ tầng", description: "Bay kiểm tra trạm điện, đường dây, cầu cống theo lộ trình", priority: "low", durationMin: 45 },
  { name: "Tìm kiếm cứu nạn", description: "Quét khu vực rộng để tìm người mất tích", priority: "high", durationMin: 120 },
];

function toLocalInput(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Backend lưu giờ dạng UTC "YYYY-MM-DDTHH:MM:SSZ"
const toUtcIso = (date) => date.toISOString().replace(/\.\d{3}Z$/, "Z");

function fmtTime(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const fmtClock = (iso) => (iso ? new Date(iso).toLocaleTimeString("vi-VN", { hour12: false }) : "-");

function fmtDuration(ms) {
  if (!ms || ms <= 0) return "00:00:00";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

const timeRemaining = (expectedEndIso) => fmtDuration(expectedEndIso ? new Date(expectedEndIso).getTime() - Date.now() : 0);

// Thời gian đã bay của 1 nhiệm vụ: từ lúc bắt đầu tới min(bây giờ, kết thúc dự kiến)
function flownMs(m) {
  if (!m.started_at || m.status === "cancelled") return 0;
  const start = new Date(m.started_at).getTime();
  const end = Math.min(Date.now(), new Date(m.expected_end_at || m.started_at).getTime());
  return Math.max(0, end - start);
}

function csvDownload(filename, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const emptyForm = (uavId = "") => ({
  name: "",
  uav_id: uavId,
  priority: "medium",
  description: "",
  expected_end: toLocalInput(new Date(Date.now() + 3600_000)),
});

export default function Missions({ payload, onNavigateTab }) {
  const [missions, setMissions] = useState([]);
  const [uavs, setUavs] = useState([]);
  const [targets, setTargets] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("danh-sach"); // danh-sach | lich | mau

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [uavFilter, setUavFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = tạo mới, id = đang sửa
  const [newWaypoints, setNewWaypoints] = useState([]);
  const [form, setForm] = useState(emptyForm());

  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [rowMenuId, setRowMenuId] = useState(null);
  const [baseLayer, setBaseLayer] = useState("satellite");
  const [mapTool, setMapTool] = useState(null); // null | "pin" | "measure"
  const [measurePts, setMeasurePts] = useState([]);
  const [pins, setPins] = useState([]);

  const containerRef = useRef(null);
  const mapPanelRef = useRef(null);
  const timelineRef = useRef(null);
  const mapRef = useRef(null);
  const tileRef = useRef(null);
  const layerRef = useRef(null);
  const toolLayerRef = useRef(null);
  const markerRef = useRef(null);

  async function refresh() {
    const [missionList, uavList] = await Promise.all([listMissions(), listUAVs()]);
    const safeMissions = Array.isArray(missionList) ? missionList : [];
    const safeUavs = Array.isArray(uavList) ? uavList : [];
    setMissions(safeMissions);
    setUavs(safeUavs);
    setForm((f) => (f.uav_id || !safeUavs.length ? f : { ...f, uav_id: safeUavs[0].id }));
    setSelectedId((id) => (id == null && safeMissions.length ? safeMissions[0].id : id));
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, []);

  // Đóng menu thả xuống khi click ra ngoài
  useEffect(() => {
    const close = () => {
      setHeaderMenuOpen(false);
      setRowMenuId(null);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const safeMissions = Array.isArray(missions) ? missions : [];
  const safeUavs = Array.isArray(uavs) ? uavs : [];
  const selected = safeMissions.find((m) => m.id === selectedId) || safeMissions[0];

  useEffect(() => {
    if (!selected || creating) return;
    let cancelled = false;
    getMissionTimeline(selected.id).then((t) => !cancelled && setTimeline(Array.isArray(t) ? t : []));
    return () => {
      cancelled = true;
    };
  }, [selected?.id, selected?.status, selected?.waypoints_reached, creating]);

  // Mục tiêu do UAV của nhiệm vụ phát hiện trong khung thời gian nhiệm vụ (API trả nhiều -> chỉ tải khi đổi nhiệm vụ)
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    listTargets().then((list) => {
      if (cancelled || !Array.isArray(list)) return;
      const from = selected.started_at || "";
      const to = selected.expected_end_at || "9999";
      setTargets(
        list
          .filter((t) => t.uav_id === selected.uav_id && typeof t.lat === "number" && t.last_seen >= from && t.first_seen <= to)
          .slice(0, 50)
      );
    });
    return () => {
      cancelled = true;
    };
  }, [selected?.id]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    async function poll() {
      const t = await getUavTelemetry(selected.uav_id);
      if (!cancelled) setTelemetry(t);
    }
    poll();
    const id = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [selected?.uav_id]);

  // Leaflet: handler click đọc state mới nhất qua ref
  const stateRef = useRef({});
  stateRef.current = { creating, mapTool };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, { zoomControl: false }).setView(START, 14);
    tileRef.current = L.tileLayer(BASE_LAYERS.satellite, { attribution: "© Esri", maxZoom: 18 }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    toolLayerRef.current = L.layerGroup().addTo(map);

    markerRef.current = L.marker(START, {
      icon: L.divIcon({
        className: "drone-map-marker",
        html: `
          <div class="uav-marker-pulse">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5">
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path>
            </svg>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      }),
    }).addTo(map);

    map.on("click", (e) => {
      const { creating, mapTool } = stateRef.current;
      const pt = { lat: e.latlng.lat, lon: e.latlng.lng };
      if (creating) setNewWaypoints((prev) => [...prev, pt]);
      else if (mapTool === "pin") setPins((prev) => [...prev, pt]);
      else if (mapTool === "measure") setMeasurePts((prev) => [...prev, pt]);
    });

    const onFs = () => setTimeout(() => map.invalidateSize(), 100);
    document.addEventListener("fullscreenchange", onFs);

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    tileRef.current?.setUrl(BASE_LAYERS[baseLayer]);
  }, [baseLayer]);

  // Waypoint + khu vực nhiệm vụ + mục tiêu
  const selectedKey = selected ? `${selected.id}:${JSON.stringify(selected.waypoints)}` : "";
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    const waypoints = (creating ? newWaypoints : selected?.waypoints ?? []).filter(
      (w) => typeof w?.lat === "number" && typeof w?.lon === "number"
    );
    const coords = waypoints.map((w) => [w.lat, w.lon]);

    waypoints.forEach((wp, i) => {
      L.marker([wp.lat, wp.lon], {
        icon: L.divIcon({
          className: "custom-waypoint-marker",
          html: `<div class="wp-circle">${i === 0 ? "S" : i + 1}</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
      }).addTo(layer);
    });

    if (coords.length > 1) {
      L.polyline(coords, { color: "#22c55e", weight: 2 }).addTo(layer);
      if (coords.length > 2) {
        L.polygon(coords, { color: "#22c55e", weight: 1, fillColor: "#22c55e", fillOpacity: 0.1 }).addTo(layer);
      }
    }

    if (!creating) {
      targets.forEach((t) => {
        L.marker([t.lat, t.lon], {
          icon: L.divIcon({
            className: "custom-target-marker",
            html: `<div class="target-square"><span class="warn-excl">⚠️</span></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
        })
          .bindTooltip(`Mục tiêu #${t.id} · ${t.class} · ${t.distance_m ?? "-"}m`)
          .addTo(layer);
      });
    }

    if (coords.length && mapRef.current && !creating) {
      mapRef.current.fitBounds(coords, { padding: [30, 30], maxZoom: 16 });
    }
  }, [creating, newWaypoints, selectedKey, targets]);

  // Ghim điểm + thước đo khoảng cách
  useEffect(() => {
    const layer = toolLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    pins.forEach((p) =>
      L.marker([p.lat, p.lon])
        .bindTooltip(`${p.lat.toFixed(5)}, ${p.lon.toFixed(5)}`, { permanent: true, direction: "top", offset: [-15, -12] })
        .addTo(layer)
    );
    if (measurePts.length) {
      const latlngs = measurePts.map((p) => L.latLng(p.lat, p.lon));
      latlngs.forEach((ll) => L.circleMarker(ll, { radius: 4, color: "#facc15", fillOpacity: 1 }).addTo(layer));
      if (latlngs.length > 1) {
        const meters = latlngs.slice(1).reduce((sum, ll, i) => sum + latlngs[i].distanceTo(ll), 0);
        L.polyline(latlngs, { color: "#facc15", weight: 2, dashArray: "6 4" })
          .bindTooltip(meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`, {
            permanent: true,
            className: "measure-tooltip",
          })
          .addTo(layer);
      }
    }
  }, [pins, measurePts]);

  useEffect(() => {
    if (!markerRef.current || typeof telemetry?.lat !== "number" || typeof telemetry?.lon !== "number") return;
    markerRef.current.setLatLng([telemetry.lat, telemetry.lon]);
  }, [telemetry]);

  function openCreate(prefill = {}) {
    setEditingId(null);
    setNewWaypoints([]);
    setForm({ ...emptyForm(form.uav_id || safeUavs[0]?.id || ""), ...prefill });
    setMapTool(null);
    setCreating(true);
    setActiveTab("danh-sach");
  }

  function openEdit(m) {
    setEditingId(m.id);
    setNewWaypoints(Array.isArray(m.waypoints) ? m.waypoints : []);
    setForm({
      name: m.name,
      uav_id: m.uav_id,
      priority: m.priority || "medium",
      description: m.description || "",
      expected_end: toLocalInput(new Date(m.expected_end_at || Date.now() + 3600_000)),
    });
    setMapTool(null);
    setCreating(true);
    setActiveTab("danh-sach");
  }

  function closeForm() {
    setCreating(false);
    setEditingId(null);
    setNewWaypoints([]);
  }

  async function submitMission(e) {
    e.preventDefault();
    if (!form.name.trim()) return alert("Nhập tên nhiệm vụ");
    if (!form.uav_id) return alert("Chọn UAV thực hiện");
    if (newWaypoints.length === 0) return alert("Click lên bản đồ để thêm ít nhất 1 điểm bay");
    const body = {
      name: form.name.trim(),
      uav_id: Number(form.uav_id),
      priority: form.priority,
      description: form.description,
      waypoints: newWaypoints,
      expected_end_at: toUtcIso(new Date(form.expected_end)),
    };
    if (editingId) {
      await patchMission(editingId, body);
      setSelectedId(editingId);
    } else {
      const res = await createMission({ ...body, started_at: toUtcIso(new Date()) });
      if (res?.id) setSelectedId(res.id);
    }
    closeForm();
    refresh();
  }

  async function setStatus(mission, status) {
    if (!mission) return;
    if (status === "cancelled" && !confirm(`Huỷ nhiệm vụ "${mission.name}"?`)) return;
    await patchMission(mission.id, { status });
    refresh();
  }

  async function remove(m) {
    if (!confirm(`Xoá nhiệm vụ "${m.name}"? Không thể hoàn tác.`)) return;
    await deleteMission(m.id);
    if (selectedId === m.id) setSelectedId(null);
    refresh();
  }

  async function watchLive() {
    if (!selected) return;
    await activateUAV(selected.uav_id);
    onNavigateTab?.("live");
  }

  const toggleFullscreen = (el) => {
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen().catch(() => {});
  };

  const clearMapTools = () => {
    setPins([]);
    setMeasurePts([]);
    setMapTool(null);
    if (creating) setNewWaypoints([]);
  };

  const filtersActive = search || statusFilter || uavFilter || priorityFilter;
  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setUavFilter("");
    setPriorityFilter("");
    setPage(1);
  };

  const filtered = safeMissions.filter((m) => {
    const q = search.toLowerCase();
    if (q && !m.name.toLowerCase().includes(q) && !(m.code || "").toLowerCase().includes(q)) return false;
    if (statusFilter && m.status !== statusFilter) return false;
    if (uavFilter && String(m.uav_id) !== uavFilter) return false;
    if (priorityFilter && m.priority !== priorityFilter) return false;
    return true;
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const uavName = (id) => safeUavs.find((u) => u.id === id)?.name || `UAV #${id}`;
  const missionCode = (m) => m.code || `MSN_${String(m.id).padStart(3, "0")}`;

  const total = safeMissions.length;
  const pct = (n) => (total ? `${((n / total) * 100).toFixed(1)}%` : "0%");
  const activeCount = safeMissions.filter((m) => m.status === "active").length;
  const completedCount = safeMissions.filter((m) => m.status === "completed").length;
  const failedOrCancelledCount = safeMissions.filter((m) => m.status === "cancelled" || m.status === "failed").length;
  const totalFlownMin = Math.round(safeMissions.reduce((s, m) => s + flownMs(m), 0) / 60_000);

  const exportCsv = () =>
    csvDownload(`nhiem_vu_${Date.now()}.csv`, [
      ["Mã", "Tên", "UAV", "Trạng thái", "Ưu tiên", "Bắt đầu", "Kết thúc dự kiến", "Tiến độ %"],
      ...filtered.map((m) => [
        missionCode(m),
        m.name,
        uavName(m.uav_id),
        STATUS_LABEL[m.status] || m.status,
        PRIORITY_LABEL[m.priority] || m.priority,
        fmtTime(m.started_at),
        fmtTime(m.expected_end_at),
        Math.round(m.progress_pct ?? 0),
      ]),
    ]);

  const isLive = selected && payload?.active_uav_id === selected.uav_id;
  const assignedUav = safeUavs.find((u) => u.id === selected?.uav_id);
  const assignedName = assignedUav ? `${assignedUav.name} - ${assignedUav.type || "UAV"}` : "-";
  const flyingFor = assignedUav?.flying_since ? fmtDuration(Date.now() - new Date(assignedUav.flying_since).getTime()) : "-";
  const distFromBase =
    typeof telemetry?.lat === "number" ? L.latLng(START).distanceTo(L.latLng(telemetry.lat, telemetry.lon)) : null;
  const alertCount = timeline.filter((e) => e.type === "alert").length;
  // YOLO có thể sinh hàng trăm cảnh báo/nhiệm vụ — chỉ vẽ 20 cảnh báo mới nhất, giữ đủ mốc tạo/cất cánh/điểm bay
  const MAX_ALERTS_SHOWN = 20;
  const shownTimeline = [
    ...timeline.filter((e) => e.type !== "alert"),
    ...timeline.filter((e) => e.type === "alert").slice(-MAX_ALERTS_SHOWN),
  ].sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  // Lịch: gom nhiệm vụ theo ngày bắt đầu
  const scheduleGroups = [...filtered]
    .sort((a, b) => (a.started_at || "").localeCompare(b.started_at || ""))
    .reduce((acc, m) => {
      const day = m.started_at ? new Date(m.started_at).toLocaleDateString("vi-VN") : "Chưa xếp lịch";
      (acc[day] ||= []).push(m);
      return acc;
    }, {});

  const rowActions = (m) => [
    m.status === "active"
      ? { label: "Tạm dừng", icon: Pause, run: () => setStatus(m, "paused") }
      : m.status === "paused"
      ? { label: "Tiếp tục", icon: Play, run: () => setStatus(m, "active") }
      : null,
    m.status === "active" || m.status === "paused"
      ? { label: "Đánh dấu hoàn thành", icon: CheckCircle2, run: () => setStatus(m, "completed") }
      : null,
    m.status === "active" || m.status === "paused"
      ? { label: "Huỷ nhiệm vụ", icon: XCircle, run: () => setStatus(m, "cancelled") }
      : null,
    { label: "Xoá", icon: Trash2, run: () => remove(m), danger: true },
  ].filter(Boolean);

  return (
    <div className="missions-page-v2">
      {/* 5 Top Summary Stat Cards */}
      <div className="stats-grid-5">
        <div className="summary-stat-card">
          <div className="stat-icon-wrapper icon-blue">
            <ClipboardList size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-title">TỔNG NHIỆM VỤ</span>
            <div className="stat-value-group">
              <span className="stat-number">{total}</span>
            </div>
          </div>
        </div>

        <div className="summary-stat-card">
          <div className="stat-icon-wrapper icon-green">
            <PlayCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-title">ĐANG THỰC HIỆN</span>
            <div className="stat-value-group">
              <span className="stat-number text-emerald-400">{activeCount}</span>
              <span className="stat-trend text-slate-400">{pct(activeCount)}</span>
            </div>
          </div>
        </div>

        <div className="summary-stat-card">
          <div className="stat-icon-wrapper icon-emerald">
            <CheckCircle2 size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-title">HOÀN THÀNH</span>
            <div className="stat-value-group">
              <span className="stat-number text-emerald-400">{completedCount}</span>
              <span className="stat-trend text-slate-400">{pct(completedCount)}</span>
            </div>
          </div>
        </div>

        <div className="summary-stat-card">
          <div className="stat-icon-wrapper icon-red">
            <XCircle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-title">THẤT BẠI / HỦY</span>
            <div className="stat-value-group">
              <span className="stat-number text-rose-400">{failedOrCancelledCount}</span>
              <span className="stat-trend text-slate-400">{pct(failedOrCancelledCount)}</span>
            </div>
          </div>
        </div>

        <div className="summary-stat-card">
          <div className="stat-icon-wrapper icon-purple">
            <Clock size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-title">TỔNG THỜI GIAN BAY</span>
            <div className="stat-value-group">
              <span className="stat-number">
                {Math.floor(totalFlownMin / 60)}h {totalFlownMin % 60}m
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column & Right Sidebar */}
      <div className="missions-main-grid">
        <div className="missions-left-col">
          {/* Panel 1: Mission Table Card */}
          <div className="dashboard-panel missions-table-panel">
            <div className="panel-tabs-header">
              <div className="nav-tabs-list">
                {[
                  ["danh-sach", "DANH SÁCH NHIỆM VỤ"],
                  ["lich", "LỊCH NHIỆM VỤ"],
                  ["mau", "MẪU NHIỆM VỤ"],
                ].map(([key, label]) => (
                  <button key={key} className={`tab-item ${activeTab === key ? "active" : ""}`} onClick={() => setActiveTab(key)}>
                    {label}
                  </button>
                ))}
              </div>

              <div className="tab-header-actions">
                <button className="btn-create-mission" onClick={() => (creating ? closeForm() : openCreate())}>
                  {creating ? <X size={15} /> : <span className="mr-1">+</span>}
                  {creating ? "Đóng" : "Tạo nhiệm vụ"}
                </button>
                <div className="msn-menu-anchor">
                  <button
                    className="btn-options-dots"
                    title="Tuỳ chọn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHeaderMenuOpen((o) => !o);
                      setRowMenuId(null);
                    }}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {headerMenuOpen && (
                    <div className="msn-dropdown" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => (refresh(), setHeaderMenuOpen(false))}>
                        <RefreshCw size={14} /> Làm mới
                      </button>
                      <button onClick={() => (exportCsv(), setHeaderMenuOpen(false))}>
                        <Download size={14} /> Xuất CSV ({filtered.length})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {creating && (
              <form onSubmit={submitMission} className="create-mission-form">
                <div className="msn-form-title">{editingId ? "Sửa nhiệm vụ" : "Tạo nhiệm vụ mới"}</div>
                <div className="form-grid">
                  <input
                    placeholder="Tên nhiệm vụ..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="form-input"
                  />
                  <select value={form.uav_id} onChange={(e) => setForm({ ...form, uav_id: e.target.value })} className="form-select">
                    {safeUavs.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.type || "UAV"})
                      </option>
                    ))}
                  </select>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="form-select">
                    <option value="high">Ưu tiên cao</option>
                    <option value="medium">Ưu tiên trung bình</option>
                    <option value="low">Ưu tiên thấp</option>
                  </select>
                  <input
                    type="datetime-local"
                    title="Thời gian kết thúc dự kiến"
                    value={form.expected_end}
                    onChange={(e) => setForm({ ...form, expected_end: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-row-full mt-2">
                  <input
                    placeholder="Mô tả nhiệm vụ..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="waypoint-picker-info mt-2">
                  <span className="text-slate-300 text-xs">
                    💡 Click trực tiếp trên bản đồ bên dưới để thêm điểm bay ({newWaypoints.length} điểm đã chọn)
                  </span>
                  <div className="flex gap-2">
                    <button type="button" className="btn-secondary" onClick={() => setNewWaypoints((w) => w.slice(0, -1))}>
                      Bỏ điểm cuối
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setNewWaypoints([])}>
                      Xoá điểm
                    </button>
                    <button type="submit" className="btn-primary">
                      {editingId ? "Lưu thay đổi" : "Lưu nhiệm vụ"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {activeTab !== "mau" && (
              <div className="filter-toolbar">
                <div className="search-input-wrapper">
                  <Search size={15} className="search-icon" />
                  <input
                    placeholder="Tìm kiếm nhiệm vụ..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="table-search-input"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="filter-select"
                >
                  <option value="">Trạng thái: Tất cả</option>
                  {Object.entries(STATUS_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>

                <select
                  value={uavFilter}
                  onChange={(e) => {
                    setUavFilter(e.target.value);
                    setPage(1);
                  }}
                  className="filter-select"
                >
                  <option value="">UAV: Tất cả</option>
                  {safeUavs.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value);
                    setPage(1);
                  }}
                  className="filter-select"
                >
                  <option value="">Ưu tiên: Tất cả</option>
                  {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>

                <button
                  className={`btn-filter-icon ${filtersActive ? "active" : ""}`}
                  onClick={resetFilters}
                  disabled={!filtersActive}
                  title="Xoá toàn bộ bộ lọc"
                >
                  {filtersActive ? <X size={15} /> : <Filter size={15} />}
                  <span>{filtersActive ? "Xoá lọc" : "Bộ lọc"}</span>
                </button>
              </div>
            )}

            {activeTab === "danh-sach" && (
              <>
                <div className="table-responsive">
                  <table className="missions-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>TÊN NHIỆM VỤ</th>
                        <th>MỤC TIÊU</th>
                        <th>UAV</th>
                        <th>TRẠNG THÁI</th>
                        <th>ƯU TIÊN</th>
                        <th>BẮT ĐẦU</th>
                        <th>TIẾN ĐỘ</th>
                        <th className="text-center">THAO TÁC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((m) => {
                        const isSelected = m.id === selected?.id;
                        return (
                          <tr
                            key={m.id}
                            className={`table-row ${isSelected ? "selected-row" : ""}`}
                            onClick={() => setSelectedId(m.id)}
                          >
                            <td className="cell-id">{missionCode(m)}</td>
                            <td className="cell-name">{m.name}</td>
                            <td className="cell-targets">{m.target_count ?? 0} mục tiêu</td>
                            <td className="cell-uav">{uavName(m.uav_id)}</td>
                            <td className="cell-status">
                              <span className={`badge-pill ${STATUS_CLASS[m.status] || "badge-neutral"}`}>
                                {STATUS_LABEL[m.status] || m.status}
                              </span>
                            </td>
                            <td className="cell-priority">
                              <span className={`priority-text ${PRIORITY_CLASS[m.priority]}`}>{PRIORITY_LABEL[m.priority]}</span>
                            </td>
                            <td className="cell-time">{fmtTime(m.started_at)}</td>
                            <td className="cell-progress">
                              <div className="progress-cell-wrapper">
                                <div className="progress-bar-track">
                                  <div
                                    className={`progress-bar-fill ${m.status === "failed" ? "bg-rose-500" : "bg-emerald-400"}`}
                                    style={{ width: `${m.progress_pct ?? 0}%` }}
                                  />
                                </div>
                                <span className="progress-pct-text">{Math.round(m.progress_pct ?? 0)}%</span>
                              </div>
                            </td>
                            <td className="cell-actions text-center">
                              <div className="action-buttons-group msn-menu-anchor">
                                <button
                                  className="action-btn icon-view"
                                  title="Xem chi tiết"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedId(m.id);
                                  }}
                                >
                                  <Eye size={15} />
                                </button>
                                <button
                                  className="action-btn icon-edit"
                                  title="Chỉnh sửa"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedId(m.id);
                                    openEdit(m);
                                  }}
                                >
                                  <Edit3 size={15} />
                                </button>
                                <button
                                  className="action-btn icon-more"
                                  title="Thao tác khác"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setHeaderMenuOpen(false);
                                    setRowMenuId((id) => (id === m.id ? null : m.id));
                                  }}
                                >
                                  <MoreVertical size={15} />
                                </button>
                                {rowMenuId === m.id && (
                                  <div className="msn-dropdown" onClick={(e) => e.stopPropagation()}>
                                    {rowActions(m).map((a) => (
                                      <button
                                        key={a.label}
                                        className={a.danger ? "danger" : ""}
                                        onClick={() => {
                                          setRowMenuId(null);
                                          a.run();
                                        }}
                                      >
                                        <a.icon size={14} /> {a.label}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {pageItems.length === 0 && (
                        <tr>
                          <td colSpan={9} className="text-center py-6 text-slate-400">
                            Không tìm thấy nhiệm vụ phù hợp
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="table-pagination-footer">
                  <span className="pagination-info">
                    Hiển thị {pageItems.length ? (page - 1) * PAGE_SIZE + 1 : 0} đến {(page - 1) * PAGE_SIZE + pageItems.length} của{" "}
                    {filtered.length} nhiệm vụ
                  </span>
                  <div className="pagination-pages">
                    <button className="page-nav-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                      <ChevronLeft size={16} />
                    </button>
                    {[...Array(pageCount)].map((_, idx) => (
                      <button
                        key={idx}
                        className={`page-num-btn ${page === idx + 1 ? "active" : ""}`}
                        onClick={() => setPage(idx + 1)}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      className="page-nav-btn"
                      disabled={page >= pageCount}
                      onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === "lich" && (
              <div className="msn-schedule">
                {Object.keys(scheduleGroups).length === 0 && <div className="msn-empty">Không có nhiệm vụ phù hợp</div>}
                {Object.entries(scheduleGroups).map(([day, list]) => (
                  <div key={day} className="msn-schedule-day">
                    <div className="msn-schedule-date">{day}</div>
                    {list.map((m) => (
                      <button
                        key={m.id}
                        className={`msn-schedule-item ${m.id === selected?.id ? "selected" : ""}`}
                        onClick={() => setSelectedId(m.id)}
                      >
                        <span className="msn-schedule-time">
                          {m.started_at ? new Date(m.started_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--:--"}
                          {" → "}
                          {m.expected_end_at
                            ? new Date(m.expected_end_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                            : "--:--"}
                        </span>
                        <span className="msn-schedule-name">{m.name}</span>
                        <span className="msn-schedule-uav">{uavName(m.uav_id)}</span>
                        <span className={`badge-pill ${STATUS_CLASS[m.status] || "badge-neutral"}`}>{STATUS_LABEL[m.status] || m.status}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {activeTab === "mau" && (
              <div className="msn-templates">
                {TEMPLATES.map((t) => (
                  <div key={t.name} className="msn-template-card">
                    <div className="msn-template-head">
                      <span className="msn-template-name">{t.name}</span>
                      <span className={`priority-text ${PRIORITY_CLASS[t.priority]}`}>{PRIORITY_LABEL[t.priority]}</span>
                    </div>
                    <p className="msn-template-desc">{t.description}</p>
                    <div className="msn-template-foot">
                      <span>
                        <Clock size={12} /> {t.durationMin} phút
                      </span>
                      <button
                        className="btn-primary"
                        onClick={() =>
                          openCreate({
                            name: t.name,
                            description: t.description,
                            priority: t.priority,
                            expected_end: toLocalInput(new Date(Date.now() + t.durationMin * 60_000)),
                          })
                        }
                      >
                        Dùng mẫu
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lower Grid: Map & Live Video Stream Side by Side */}
          <div className="missions-lower-2col">
            <div className="dashboard-panel lower-panel" ref={mapPanelRef}>
              <div className="panel-section-header">
                <h3 className="section-title">BẢN ĐỒ NHIỆM VỤ</h3>
                <div className="section-header-actions">
                  <button className="icon-tool-btn" title="Toàn màn hình" onClick={() => toggleFullscreen(mapPanelRef.current)}>
                    <Maximize2 size={15} />
                  </button>
                </div>
              </div>

              <div className="panel-map-container">
                <div className="map-left-toolbar-individual">
                  <button
                    className="map-single-btn"
                    title={baseLayer === "satellite" ? "Chuyển sang bản đồ đường phố" : "Chuyển sang ảnh vệ tinh"}
                    onClick={() => setBaseLayer((b) => (b === "satellite" ? "street" : "satellite"))}
                  >
                    <Layers size={18} />
                  </button>
                  <button
                    className={`map-single-btn ${creating ? "active" : ""}`}
                    title="Vẽ khu vực nhiệm vụ mới (click lên bản đồ để thêm điểm)"
                    onClick={() => (creating ? closeForm() : openCreate())}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 4L20 9.5V17.5L11 20.5L4 16V8L14 4Z" />
                      <circle cx="14" cy="4" r="2" fill="currentColor" />
                    </svg>
                  </button>
                  <button
                    className={`map-single-btn ${mapTool === "pin" ? "active" : ""}`}
                    title="Ghim điểm (click lên bản đồ)"
                    disabled={creating}
                    onClick={() => setMapTool((t) => (t === "pin" ? null : "pin"))}
                  >
                    <MapPin size={18} />
                  </button>
                  <button
                    className={`map-single-btn ${mapTool === "measure" ? "active" : ""}`}
                    title="Đo khoảng cách (click nhiều điểm)"
                    disabled={creating}
                    onClick={() => {
                      setMapTool((t) => (t === "measure" ? null : "measure"));
                      setMeasurePts([]);
                    }}
                  >
                    <Ruler size={18} />
                  </button>
                  <button className="map-single-btn" title="Xoá ghim, thước đo và điểm đang vẽ" onClick={clearMapTools}>
                    <Trash2 size={18} />
                  </button>
                </div>

                <button
                  className="map-top-right-expand"
                  title="Căn lại theo nhiệm vụ"
                  onClick={() => {
                    const wps = (creating ? newWaypoints : selected?.waypoints ?? []).map((w) => [w.lat, w.lon]);
                    if (wps.length) mapRef.current?.fitBounds(wps, { padding: [30, 30], maxZoom: 16 });
                    else mapRef.current?.setView(START, 14);
                  }}
                >
                  <Maximize2 size={14} />
                </button>

                <div ref={containerRef} className={`leaflet-map-element ${creating || mapTool ? "crosshair-cursor" : ""}`} />

                <div className="map-bottom-legend">
                  <div className="legend-item">
                    <span className="legend-dot dot-uav"></span>
                    <span>Vị trí UAV</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot dot-waypoint"></span>
                    <span>Điểm bay</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-square square-target"></span>
                    <span>Mục tiêu ({targets.length})</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-zone zone-area"></span>
                    <span>Khu vực nhiệm vụ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Video */}
            <div className="dashboard-panel lower-panel">
              <div className="panel-section-header">
                <h3 className="section-title">TRỰC TIẾP NHIỆM VỤ</h3>
                {isLive && <span className="live-green-diamond">◆ LIVE · {assignedUav?.name}</span>}
              </div>

              <div className="panel-video-container">
                {isLive ? (
                  <TacticalVideoHUD
                    isLive
                    telemetry={payload?.uav_status?.gps}
                    objects={payload?.objects ?? []}
                    frameSize={{ width: payload?.uav_status?.frame_width, height: payload?.uav_status?.frame_height }}
                  />
                ) : (
                  <div className="msn-video-offline">
                    <Radio size={28} />
                    <p>
                      {selected
                        ? `${assignedUav?.name || "UAV"} chưa phát trực tiếp`
                        : "Chọn một nhiệm vụ để xem trực tiếp."}
                    </p>
                    {selected && (
                      <button className="btn-primary" onClick={() => activateUAV(selected.uav_id).then(refresh)}>
                        Chuyển luồng video sang {assignedUav?.name || "UAV này"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="missions-right-sidebar">
          <div className="dashboard-panel sidebar-card">
            <div className="sidebar-card-header">
              <h3 className="sidebar-title">CHI TIẾT NHIỆM VỤ</h3>
              {selected && <span className={`badge-pill ${STATUS_CLASS[selected.status]}`}>{STATUS_LABEL[selected.status]}</span>}
            </div>

            <div className="mission-details-list">
              <div className="detail-row">
                <span className="detail-label">ID</span>
                <span className="detail-value mono font-semibold">{selected ? missionCode(selected) : "-"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Tên nhiệm vụ</span>
                <span className="detail-value font-semibold text-slate-100">{selected?.name || "-"}</span>
              </div>
              <div className="detail-row multiline">
                <span className="detail-label">Mô tả</span>
                <span className="detail-value text-slate-300 text-xs leading-relaxed">{selected?.description || "-"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">UAV thực hiện</span>
                <span className="detail-value text-sky-400 font-medium">{assignedName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Thời gian bắt đầu</span>
                <span className="detail-value">{fmtTime(selected?.started_at)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Kết thúc dự kiến</span>
                <span className="detail-value">{fmtTime(selected?.expected_end_at)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Khu vực</span>
                <span className="detail-value">{selected?.area_size || assignedUav?.zone || "-"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Ưu tiên</span>
                <span className={`detail-value ${PRIORITY_CLASS[selected?.priority]}`}>{PRIORITY_LABEL[selected?.priority] || "-"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Người tạo</span>
                <span className="detail-value">{selected?.creator || "admin"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Ghi chú</span>
                <span className="detail-value text-slate-400">{selected?.notes || "-"}</span>
              </div>
            </div>

            <div className="sidebar-action-buttons">
              <button className="btn-sidebar-action btn-green" disabled={!selected} onClick={watchLive}>
                <Eye size={15} />
                <span>Xem trực tiếp</span>
              </button>
              {selected?.status === "active" ? (
                <button className="btn-sidebar-action btn-dark" onClick={() => setStatus(selected, "paused")}>
                  <Pause size={15} />
                  <span>Tạm dừng</span>
                </button>
              ) : (
                <button
                  className="btn-sidebar-action btn-dark"
                  disabled={!selected || selected.status !== "paused"}
                  title={selected?.status !== "paused" ? "Chỉ tiếp tục được nhiệm vụ đang tạm dừng" : ""}
                  onClick={() => setStatus(selected, "active")}
                >
                  <Play size={15} />
                  <span>Tiếp tục</span>
                </button>
              )}
              <button
                className="btn-sidebar-action btn-danger"
                disabled={!selected || !["active", "paused"].includes(selected.status)}
                onClick={() => setStatus(selected, "cancelled")}
              >
                <XCircle size={15} />
                <span>Hủy nhiệm vụ</span>
              </button>
            </div>
          </div>

          <div className="dashboard-panel sidebar-card">
            <div className="sidebar-card-header">
              <h3 className="sidebar-title">TRẠNG THÁI UAV</h3>
              <span className="badge-green-glow">{UAV_STATUS_LABEL[assignedUav?.status] || "-"}</span>
            </div>
            <div className="uav-subtitle">{assignedName}</div>

            <div className="uav-status-2col">
              <div className="uav-drone-col">
                <img src="/uav_drone.png" alt="UAV Drone" className="drone-3d-img" />
              </div>

              <div className="uav-metrics-col">
                <div className="uav-metric-row">
                  <span className="m-lbl">Pin</span>
                  <div className="m-val-group">
                    <div className="battery-mini-track">
                      <div className="battery-mini-fill" style={{ width: `${telemetry?.battery_pct ?? 0}%` }} />
                    </div>
                    <span className="m-val">{telemetry?.battery_pct != null ? `${Math.round(telemetry.battery_pct)}%` : "-"}</span>
                  </div>
                </div>
                <div className="uav-metric-row">
                  <span className="m-lbl">Thời gian bay</span>
                  <span className="m-val">{flyingFor}</span>
                </div>
                <div className="uav-metric-row">
                  <span className="m-lbl">Cách căn cứ</span>
                  <span className="m-val">{distFromBase != null ? `${(distFromBase / 1000).toFixed(2)} km` : "-"}</span>
                </div>
                <div className="uav-metric-row">
                  <span className="m-lbl">Độ cao</span>
                  <span className="m-val">{telemetry?.altitude_m != null ? `${telemetry.altitude_m} m` : "-"}</span>
                </div>
                <div className="uav-metric-row">
                  <span className="m-lbl">Tốc độ</span>
                  <span className="m-val">{telemetry?.speed_kmh != null ? `${telemetry.speed_kmh} km/h` : "-"}</span>
                </div>
                <div className="uav-metric-row">
                  <span className="m-lbl">Hướng</span>
                  <span className="m-val">{telemetry?.heading_deg != null ? `${telemetry.heading_deg}°` : "-"}</span>
                </div>
                <div className="uav-metric-row">
                  <span className="m-lbl">Liên kết</span>
                  <span className={`m-val ${telemetry?.signal === "Strong" ? "val-green-signal" : ""}`}>
                    <Wifi size={12} />
                    {telemetry?.signal || "-"}
                  </span>
                </div>
              </div>
            </div>

            <button className="btn-uav-detail-green-outline" onClick={() => onNavigateTab?.("uavs")}>
              Xem chi tiết UAV
            </button>
          </div>

          <div className="dashboard-panel sidebar-card">
            <div className="sidebar-card-header">
              <h3 className="sidebar-title">TIẾN ĐỘ NHIỆM VỤ</h3>
            </div>

            <div className="progress-ring-card-body">
              <div className="progress-gauge-container">
                <ProgressRing pct={Math.round(selected?.progress_pct ?? 0)} size={110} strokeWidth={9} />
              </div>

              <div className="progress-breakdown">
                <div className="breakdown-row">
                  <span className="breakdown-label">Đã hoàn thành</span>
                  <span className="breakdown-val font-semibold">
                    {selected?.waypoints_reached ?? 0} / {selected?.waypoints?.length ?? 0} điểm
                  </span>
                </div>
                <div className="breakdown-row">
                  <span className="breakdown-label">Cảnh báo mục tiêu</span>
                  <span className="breakdown-val font-semibold text-emerald-400">{alertCount}</span>
                </div>
                <div className="breakdown-row">
                  <span className="breakdown-label">Thời gian còn lại</span>
                  <span className="breakdown-val font-mono">
                    {selected?.status === "active" ? timeRemaining(selected?.expected_end_at) : "--:--:--"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Horizontal Timeline Bar */}
      <div className="dashboard-panel timeline-full-panel">
        <div className="panel-section-header">
          <h3 className="section-title">DÒNG THỜI GIAN {selected ? `· ${selected.name}` : ""}</h3>
          {alertCount > MAX_ALERTS_SHOWN && (
            <span className="text-slate-400 text-xs">
              Hiển thị {MAX_ALERTS_SHOWN}/{alertCount} cảnh báo mới nhất
            </span>
          )}
        </div>

        <div className="timeline-horizontal-scroll" ref={timelineRef}>
          <div className="timeline-track">
            {timeline.length === 0 && <span className="text-slate-400 text-xs">Chưa có sự kiện</span>}
            {shownTimeline.map((evt, i) => {
              const Icon = { created: Flag, start: PlaneTakeoff, waypoint: MapPin, alert: AlertTriangle }[evt.type];
              return (
                <div key={i} className="timeline-step-node" title={fmtTime(evt.time)}>
                  <div className={`timeline-dot dot-${EVENT_COLOR[evt.type] || "blue"}`} />
                  <div className="timeline-content">
                    <span className="timeline-time-text">{fmtClock(evt.time)}</span>
                    <span className="timeline-title-text">
                      {Icon && <Icon size={11} style={{ marginRight: 4, verticalAlign: -1 }} />}
                      {evt.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            className="timeline-scroll-next"
            title="Xem tiếp"
            onClick={() => timelineRef.current?.scrollBy({ left: 300, behavior: "smooth" })}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
