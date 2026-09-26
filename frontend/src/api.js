// Backend đi qua proxy của Vite (vite.config.js) -> đường dẫn tương đối, cookie đăng nhập tự đi kèm
export const API_BASE = "";

// Phiên hết hạn / bị đăng xuất ở máy khác: mọi request API trả 401 -> báo App hiện lại màn đăng nhập.
// Bọc fetch 1 chỗ ở đây thay vì sửa từng hàm (nhiều hàm có dữ liệu mẫu dự phòng sẽ che mất lỗi 401).
const nativeFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const res = await nativeFetch(input, init);
  const url = typeof input === "string" ? input : input.url;
  if (res.status === 401 && url.startsWith("/api/") && !url.startsWith("/api/auth/login")) {
    window.dispatchEvent(new Event("auth:expired"));
  }
  return res;
};

export async function authMe() {
  const r = await nativeFetch("/api/auth/me");
  return r.ok ? r.json() : null;
}

export async function authLogin(username, password) {
  const r = await nativeFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || "Không đăng nhập được");
  return data;
}

export async function authLogout() {
  await nativeFetch("/api/auth/logout", { method: "POST" }).catch(() => {});
}

export async function authChangePassword(oldPassword, newPassword) {
  const r = await nativeFetch("/api/auth/password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || "Không đổi được mật khẩu");
}

// --- Mock Fallback Data ---
const MOCK_SETTINGS = {
  alert_threshold_m: 10,
  warning_threshold_m: 20,
  max_acceptable_delay: 0.5,
  enabled_classes: ["person", "car", "motorcycle", "bus", "truck"],
};

const MOCK_UAVS = [
  { id: 1, name: "UAV_01", type: "Falcon 8X", serial: "FLC-8812", status: "flying", zone: "Khu vực biên giới A", video_source: "rtsp://192.168.1.100/live" },
  { id: 2, name: "UAV_02", type: "Eagle Pro", serial: "EGL-9021", status: "flying", zone: "Khu vực biên giới B", video_source: "rtsp://192.168.1.101/live" },
  { id: 3, name: "UAV_03", type: "SkyEye 4K", serial: "SKY-4401", status: "ready", zone: "Khu C", video_source: "rtsp://192.168.1.102/live" },
  { id: 4, name: "UAV_04", type: "Phantom 4 RTK", serial: "PHT-1029", status: "flying", zone: "Khu D", video_source: "rtsp://192.168.1.103/live" },
];

const MOCK_MISSIONS = [
  {
    id: 1,
    name: "Tuần tra khu vực biên giới A",
    uav_id: 2,
    priority: "high",
    status: "active",
    progress_pct: 75,
    waypoints_reached: 4,
    waypoints: [
      { lat: 21.0285, lon: 105.8542 },
      { lat: 21.0315, lon: 105.8585 },
      { lat: 21.0345, lon: 105.8620 },
      { lat: 21.0370, lon: 105.8650 },
    ],
    started_at: new Date(Date.now() - 3600_000).toISOString(),
    expected_end_at: new Date(Date.now() + 3600_000).toISOString(),
    description: "Giám sát an ninh khu vực biên giới phía Bắc",
  },
  {
    id: 2,
    name: "Kiểm tra trạm biến áp 110kV",
    uav_id: 1,
    priority: "medium",
    status: "active",
    progress_pct: 50,
    waypoints_reached: 2,
    waypoints: [
      { lat: 21.0276, lon: 105.8512 },
      { lat: 21.0300, lon: 105.8550 },
    ],
    started_at: new Date(Date.now() - 1800_000).toISOString(),
    expected_end_at: new Date(Date.now() + 2700_000).toISOString(),
    description: "Tuần tra định kỳ cơ sở hạ tầng điện lực",
  },
];

const MOCK_STATS = {
  uav_online: 4,
  uav_total: 6,
  mission_running: 2,
  mission_total: 5,
  targets_tracked: 6,
  alert_count_24h: 3,
  recent_alerts: [
    { id: 1, timestamp: "18:41:32", severity: "red", class: "person", distance_m: 8.5 },
    { id: 2, timestamp: "18:40:21", severity: "yellow", class: "car", distance_m: 18.2 },
    { id: 3, timestamp: "18:39:10", severity: "yellow", class: "truck", distance_m: 22.0 },
  ],
};

const MOCK_TARGETS = [
  { id: 1, class: "car", threat_level: "high", status: "tracking", distance_m: 120, first_seen: new Date(Date.now() - 3600_000).toISOString(), last_seen: new Date().toISOString(), uav_id: 2, lat: 21.0345, lon: 105.8620 },
  { id: 2, class: "person", threat_level: "medium", status: "confirmed", distance_m: 45, first_seen: new Date(Date.now() - 2400_000).toISOString(), last_seen: new Date().toISOString(), uav_id: 1, lat: 21.0275, lon: 105.8580 },
  { id: 3, class: "truck", threat_level: "low", status: "new", distance_m: 310, first_seen: new Date(Date.now() - 1200_000).toISOString(), last_seen: new Date().toISOString(), uav_id: 3, lat: 21.0215, lon: 105.8525 },
];

const MOCK_LOGS = [
  { id: 1, timestamp: "2026-08-14 09:15:32", class: "person", distance_m: 8.5, severity: "red" },
  { id: 2, timestamp: "2026-08-14 09:10:21", class: "car", distance_m: 18.2, severity: "yellow" },
  { id: 3, timestamp: "2026-08-14 08:55:10", class: "truck", distance_m: 22.0, severity: "yellow" },
];

// --- API Methods with Graceful Fallbacks ---
export async function getSettings() {
  try {
    const r = await fetch(`${API_BASE}/api/settings`);
    if (r.ok) return await r.json();
  } catch {}
  return MOCK_SETTINGS;
}

export async function updateSettings(patch) {
  try {
    const r = await fetch(`${API_BASE}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (r.ok) return await r.json();
  } catch {}
  return { ...MOCK_SETTINGS, ...patch };
}

export async function getLogs(params = {}) {
  try {
    const qs = new URLSearchParams(params).toString();
    const r = await fetch(`${API_BASE}/api/logs${qs ? `?${qs}` : ""}`);
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return MOCK_LOGS;
}

export function logsExportUrl(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return `${API_BASE}/api/logs/export.csv${qs ? `?${qs}` : ""}`;
}

export async function getTrackHistory(trackId) {
  try {
    const r = await fetch(`${API_BASE}/api/tracks/${trackId}/history`);
    if (r.ok) return await r.json();
  } catch {}
  return [];
}

export async function listUAVs() {
  try {
    const r = await fetch(`${API_BASE}/api/uavs`);
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return MOCK_UAVS;
}

export async function createUAV(uav) {
  try {
    const r = await fetch(`${API_BASE}/api/uavs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uav),
    });
    if (r.ok) return await r.json();
  } catch {}
  const newUav = { id: Date.now(), status: "ready", ...uav };
  MOCK_UAVS.push(newUav);
  return newUav;
}

