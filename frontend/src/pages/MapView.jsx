import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getUavTrail } from "../api";

const START = [21.0285, 105.8542];

// divIcon để tránh lỗi path ảnh marker mặc định của Leaflet khi bundle qua Vite
const droneIcon = L.divIcon({ className: "drone-marker", html: "🛰️", iconSize: [24, 24] });

export default function MapView({ payload }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);

  useEffect(() => {
    const map = L.map(containerRef.current).setView(START, 16);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);

    mapRef.current = map;
    markerRef.current = L.marker(START, { icon: droneIcon }).addTo(map);
    polylineRef.current = L.polyline([], { color: "#4ade80" }).addTo(map);

    return () => map.remove();
  }, []);

  useEffect(() => {
    const uavId = payload?.active_uav_id;
    if (uavId == null) return;
    getUavTrail(uavId).then((trail) => {
      const latlngs = trail.map((p) => [p.lat, p.lon]);
      polylineRef.current.setLatLngs(latlngs);
      if (latlngs.length) mapRef.current.panTo(latlngs[latlngs.length - 1]);
    });
  }, [payload?.active_uav_id]);

  useEffect(() => {
    const gps = payload?.uav_status?.gps;
    if (!gps || !mapRef.current) return;
    const latlng = [gps.lat, gps.lon];
    markerRef.current.setLatLng(latlng);
    polylineRef.current.addLatLng(latlng);
  }, [payload]);

  return (
    <div className="map-wrap">
      <p className="muted map-note">
        Vị trí UAV hiện đang giả lập (chưa nối telemetry thật) — xem README.
      </p>
      <div ref={containerRef} className="map-container" />
    </div>
  );
}
