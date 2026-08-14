import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const droneIcon = L.divIcon({
  className: "tactical-drone-marker",
  html: `
    <div className="drone-pin-wrapper">
      <div className="drone-pulse-ring"></div>
      <div className="drone-box-indicator">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
        </svg>
      </div>
    </div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const DEFAULT_WAYPOINTS = [
  { lat: 21.0285, lon: 105.8542, label: "2" },
  { lat: 21.0315, lon: 105.8592, label: "3" },
  { lat: 21.0345, lon: 105.8642, label: "3" },
  { lat: 21.0365, lon: 105.8712, label: "4" },
  { lat: 21.0310, lon: 105.8692, label: "3" },
  { lat: 21.0260, lon: 105.8662, label: "5" },
  { lat: 21.0220, lon: 105.8592, label: "3" },
];

export default function MiniMap({ waypoints = DEFAULT_WAYPOINTS, uavPosition }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const markerRef = useRef(null);
  const [mapMode, setMapMode] = useState("2D");

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([21.0285, 105.8542], 14);

    // Use Esri World Imagery Satellite Tiles for realistic tactical map
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        maxNativeZoom: 18,
      }
    ).addTo(map);

    layerRef.current = L.layerGroup().addTo(map);
    markerRef.current = L.marker([21.0285, 105.8542], { icon: droneIcon }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (!layerRef.current || !mapRef.current) return;
    layerRef.current.clearLayers();

    const points = waypoints.length > 0 ? waypoints : DEFAULT_WAYPOINTS;

    points.forEach((wp, index) => {
      const numIcon = L.divIcon({
        className: "wp-num-marker",
        html: `<div className="wp-badge">${wp.label || index + 1}</div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      L.marker([wp.lat, wp.lon], { icon: numIcon }).addTo(layerRef.current);
    });

    if (points.length > 1) {
      const coords = points.map((w) => [w.lat, w.lon]);
      L.polyline(coords, {
        color: "#4ade80",
        weight: 2,
        opacity: 0.9,
      }).addTo(layerRef.current);
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map((w) => [w.lat, w.lon]));
      mapRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [waypoints]);

  useEffect(() => {
    if (!markerRef.current) return;
    const pos = uavPosition || { lat: 21.0315, lon: 105.8592 };
    markerRef.current.setLatLng([pos.lat, pos.lon]);
  }, [uavPosition]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();

  return (
    <div className="mini-map-wrapper">
      <div className="mini-map-controls-top">
        <button
          className={`map-mode-btn ${mapMode === "2D" ? "active" : ""}`}
          onClick={() => setMapMode("2D")}
        >
          2D
        </button>
        <button
          className={`map-mode-btn ${mapMode === "3D" ? "active" : ""}`}
          onClick={() => setMapMode("3D")}
        >
          3D
        </button>
      </div>

      <div ref={containerRef} className="mini-map-container" />

      <div className="mini-map-controls-bottom">
        <button className="map-zoom-btn" onClick={handleZoomIn}>
          +
        </button>
        <button className="map-zoom-btn" onClick={handleZoomOut}>
          -
        </button>
      </div>
    </div>
  );
}
