import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const START = [21.0285, 105.8542];

const THREAT_COLOR = { high: "#f87171", medium: "#facc15", low: "#60a5fa" };
const CLASS_ICON = { person: "🧍", car: "🚗", motorcycle: "🏍️", bus: "🚌", truck: "🚚" };

function targetIcon(target) {
  const color = THREAT_COLOR[target.threat_level] ?? "#9aa2b1";
  const icon = CLASS_ICON[target.class] ?? "❓";
  return L.divIcon({
    className: "target-marker",
    html: `<span style="border-color:${color}">${icon}</span>`,
    iconSize: [28, 28],
  });
}

export default function TargetsMap({ targets, uavPosition, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const uavMarkerRef = useRef(null);

  useEffect(() => {
    const map = L.map(containerRef.current, { zoomControl: false }).setView(START, 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    uavMarkerRef.current = L.marker(START, { icon: L.divIcon({ className: "drone-marker", html: "🛸", iconSize: [20, 20] }) }).addTo(map);
    mapRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    if (!layerRef.current) return;
    layerRef.current.clearLayers();
    const withGps = targets.filter((t) => t.lat != null && t.lon != null);
    withGps.forEach((t) => {
      L.marker([t.lat, t.lon], { icon: targetIcon(t) })
        .addTo(layerRef.current)
        .bindTooltip(`TGT_${t.id}`, { permanent: true, direction: "top", offset: [0, -12] })
        .on("click", () => onSelect?.(t.id));
    });
    if (withGps.length && mapRef.current) {
      mapRef.current.fitBounds(withGps.map((t) => [t.lat, t.lon]), { padding: [40, 40], maxZoom: 17 });
    }
  }, [targets, onSelect]);

  useEffect(() => {
    if (!uavPosition || !uavMarkerRef.current) return;
    uavMarkerRef.current.setLatLng([uavPosition.lat, uavPosition.lon]);
  }, [uavPosition]);

  return <div ref={containerRef} className="targets-map" />;
}
