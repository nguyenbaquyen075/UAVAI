import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const START = [21.0285, 105.8542];

const THREAT_COLOR = { high: "#f87171", medium: "#facc15", low: "#60a5fa" };
const CLASS_ICON = {
  person: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>',
  car: '<path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle cx="17" cy="17" r="2"></circle>',
  motorcycle:
    '<circle cx="18.5" cy="17.5" r="3.5"></circle><circle cx="5.5" cy="17.5" r="3.5"></circle><circle cx="15" cy="5" r="1"></circle><path d="M12 17.5V14l-3-3 4-3 2 3h2"></path>',
  bus: '<path d="M8 6v6"></path><path d="M15 6v6"></path><path d="M2 12h19.6"></path><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"></path><circle cx="7" cy="18" r="2"></circle><path d="M9 18h5"></path><circle cx="16" cy="18" r="2"></circle>',
  truck:
    '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"></path><path d="M15 18H9"></path><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"></path><circle cx="17" cy="18" r="2"></circle><circle cx="7" cy="18" r="2"></circle>',
};
const UNKNOWN_ICON =
  '<circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path>';

function targetIcon(target) {
  const color = THREAT_COLOR[target.threat_level] ?? "#9aa2b1";
  const inner = CLASS_ICON[target.class] ?? UNKNOWN_ICON;
  return L.divIcon({
    className: "target-marker",
    html: `<span style="border-color:${color}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">${inner}</svg></span>`,
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
    uavMarkerRef.current = L.marker(START, {
      icon: L.divIcon({
        className: "drone-marker",
        html: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"></path></svg>',
        iconSize: [20, 20],
      }),
    }).addTo(map);
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