export async function updateUAV(uavId, patch) {
  try {
    const r = await fetch(`${API_BASE}/api/uavs/${uavId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (r.ok) return await r.json();
  } catch {}
  return { id: uavId, ...patch };
}

export async function deleteUAV(uavId) {
  try {
    const r = await fetch(`${API_BASE}/api/uavs/${uavId}`, { method: "DELETE" });
    if (r.ok) return await r.json();
  } catch {}
  return { success: true };
}

export async function activateUAV(uavId) {
  try {
    const r = await fetch(`${API_BASE}/api/uavs/${uavId}/activate`, { method: "POST" });
    if (r.ok) return await r.json();
  } catch {}
  return { active_uav_id: uavId };
}

export async function getUavTelemetry(uavId) {
  try {
    const r = await fetch(`${API_BASE}/api/uavs/${uavId}/telemetry`);
    if (r.ok) return await r.json();
  } catch {}
  return {
    battery_pct: 78,
    altitude_m: 120,
    speed_kmh: 45.2,
    signal: "Strong",
    lat: 21.0285,
    lon: 105.8542,
  };
}

export async function getUavTrail(uavId) {
  try {
    const r = await fetch(`${API_BASE}/api/uavs/${uavId}/trail`);
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return [
    { lat: 21.0285, lon: 105.8542 },
    { lat: 21.0315, lon: 105.8585 },
    { lat: 21.0345, lon: 105.8620 },
  ];
}

export async function listMissions() {
  try {
    const r = await fetch(`${API_BASE}/api/missions`);
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return MOCK_MISSIONS;
}

export async function createMission(mission) {
  try {
    const r = await fetch(`${API_BASE}/api/missions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mission),
    });
    if (r.ok) return await r.json();
  } catch {}
  const newMission = { id: Date.now(), status: "active", progress_pct: 0, waypoints_reached: 0, ...mission };
  MOCK_MISSIONS.push(newMission);
  return newMission;
}

