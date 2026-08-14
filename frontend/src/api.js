export const API_BASE = "http://localhost:8001";

export async function getSettings() {
  const r = await fetch(`${API_BASE}/api/settings`);
  return r.json();
}

export async function updateSettings(patch) {
  const r = await fetch(`${API_BASE}/api/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return r.json();
}

export async function getLogs(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const r = await fetch(`${API_BASE}/api/logs${qs ? `?${qs}` : ""}`);
  return r.json();
}

export async function getTrackHistory(trackId) {
  const r = await fetch(`${API_BASE}/api/tracks/${trackId}/history`);
  return r.json();
}

export async function listUAVs() {
  const r = await fetch(`${API_BASE}/api/uavs`);
  return r.json();
}

export async function createUAV(uav) {
  const r = await fetch(`${API_BASE}/api/uavs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(uav),
  });
  return r.json();
}

export async function updateUAV(uavId, patch) {
  const r = await fetch(`${API_BASE}/api/uavs/${uavId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return r.json();
}

export async function deleteUAV(uavId) {
  const r = await fetch(`${API_BASE}/api/uavs/${uavId}`, { method: "DELETE" });
  return r.json();
}

export async function activateUAV(uavId) {
  const r = await fetch(`${API_BASE}/api/uavs/${uavId}/activate`, { method: "POST" });
  return r.json();
}

export async function getUavTelemetry(uavId) {
  const r = await fetch(`${API_BASE}/api/uavs/${uavId}/telemetry`);
  return r.json();
}

export async function getUavTrail(uavId) {
  const r = await fetch(`${API_BASE}/api/uavs/${uavId}/trail`);
  return r.json();
}

export async function listMissions() {
  const r = await fetch(`${API_BASE}/api/missions`);
  return r.json();
}

export async function createMission(mission) {
  const r = await fetch(`${API_BASE}/api/missions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mission),
  });
  return r.json();
}

export async function updateMissionStatus(missionId, status) {
  const r = await fetch(`${API_BASE}/api/missions/${missionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return r.json();
}

export async function deleteMission(missionId) {
  const r = await fetch(`${API_BASE}/api/missions/${missionId}`, { method: "DELETE" });
  return r.json();
}

export async function patchMission(missionId, patch) {
  const r = await fetch(`${API_BASE}/api/missions/${missionId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return r.json();
}

export async function getMissionTimeline(missionId) {
  const r = await fetch(`${API_BASE}/api/missions/${missionId}/timeline`);
  return r.json();
}

export async function getOverviewStats() {
  const r = await fetch(`${API_BASE}/api/stats/overview`);
  return r.json();
}

export async function listTargets() {
  const r = await fetch(`${API_BASE}/api/targets`);
  return r.json();
}

export async function patchTarget(targetId, patch) {
  const r = await fetch(`${API_BASE}/api/targets/${targetId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return r.json();
}

export async function getTargetEvents(targetId) {
  const r = await fetch(`${API_BASE}/api/targets/${targetId}/events`);
  return r.json();
}

export async function getRecentTargetEvents() {
  const r = await fetch(`${API_BASE}/api/targets/events/recent`);
  return r.json();
}

export async function getTargetNotes(targetId) {
  const r = await fetch(`${API_BASE}/api/targets/${targetId}/notes`);
  return r.json();
}

export async function addTargetNote(targetId, text) {
  const r = await fetch(`${API_BASE}/api/targets/${targetId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return r.json();
}

export async function getTargetSnapshots(targetId) {
  const r = await fetch(`${API_BASE}/api/targets/${targetId}/snapshots`);
  return r.json();
}
