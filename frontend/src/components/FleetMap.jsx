import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ChevronDown, Home, Layers, Maximize2, Minimize2 } from "lucide-react";
import { getUavTelemetry } from "../api";

const BASE = [21.0285, 105.8542];

const STATUS_COLOR = {
  flying: "#4ade80",
  ready: "#60a5fa",
  offline: "#6b7280",
  maintenance: "#facc15",
};

function markerIcon(color, name, isSelected) {
  return L.divIcon({
    className: "fleet-marker-custom",
    html: `
      <div className="fleet-drone-badge ${isSelected ? "selected" : ""}" style="border-color: ${color}; color: ${color};">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
        </svg>
        <span>${name}</span>
      </div>
    `,
    iconSize: [80, 24],
    iconAnchor: [40, 12],
  });
}

export default function FleetMap({ uavs = [], onSelect }) {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const polylineRef = useRef(null);
  const [mapMode, setMapMode] = useState("2D");
  const [isFull, setIsFull] = useState(false);

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) {
      wrapperRef.current.requestFullscreen().catch(() => {});
      setIsFull(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFull(false);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(BASE, 14);

    // Use Esri Satellite Imagery Tiles
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        maxNativeZoom: 18,
      }
    ).addTo(map);

    // Add Base station marker (Red Home Pin)
    const baseIcon = L.divIcon({
      className: "base-station-marker",
      html: `
        <div className="base-home-pin-red">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" stroke-width="2">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    L.marker(BASE, { icon: baseIcon }).addTo(map);
    mapRef.current = map;

    return () => map.remove();
  }, []);

  useEffect(() => {
    if (!mapRef.current || uavs.length === 0) return;
    let cancelled = false;

    async function refresh() {
      const positions = await Promise.all(uavs.map((u) => getUavTelemetry(u.id)));
      if (cancelled) return;

      const pathCoords = [];

      uavs.forEach((u, i) => {
        const pos = positions[i] || { lat: BASE[0] + i * 0.003, lon: BASE[1] + i * 0.004 };
        const latlng = [pos.lat, pos.lon];
        pathCoords.push(latlng);
        const color = STATUS_COLOR[u.status] ?? "#9aa2b1";
        let marker = markersRef.current[u.id];
        if (!marker) {
          marker = L.marker(latlng, { icon: markerIcon(color, u.name || `UAV_0${u.id}`, i === 1) })
            .addTo(mapRef.current)
            .on("click", () => onSelect?.(u.id));
          markersRef.current[u.id] = marker;
        } else {
          marker.setLatLng(latlng);
          marker.setIcon(markerIcon(color, u.name || `UAV_0${u.id}`, i === 1));
        }
      });

      if (pathCoords.length > 1) {
        if (polylineRef.current) mapRef.current.removeLayer(polylineRef.current);
        polylineRef.current = L.polyline(pathCoords, {
          color: "#4ade80",
          weight: 2,
          opacity: 0.8,
        }).addTo(mapRef.current);
      }
    }

    refresh();
    const id = setInterval(refresh, 2500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [uavs, onSelect]);

  const counts = uavs.reduce((acc, u) => ({ ...acc, [u.status]: (acc[u.status] ?? 0) + 1 }), {});

  return (
    <div ref={wrapperRef} className="fleet-map-container-wrap">
      <div className="fleet-map-top-bar">
        <span className="card-title">VỊ TRÍ UAV</span>
        <div className="fleet-map-right-controls">
          <div className="select-pill">
            <select onChange={(e) => onSelect?.(Number(e.target.value))}>
              <option value="">Tất cả UAV</option>
              {uavs.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="select-arrow" />
          </div>
          <button className="top-hud-act-btn" onClick={toggleFullscreen} title="Toàn màn hình BẢN ĐỒ">
            {isFull ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      <div className="fleet-map-canvas-area">
        <div className="map-top-right-tools">
          <button
            className={`mode-btn ${mapMode === "2D" ? "active" : ""}`}
            onClick={() => setMapMode("2D")}
          >
            2D
          </button>
          <button className="mode-btn layer-btn" title="Lớp bản đồ">
            <Layers size={14} />
          </button>
        </div>

        <div ref={containerRef} className="fleet-map-leaflet" />

        <div className="map-zoom-stack">
          <button className="map-z-btn" onClick={() => mapRef.current?.zoomIn()}>
            +
          </button>
          <button className="map-z-btn" onClick={() => mapRef.current?.zoomOut()}>
            -
          </button>
        </div>
      </div>

      {/* BOTTOM LEGEND STRIP (EXACT USER SCREENSHOT) */}
      <div className="fleet-legend-bar">
        <span className="legend-item">
          <i className="leg-dot green" /> Đang bay ({counts.flying ?? 4})
        </span>
        <span className="legend-item">
          <i className="leg-dot blue" /> Sẵn sàng ({counts.ready ?? 1})
        </span>
        <span className="legend-item">
          <i className="leg-dot gray" /> Offline ({counts.offline ?? 1})
        </span>
        <span className="legend-item">
          <i className="leg-dot yellow" /> Bảo trì ({counts.maintenance ?? 1})
        </span>
        <span className="legend-item home-red">
          <Home size={13} color="#ef4444" fill="#ef4444" /> Căn cứ
        </span>
      </div>
    </div>
  );
}
