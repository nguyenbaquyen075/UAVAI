import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const droneIcon = L.divIcon({ className: "drone-marker", html: "🛰️", iconSize: [20, 20] });

export default function MiniMap({ waypoints = [], uavPosition }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    const map = L.map(containerRef.current, { zoomControl: false }).setView([21.0285, 105.8542], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    markerRef.current = L.marker([21.0285, 105.8542], { icon: droneIcon }).addTo(map);
    mapRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    if (!layerRef.current) return;
    layerRef.current.clearLayers();
    waypoints.forEach((wp, i) => {
      L.marker([wp.lat, wp.lon]).addTo(layerRef.current).bindTooltip(String(i + 1), { permanent: true });
    });
    if (waypoints.length > 1) {
      L.polyline(waypoints.map((w) => [w.lat, w.lon]), { color: "#4ade80" }).addTo(layerRef.current);
    }
    if (waypoints.length && mapRef.current) {
      mapRef.current.fitBounds(waypoints.map((w) => [w.lat, w.lon]), { padding: [20, 20] });
    }
  }, [waypoints]);

  useEffect(() => {
    if (!uavPosition || !markerRef.current) return;
    markerRef.current.setLatLng([uavPosition.lat, uavPosition.lon]);
  }, [uavPosition]);

  return <div ref={containerRef} className="mini-map" />;
}
