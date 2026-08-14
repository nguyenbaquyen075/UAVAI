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

const PLANE_SVG_PATH =
  "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z";

function markerIcon(color) {
  return L.divIcon({
    className: "fleet-marker",
    html: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="${PLANE_SVG_PATH}"></path></svg>`,
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
    L.marker(BASE, {
      icon: L.divIcon({
        className: "fleet-marker",
        html: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e6e8ec" stroke-width="2"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>`,
        iconSize: [20, 20],
      }),
    })
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
