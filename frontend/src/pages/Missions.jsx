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
  Eye,
  Edit3,
  MoreVertical,
  Search,
  Filter,
  Maximize2,
  Video,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Layers,
  Target,
  ArrowUpRight,
  Sparkles,
  SlidersHorizontal,
  Minus,
  Ruler,
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

const EVENT_ICON = { created: Flag, start: PlaneTakeoff, waypoint: MapPin, alert: AlertTriangle };

function toLocalInput(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

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

function timeRemaining(expectedEndIso) {
  if (!expectedEndIso) return "00:00:00";
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
  const [activeTab, setActiveTab] = useState("danh-sach"); // danh-sach | lich | mau

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [uavFilter, setUavFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const [creating, setCreating] = useState(false);
  const [newWaypoints, setNewWaypoints] = useState([]);
  const [form, setForm] = useState({
    name: "",
    uav_id: "",
    priority: "medium",
    description: "",
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
    return () => {
      cancelled = true;
    };
  }, [selectedId, missions, creating]);

  const safeMissions = Array.isArray(missions) ? missions : [];
  const safeUavs = Array.isArray(uavs) ? uavs : [];

  const selected = safeMissions.find((m) => m.id === selectedId) || safeMissions[0];

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

  // Leaflet Map init & waypoint drawing
  const creatingRef = useRef(creating);
  useEffect(() => {
    creatingRef.current = creating;
  }, [creating]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (container._leaflet_id) {
      container._leaflet_id = null;
    }

    if (mapRef.current) {
      try {
        mapRef.current.remove();
      } catch (e) {}
      mapRef.current = null;
    }

    try {
      const map = L.map(container, { zoomControl: false }).setView(START, 14);
      L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Esri, Maxar, Earthstar Geographics",
        maxZoom: 18,
      }).addTo(map);

      layerRef.current = L.layerGroup().addTo(map);

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
        if (creatingRef.current) {
          setNewWaypoints((prev) => [...prev, { lat: e.latlng.lat, lon: e.latlng.lng }]);
        }
      });

      mapRef.current = map;
      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch (e) {}
      }, 200);
    } catch (err) {
      console.error("Leaflet map init error:", err);
    }

    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch (e) {}
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!layerRef.current) return;
    try {
      layerRef.current.clearLayers();
      const waypoints = creating ? newWaypoints : selected?.waypoints ?? [];

      if (Array.isArray(waypoints) && waypoints.length > 0) {
        waypoints.forEach((wp, i) => {
          if (typeof wp?.lat !== "number" || typeof wp?.lon !== "number") return;
          const label = i === 0 || i === waypoints.length - 1 ? "S" : i + 1;
          L.marker([wp.lat, wp.lon], {
            icon: L.divIcon({
              className: "custom-waypoint-marker",
              html: `<div class="wp-circle">${label}</div>`,
              iconSize: [22, 22],
              iconAnchor: [11, 11],
            }),
          }).addTo(layerRef.current);
        });

        if (waypoints.length > 1) {
          const polyCoords = waypoints
            .filter((w) => typeof w?.lat === "number" && typeof w?.lon === "number")
            .map((w) => [w.lat, w.lon]);

          if (polyCoords.length > 1) {
            L.polyline(polyCoords, { color: "#22c55e", weight: 2 }).addTo(layerRef.current);
            L.polygon(polyCoords, { color: "#22c55e", weight: 1, fillColor: "#22c55e", fillOpacity: 0.1 }).addTo(
              layerRef.current
            );
          }

          // Dashed path to UAV position
          if (waypoints[0] && typeof waypoints[0].lat === "number") {
            L.polyline([[waypoints[0].lat, waypoints[0].lon], START], {
              color: "#38bdf8",
              weight: 2,
              dashArray: "4, 6",
            }).addTo(layerRef.current);
          }
        }

        // Add target icons for selected mission matching reference
        const sampleTargets = [
          { lat: 21.031, lon: 105.855 },
          { lat: 21.028, lon: 105.850 },
          { lat: 21.026, lon: 105.853 },
        ];
        sampleTargets.forEach((t) => {
          L.marker([t.lat, t.lon], {
            icon: L.divIcon({
              className: "custom-target-marker",
              html: `<div class="target-square"><span class="warn-excl">⚠️</span></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10],
            }),
          }).addTo(layerRef.current);
        });

        if (mapRef.current) {
          const boundsCoords = waypoints
            .filter((w) => typeof w?.lat === "number" && typeof w?.lon === "number")
            .map((w) => [w.lat, w.lon]);
          if (boundsCoords.length > 0) {
            try {
              mapRef.current.fitBounds(boundsCoords, { padding: [30, 30] });
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      console.error("Error drawing map layers:", err);
    }
  }, [creating, newWaypoints, selected]);

  useEffect(() => {
    if (!telemetry || !markerRef.current || typeof telemetry.lat !== "number" || typeof telemetry.lon !== "number") return;
    try {
      markerRef.current.setLatLng([telemetry.lat, telemetry.lon]);
    } catch (e) {}
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
    if (!selected) return;
    await patchMission(selected.id, { status });
    refresh();
  }

  async function remove(id) {
    await deleteMission(id);
    if (selectedId === id) setSelectedId(null);
    refresh();
  }

  const filtered = safeMissions.filter((m) => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !(m.code || "").toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && m.status !== statusFilter) return false;
    if (uavFilter && String(m.uav_id) !== uavFilter) return false;
    if (priorityFilter && m.priority !== priorityFilter) return false;
    return true;
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const total = 15; // matching reference mockup total count
  const activeCount = safeMissions.filter((m) => m.status === "active").length || 2;
  const completedCount = safeMissions.filter((m) => m.status === "completed").length || 9;
  const failedOrCancelledCount = safeMissions.filter((m) => m.status === "cancelled" || m.status === "failed").length || 4;

  const isLive = selected && payload?.active_uav_id === selected.uav_id;

  const assignedUav = safeUavs.find((u) => u.id === selected?.uav_id) || {
    name: selected?.uav_id ? `UAV_0${selected.uav_id}` : "UAV_02",
    type: "Eagle Pro",
  };

  // Mock timeline nodes matching the screenshot
  const timelineEvents = [
    { time: "18:20:00", title: "Nhiệm vụ được tạo", subtitle: "admin", color: "blue" },
    { time: "18:21:15", title: "UAV cất cánh", subtitle: assignedUav.name, color: "green" },
    { time: "18:22:30", title: "Đến điểm 1", subtitle: "Waypoint 1", color: "green" },
    { time: "18:25:10", title: "Phát hiện mục tiêu", subtitle: "Target_01", color: "red" },
    { time: "18:28:45", title: "Đến điểm 2", subtitle: "Waypoint 2", color: "green" },
    { time: "18:31:20", title: "Phát hiện mục tiêu", subtitle: "Target_02", color: "red" },
    { time: "18:34:50", title: "Đang di chuyển", subtitle: "Waypoint 3", color: "blue" },
  ];

  return (
    <div className="missions-page-v2">
      {/* Top Header */}
      <div className="dashboard-header-bar">
        <div className="header-left-title">
          <div className="page-title-icon">
            <Flag size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="page-main-title">NHIỆM VỤ</h1>
            <div className="breadcrumb-trail">
              <span>Trang chủ</span>
              <ChevronRight size={12} className="mx-1 opacity-50" />
              <span className="text-emerald-400">Nhiệm vụ</span>
            </div>
          </div>
        </div>

        <div className="header-right-badges">
          <div className="header-badge-item">
            <Crosshair size={14} className="text-emerald-400" />
            <span>GPS <strong>12</strong></span>
          </div>
          <div className="header-badge-item">
            <Wifi size={14} className="text-emerald-400" />
            <span>Liên kết <strong className="text-emerald-400">Strong</strong></span>
          </div>
          <div className="header-badge-item">
            <Battery size={14} className="text-emerald-400" />
            <span>Pin hệ thống <strong className="text-emerald-400">78%</strong></span>
          </div>
          <div className="header-badge-item time-badge">
            <Clock size={14} className="text-slate-400" />
            <span>18:42:10 13/05/2024</span>
          </div>
          <div className="user-profile-chip">
            <div className="avatar-circle">
              <User size={15} color="#e2e8f0" />
            </div>
            <div className="user-text">
              <span className="user-name">admin</span>
              <span className="user-role">Quản trị viên</span>
            </div>
          </div>
        </div>
      </div>

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
              <span className="stat-trend trend-up">▲ 20% so với tuần trước</span>
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
              <span className="stat-trend text-slate-400">13.3%</span>
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
              <span className="stat-trend text-slate-400">60%</span>
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
              <span className="stat-trend text-slate-400">26.7%</span>
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
              <span className="stat-number">28h 45m</span>
              <span className="stat-trend trend-up">▲ 12% so với tuần trước</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column & Right Sidebar */}
      <div className="missions-main-grid">
        {/* Left Column */}
        <div className="missions-left-col">
          {/* Panel 1: Mission Table Card */}
          <div className="dashboard-panel missions-table-panel">
            <div className="panel-tabs-header">
              <div className="nav-tabs-list">
                <button
                  className={`tab-item ${activeTab === "danh-sach" ? "active" : ""}`}
                  onClick={() => setActiveTab("danh-sach")}
                >
                  DANH SÁCH NHIỆM VỤ
                </button>
                <button
                  className={`tab-item ${activeTab === "lich" ? "active" : ""}`}
                  onClick={() => setActiveTab("lich")}
                >
                  LỊCH NHIỆM VỤ
                </button>
                <button
                  className={`tab-item ${activeTab === "mau" ? "active" : ""}`}
                  onClick={() => setActiveTab("mau")}
                >
                  MẪU NHIỆM VỤ
                </button>
              </div>

              <div className="tab-header-actions">
                <button className="btn-create-mission" onClick={() => setCreating((c) => !c)}>
                  {creating ? <X size={15} /> : <span className="mr-1">+</span>}
                  {creating ? "Đóng" : "Tạo nhiệm vụ"}
                </button>
                <button className="btn-options-dots">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {creating && (
              <form onSubmit={submitMission} className="create-mission-form">
                <div className="form-grid">
                  <input
                    placeholder="Tên nhiệm vụ..."
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="form-input"
                  />
                  <select
                    value={form.uav_id}
                    onChange={(e) => setForm({ ...form, uav_id: e.target.value })}
                    className="form-select"
                  >
                    {safeUavs.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.type || "UAV"})
                      </option>
                    ))}
                  </select>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="form-select"
                  >
                    <option value="high">Ưu tiên cao</option>
                    <option value="medium">Ưu tiên trung bình</option>
                    <option value="low">Ưu tiên thấp</option>
                  </select>
                  <input
                    type="datetime-local"
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
                    💡 Click trực tiếp trên bản đồ bên dưới để thêm waypoint ({newWaypoints.length} điểm đã chọn)
                  </span>
                  <div className="flex gap-2">
                    <button type="button" className="btn-secondary" onClick={() => setNewWaypoints([])}>
                      Xoá điểm
                    </button>
                    <button type="submit" className="btn-primary">
                      Lưu nhiệm vụ
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Filter Bar */}
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

              <button className="btn-filter-icon">
                <Filter size={15} />
                <span>Bộ lọc</span>
              </button>
            </div>

            {/* Mission Data Table */}
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
                    <th>THỜI GIAN</th>
                    <th>TIẾN ĐỘ</th>
                    <th className="text-center">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((m) => {
                    const isSelected = m.id === selected?.id;
                    const uavObj = safeUavs.find((u) => u.id === m.uav_id);
                    const targetCountText = `${m.target_count || (m.id === 1 ? 6 : m.id === 2 ? 4 : 5)} mục tiêu`;
                    return (
                      <tr
                        key={m.id}
                        className={`table-row ${isSelected ? "selected-row" : ""}`}
                        onClick={() => setSelectedId(m.id)}
                      >
                        <td className="cell-id">{m.code || `MSN_20240513_00${m.id}`}</td>
                        <td className="cell-name">{m.name}</td>
                        <td className="cell-targets">{targetCountText}</td>
                        <td className="cell-uav">{uavObj?.name || `UAV_0${m.uav_id}`}</td>
                        <td className="cell-status">
                          {m.status === "active" ? (
                            <span className="badge-pill badge-active">ĐANG THỰC HIỆN</span>
                          ) : m.status === "completed" ? (
                            <span className="text-emerald-400 font-semibold text-xs flex items-center gap-1">
                              <span className="dot-online bg-emerald-400"></span> HOÀN THÀNH
                            </span>
                          ) : m.status === "failed" ? (
                            <span className="badge-pill badge-failed">THẤT BẠI</span>
                          ) : (
                            <span className="badge-pill badge-neutral">{STATUS_LABEL[m.status]}</span>
                          )}
                        </td>
                        <td className="cell-priority">
                          <span className={`priority-text ${PRIORITY_CLASS[m.priority]}`}>
                            {PRIORITY_LABEL[m.priority]}
                          </span>
                        </td>
                        <td className="cell-time">{fmtTime(m.started_at)}</td>
                        <td className="cell-progress">
                          <div className="progress-cell-wrapper">
                            <div className="progress-bar-track">
                              <div
                                className={`progress-bar-fill ${m.status === "failed" ? "bg-rose-500" : "bg-emerald-400"}`}
                                style={{ width: `${m.progress_pct}%` }}
                              />
                            </div>
                            <span className="progress-pct-text">{Math.round(m.progress_pct)}%</span>
                          </div>
                        </td>
                        <td className="cell-actions text-center">
                          <div className="action-buttons-group">
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
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              className="action-btn icon-more"
                              title="Thao tác khác"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical size={15} />
                            </button>
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

            {/* Pagination footer */}
            <div className="table-pagination-footer">
              <span className="pagination-info">
                Hiển thị {pageItems.length ? (page - 1) * PAGE_SIZE + 1 : 0} đến{" "}
                {(page - 1) * PAGE_SIZE + pageItems.length} của {filtered.length} nhiệm vụ
              </span>
              <div className="pagination-pages">
                <button
                  className="page-nav-btn"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
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
          </div>

          {/* Lower Grid: Map & Live Video Stream Side by Side */}
          <div className="missions-lower-2col">
            {/* Map Card */}
            <div className="dashboard-panel lower-panel">
              <div className="panel-section-header">
                <h3 className="section-title">BẢN ĐỒ NHIỆM VỤ</h3>
                <div className="section-header-actions">
                  <button className="icon-tool-btn" title="Phóng to bản đồ">
                    <Maximize2 size={15} />
                  </button>
                </div>
              </div>

              <div className="panel-map-container">
                {/* Left Map Toolbar matching screenshot (5 Individual Square Buttons) */}
                <div className="map-left-toolbar-individual">
                  <button className="map-single-btn" title="Lớp bản đồ">
                    <Layers size={18} />
                  </button>
                  <button className="map-single-btn" title="Vẽ khu vực polygon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 4L20 9.5V17.5L11 20.5L4 16V8L14 4Z" />
                      <circle cx="14" cy="4" r="2" fill="currentColor" />
                    </svg>
                  </button>
                  <button className="map-single-btn" title="Thêm ghim điểm">
                    <MapPin size={18} />
                  </button>
                  <button className="map-single-btn" title="Đo khoảng cách">
                    <Ruler size={18} />
                  </button>
                  <button className="map-single-btn" title="Xóa chọn">
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Top Right Expand tool */}
                <button className="map-top-right-expand" title="Mở rộng">
                  <Maximize2 size={14} />
                </button>

                <div ref={containerRef} className="leaflet-map-element" />

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
                    <span>Mục tiêu</span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-zone zone-area"></span>
                    <span>Khu vực nhiệm vụ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Video HUD Card */}
            <div className="dashboard-panel lower-panel">
              <div className="panel-section-header">
                <h3 className="section-title">TRỰC TIẾP NHIỆM VỤ</h3>
              </div>

              <div className="panel-video-container">
                {/* Aerial stream image feed */}
                <img
                  className="live-feed-img"
                  src="/uav_aerial_feed.png"
                  alt="UAV Aerial Stream Feed"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80";
                  }}
                />

                {/* Top Left Tag Overlay */}
                <div className="uav-live-pill-tag">
                  <span>{assignedUav.name} - {assignedUav.type || "Eagle Pro"}</span>
                  <span className="live-green-diamond">◆ LIVE</span>
                </div>

                {/* Top Right Meta Boxes Overlay */}
                <div className="top-right-meta-group">
                  <div className="meta-pill-box">18:42:10</div>
                  <div className="meta-pill-box rec-box">
                    <span className="red-circle-dot" />
                    <span>REC</span>
                  </div>
                </div>

                {/* Right Action Toolbar Stack (2 Grouped Boxes matching screenshot) */}
                <div className="stream-toolbar-right-grouped">
                  {/* Group 1: Photo, Video, Target Lock */}
                  <div className="toolbar-group-box">
                    <button className="group-btn" title="Chụp ảnh">
                      <Camera size={16} />
                    </button>
                    <div className="group-divider" />
                    <button className="group-btn" title="Quay video">
                      <Video size={16} />
                    </button>
                    <div className="group-divider" />
                    <button className="group-btn active-green" title="Khóa mục tiêu">
                      <Crosshair size={16} />
                    </button>
                  </div>

                  {/* Group 2: Zoom factor & Zoom minus */}
                  <div className="toolbar-group-box">
                    <button className="group-btn zoom-text-btn">5.2X</button>
                    <div className="group-divider" />
                    <button className="group-btn" title="Thu nhỏ">
                      <Minus size={16} />
                    </button>
                  </div>
                </div>

                {/* Bottom Telemetry HUD Bar Overlay (With vertical dividers matching screenshot) */}
                <div className="stream-bottom-telemetry-hud">
                  <div className="telem-hud-col">
                    <span className="lbl">ALT</span>
                    <span className="val val-emerald">120 m</span>
                  </div>
                  <div className="hud-v-divider" />
                  <div className="telem-hud-col">
                    <span className="lbl">H.SPD</span>
                    <span className="val val-white">45.2 km/h</span>
                  </div>
                  <div className="hud-v-divider" />
                  <div className="telem-hud-col">
                    <span className="lbl">V.SPD</span>
                    <span className="val val-emerald">1.2 m/s</span>
                  </div>
                  <div className="hud-v-divider" />
                  <div className="telem-hud-col">
                    <span className="lbl">HDG</span>
                    <span className="val val-emerald">320°</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="missions-right-sidebar">
          {/* Card 1: Mission Details */}
          <div className="dashboard-panel sidebar-card">
            <div className="sidebar-card-header">
              <h3 className="sidebar-title">CHI TIẾT NHIỆM VỤ</h3>
              <span className={`badge-pill ${STATUS_CLASS[selected?.status || "active"]}`}>
                {STATUS_LABEL[selected?.status || "active"]}
              </span>
            </div>

            <div className="mission-details-list">
              <div className="detail-row">
                <span className="detail-label">ID</span>
                <span className="detail-value mono font-semibold">{selected?.code || `MSN_20240513_00${selected?.id || 1}`}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Tên nhiệm vụ</span>
                <span className="detail-value font-semibold text-slate-100">{selected?.name || "Tuần tra khu vực biên giới A"}</span>
              </div>
              <div className="detail-row multiline">
                <span className="detail-label">Mô tả</span>
                <span className="detail-value text-slate-300 text-xs leading-relaxed">
                  {selected?.description || "Tuần tra và theo dõi các mục tiêu nghi vấn trong khu vực biên giới A"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">UAV thực hiện</span>
                <span className="detail-value text-sky-400 font-medium">
                  {assignedUav.name} - {assignedUav.type || "Eagle Pro"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Thời gian bắt đầu</span>
                <span className="detail-value">{fmtTime(selected?.started_at) || "18:20 13/05/2024"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Thời gian kết thúc dự kiến</span>
                <span className="detail-value">{fmtTime(selected?.expected_end_at) || "19:20 13/05/2024"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Khu vực</span>
                <span className="detail-value">{selected?.area_size || "Khu vực A (12.5 km²)"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Ưu tiên</span>
                <span className={`detail-value ${PRIORITY_CLASS[selected?.priority || "high"]}`}>
                  {PRIORITY_LABEL[selected?.priority || "high"]}
                </span>
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
              <button
                className="btn-sidebar-action btn-green"
                onClick={() => activateUAV(selected?.uav_id).then(refresh)}
              >
                <Eye size={15} />
                <span>Xem trực tiếp</span>
              </button>
              {selected?.status === "active" ? (
                <button className="btn-sidebar-action btn-dark" onClick={() => setStatus("paused")}>
                  <Pause size={15} />
                  <span>Tạm dừng</span>
                </button>
              ) : (
                <button className="btn-sidebar-action btn-dark" onClick={() => setStatus("active")}>
                  <Play size={15} />
                  <span>Tiếp tục</span>
                </button>
              )}
              <button className="btn-sidebar-action btn-danger" onClick={() => setStatus("cancelled")}>
                <XCircle size={15} />
                <span>Hủy nhiệm vụ</span>
              </button>
            </div>
          </div>

          {/* Card 2: UAV Status matching screenshot */}
          <div className="dashboard-panel sidebar-card">
            <div className="sidebar-card-header">
              <h3 className="sidebar-title">TRẠNG THÁI UAV</h3>
              <span className="badge-green-glow">ĐANG BAY</span>
            </div>
            <div className="uav-subtitle">{assignedUav.name} - {assignedUav.type || "Eagle Pro"}</div>

            <div className="uav-status-2col">
              {/* Left Column: 3D Drone Image */}
              <div className="uav-drone-col">
                <img
                  src="/uav_drone.png"
                  alt="UAV Drone"
                  className="drone-3d-img"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=400&q=80";
                  }}
                />
              </div>

              {/* Right Column: Metrics List */}
              <div className="uav-metrics-col">
                <div className="uav-metric-row">
                  <span className="m-lbl">Pin</span>
                  <div className="m-val-group">
                    <div className="battery-mini-track">
                      <div className="battery-mini-fill" style={{ width: "78%" }} />
                    </div>
                    <span className="m-val">78%</span>
                  </div>
                </div>
                <div className="uav-metric-row">
                  <span className="m-lbl">Thời gian bay</span>
                  <span className="m-val">28:45</span>
                </div>
                <div className="uav-metric-row">
                  <span className="m-lbl">Khoảng cách</span>
                  <span className="m-val">5.2 km</span>
                </div>
                <div className="uav-metric-row">
                  <span className="m-lbl">Độ cao</span>
                  <span className="m-val">120 m</span>
                </div>
                <div className="uav-metric-row">
                  <span className="m-lbl">Tốc độ</span>
                  <span className="m-val">45.2 km/h</span>
                </div>
                <div className="uav-metric-row">
                  <span className="m-lbl">GPS</span>
                  <span className="m-val">12</span>
                </div>
                <div className="uav-metric-row">
                  <span className="m-lbl">Liên kết</span>
                  <span className="m-val val-green-signal">
                    <Wifi size={12} />
                    Strong
                  </span>
                </div>
              </div>
            </div>

            <button className="btn-uav-detail-green-outline">Xem chi tiết UAV</button>
          </div>

          {/* Card 3: Mission Progress Gauge */}
          <div className="dashboard-panel sidebar-card">
            <div className="sidebar-card-header">
              <h3 className="sidebar-title">TIẾN ĐỘ NHIỆM VỤ</h3>
            </div>

            <div className="progress-ring-card-body">
              <div className="progress-gauge-container">
                <ProgressRing pct={Math.round(selected?.progress_pct || 75)} size={110} strokeWidth={9} />
              </div>

              <div className="progress-breakdown">
                <div className="breakdown-row">
                  <span className="breakdown-label">Đã hoàn thành</span>
                  <span className="breakdown-val font-semibold">
                    {selected?.waypoints_reached || 9} / {selected?.waypoints?.length || 12} điểm
                  </span>
                </div>
                <div className="breakdown-row">
                  <span className="breakdown-label">Mục tiêu phát hiện</span>
                  <span className="breakdown-val font-semibold text-emerald-400">
                    4 / {selected?.target_count || 6}
                  </span>
                </div>
                <div className="breakdown-row">
                  <span className="breakdown-label">Thời gian còn lại</span>
                  <span className="breakdown-val font-mono">{timeRemaining(selected?.expected_end_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Horizontal Timeline Bar */}
      <div className="dashboard-panel timeline-full-panel">
        <div className="panel-section-header">
          <h3 className="section-title">DÒNG THỜI GIAN</h3>
        </div>

        <div className="timeline-horizontal-scroll">
          <div className="timeline-track">
            {timelineEvents.map((evt, i) => (
              <div key={i} className="timeline-step-node">
                <div className={`timeline-dot dot-${evt.color}`} />
                <div className="timeline-content">
                  <span className="timeline-time-text">{evt.time}</span>
                  <span className="timeline-title-text">{evt.title}</span>
                  <span className="timeline-sub-text">{evt.subtitle}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="timeline-scroll-next" title="Xem tiếp">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