export async function updateMissionStatus(missionId, status) {
  try {
    const r = await fetch(`${API_BASE}/api/missions/${missionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (r.ok) return await r.json();
  } catch {}
  return { id: missionId, status };
}

export async function deleteMission(missionId) {
  try {
    const r = await fetch(`${API_BASE}/api/missions/${missionId}`, { method: "DELETE" });
    if (r.ok) return await r.json();
  } catch {}
  return { success: true };
}

export async function patchMission(missionId, patch) {
  try {
    const r = await fetch(`${API_BASE}/api/missions/${missionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (r.ok) return await r.json();
  } catch {}
  return { id: missionId, ...patch };
}

export async function getMissionTimeline(missionId) {
  try {
    const r = await fetch(`${API_BASE}/api/missions/${missionId}/timeline`);
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return [
    { type: "created", time: new Date(Date.now() - 3600_000).toISOString(), label: "Khởi tạo nhiệm vụ" },
    { type: "start", time: new Date(Date.now() - 3000_000).toISOString(), label: "UAV cất cánh" },
    { type: "waypoint", time: new Date(Date.now() - 1800_000).toISOString(), label: "Đã đạt Waypoint 1" },
    { type: "alert", time: new Date(Date.now() - 600_000).toISOString(), label: "Cảnh báo đối tượng gần khu vực" },
  ];
}

export async function getOverviewStats() {
  try {
    const r = await fetch(`${API_BASE}/api/stats/overview`);
    if (r.ok) return await r.json();
  } catch {}
  return MOCK_STATS;
}

export async function listTargets() {
  try {
    const r = await fetch(`${API_BASE}/api/targets`);
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return MOCK_TARGETS;
}

export async function patchTarget(targetId, patch) {
  try {
    const r = await fetch(`${API_BASE}/api/targets/${targetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (r.ok) return await r.json();
  } catch {}
  return { id: targetId, ...patch };
}

export async function getTargetEvents(targetId) {
  try {
    const r = await fetch(`${API_BASE}/api/tracks/${targetId}/events`);
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return [
    { id: 1, type: "detected", timestamp: new Date(Date.now() - 3600_000).toISOString(), label: "Phát hiện lần đầu" },
    { id: 2, type: "status_changed", timestamp: new Date(Date.now() - 1800_000).toISOString(), label: "Chuyển sang Đang theo dõi" },
  ];
}

export async function getRecentTargetEvents() {
  try {
    const r = await fetch(`${API_BASE}/api/targets/events/recent`);
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return [
    { id: 1, target_id: 1, type: "detected", timestamp: new Date(Date.now() - 1200_000).toISOString(), class: "car", label: "Phát hiện ô tô khả nghi" },
    { id: 2, target_id: 2, type: "detected", timestamp: new Date(Date.now() - 600_000).toISOString(), class: "person", label: "Phát hiện đối tượng nghi vấn" },
  ];
}

export async function getTargetNotes(targetId) {
  try {
    const r = await fetch(`${API_BASE}/api/targets/${targetId}/notes`);
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return [
    { id: 1, author: "admin", created_at: new Date(Date.now() - 1800_000).toISOString(), text: "Đối tượng di chuyển hướng 320° NW" },
  ];
}

export async function addTargetNote(targetId, text) {
  try {
    const r = await fetch(`${API_BASE}/api/targets/${targetId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (r.ok) return await r.json();
  } catch {}
  return { id: Date.now(), author: "admin", created_at: new Date().toISOString(), text };
}

export async function getTargetSnapshots(targetId) {
  try {
    const r = await fetch(`${API_BASE}/api/targets/${targetId}/snapshots`);
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return [];
}

// --- POI (Bản đồ) ---
export async function listPois() {
  try {
    const r = await fetch(`${API_BASE}/api/pois`);
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return [];
}

export async function createPoi(poi) {
  try {
    const r = await fetch(`${API_BASE}/api/pois`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(poi),
    });
    if (r.ok) return await r.json();
  } catch {}
  return { id: Date.now(), ...poi };
}

export async function deletePoi(poiId) {
  try {
    const r = await fetch(`${API_BASE}/api/pois/${poiId}`, { method: "DELETE" });
    if (r.ok) return await r.json();
  } catch {}
  return { success: true };
}

// --- Notes (Ghi chép) ---
export async function listNotes() {
  try {
    const r = await fetch(`${API_BASE}/api/notes`);
    if (r.ok) {
      const data = await r.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return [];
}

export async function createNote(note) {
  try {
    const r = await fetch(`${API_BASE}/api/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(note),
    });
    if (r.ok) return await r.json();
  } catch {}
  return { id: Date.now(), ...note };
}

export async function patchNote(noteId, patch) {
  try {
    const r = await fetch(`${API_BASE}/api/notes/${noteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (r.ok) return await r.json();
  } catch {}
  return { id: noteId, ...patch };
}

export async function deleteNote(noteId) {
  try {
    const r = await fetch(`${API_BASE}/api/notes/${noteId}`, { method: "DELETE" });
    if (r.ok) return await r.json();
  } catch {}
  return { success: true };
}

// --- Analytics ---
export async function getAnalyticsStats(days = 7) {
  try {
    const r = await fetch(`${API_BASE}/api/stats/analytics?days=${days}`);
    if (r.ok) return await r.json();
  } catch {}
  return null;
}

// --- Tự lái tuần tra (không có dữ liệu mẫu dự phòng: lệnh điều khiển phải báo lỗi thật) ---
async function apiJson(url, options) {
  const r = await fetch(url, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.detail || `Lỗi ${r.status}`);
  return data;
}
const postJson = (url, body) =>
  apiJson(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });

export const autopilotList = () => apiJson("/api/autopilot");
export const autopilotStart = (uavId, opts) => postJson(`/api/autopilot/${uavId}/start`, opts);
export const autopilotCommand = (uavId, action) => postJson(`/api/autopilot/${uavId}/command`, { action });
export const autopilotStop = (uavId) => postJson(`/api/autopilot/${uavId}/stop`);
export const autopilotSimulateThreat = (uavId) => postJson(`/api/autopilot/${uavId}/simulate-threat`);
export const autopilotPlanSweep = (area, spacingM) => postJson("/api/autopilot/plan-sweep", { area, spacing_m: spacingM });
