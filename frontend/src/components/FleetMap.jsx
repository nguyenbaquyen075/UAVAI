import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getUavTelemetry } from "../api";

const BASE = [21.0285, 105.8542];

const STATUS_COLOR = {
  flying: "#4ade80",
  ready: "#60a5fa",
  offline: "#6b7280",
  maintenance: "#facc15",
};

function markerIcon(color) {
  return L.divIcon({
    className: "fleet-marker",
    html: `<span style="color:${color}">🛸</span>`,
    iconSize: [22, 22],
  });
}

export default function FleetMap({ uavs, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    const map = L.map(containerRef.current, { zoomControl: false }).setView(BASE, 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);
    L.marker(BASE, { icon: L.divIcon({ className: "fleet-marker", html: "🏠", iconSize: [20, 20] }) })
      .addTo(map)
      .bindTooltip("Căn cứ", { permanent: false });
    mapRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    if (!mapRef.current || uavs.length === 0) return;
    let cancelled = false;

    async function refresh() {
      const positions = await Promise.all(uavs.map((u) => getUavTelemetry(u.id)));
      if (cancelled) return;
      uavs.forEach((u, i) => {
        const pos = positions[i];
        const latlng = [pos.lat, pos.lon];
        const color = STATUS_COLOR[u.status] ?? "#9aa2b1";
        let marker = markersRef.current[u.id];
        if (!marker) {
          marker = L.marker(latlng, { icon: markerIcon(color) })
            .addTo(mapRef.current)
            .bindTooltip(u.name, { permanent: true, direction: "top", offset: [0, -10] })
            .on("click", () => onSelect?.(u.id));
          markersRef.current[u.id] = marker;
        } else {
          marker.setLatLng(latlng);
          marker.setIcon(markerIcon(color));
        }
      });
    }

    refresh();
    const id = setInterval(refresh, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [uavs, onSelect]);

  const counts = uavs.reduce((acc, u) => ({ ...acc, [u.status]: (acc[u.status] ?? 0) + 1 }), {});

  return (
    <div className="fleet-map-wrap">
      <div ref={containerRef} className="fleet-map" />
      <div className="fleet-legend">
        <span><i style={{ background: STATUS_COLOR.flying }} /> Đang bay ({counts.flying ?? 0})</span>
        <span><i style={{ background: STATUS_COLOR.ready }} /> Sẵn sàng ({counts.ready ?? 0})</span>
        <span><i style={{ background: STATUS_COLOR.offline }} /> Offline ({counts.offline ?? 0})</span>
        <span><i style={{ background: STATUS_COLOR.maintenance }} /> Bảo trì ({counts.maintenance ?? 0})</span>
      </div>
    </div>
  );
}
