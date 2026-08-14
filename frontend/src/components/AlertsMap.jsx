import { useEffect, useRef } from "react";
import { Maximize2 } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const CENTER = [21.0285, 105.8542]; // trùng CENTER_LAT/LON giả lập ở backend/telemetry.py

function markerIcon(severity) {
  const color = severity === "red" ? "#ef4444" : "#facc15";
  return L.divIcon({
    className: "custom-leaflet-alert-icon",
    html: `<div class="alert-map-marker ${severity === "red" ? "red" : "yellow"}"><span class="marker-dot" style="background:${color}"></span></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

// ponytail: alert_events không lưu lat/lon riêng — vị trí hiển thị được suy ra từ mục tiêu (targets)
// khớp track_id + uav_id (toạ độ ƯỚC TÍNH, xem backend/telemetry.py estimate_target_position).
// Cảnh báo không khớp được mục tiêu nào (đã hết track hoặc dữ liệu cũ) sẽ không có điểm trên bản đồ.
export default function AlertsMap({ alerts = [], targets = [], selectedAlert, onSelectAlert }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const groupRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, { center: CENTER, zoom: 13, zoomControl: false, attributionControl: false });
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 18 }).addTo(map);
    groupRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.clearLayers();
    alerts.forEach((a) => {
      const t = targets.find((tg) => tg.track_id === a.track_id && tg.uav_id === a.uav_id);
      if (!t || t.lat == null) return;
      const m = L.marker([t.lat, t.lon], { icon: markerIcon(a.severity) }).addTo(groupRef.current);
      m.bindTooltip(`${a.class} · ${a.distance_m}m`);
      m.on("click", () => onSelectAlert && onSelectAlert(a.id));
    });
  }, [alerts, targets]);

  const plotted = alerts.filter((a) => targets.some((tg) => tg.track_id === a.track_id && tg.uav_id === a.uav_id && tg.lat != null)).length;

  return (
    <div className="alerts-map-card">
      <div className="map-card-header">
        <span className="card-title">VỊ TRÍ CẢNH BÁO ({plotted}/{alerts.length} định vị được)</span>
        <div className="map-header-actions">
          <button className="icon-btn" title="Phóng to"><Maximize2 size={14} /></button>
        </div>
      </div>

      <div className="alerts-leaflet-wrap">
        <div ref={mapContainerRef} className="alerts-leaflet-container"></div>
      </div>

      <div className="alerts-map-legend">
        <div className="lgd-item"><span className="dot red">●</span> Nguy hiểm</div>
        <div className="lgd-item"><span className="dot yellow">●</span> Cảnh báo</div>
      </div>
    </div>
  );
}
