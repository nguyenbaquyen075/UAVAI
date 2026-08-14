import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const HOME_POS = [21.0285, 105.8542];
const UAV_POS = [21.0315, 105.8585];
const TARGET_POS = [21.0345, 105.8620];

const uavIcon = L.divIcon({
  className: "tactical-map-marker uav-marker",
  html: `<div class="marker-box uav">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2">
            <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
          </svg>
          <span>UAV_02</span>
         </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const homeIcon = L.divIcon({
  className: "tactical-map-marker home-marker",
  html: `<div class="marker-box home">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          </svg>
          <span>HOME</span>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const targetIcon = L.divIcon({
  className: "tactical-map-marker target-marker",
  html: `<div class="marker-box target">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="2" x2="12" y2="22"></line>
            <line x1="2" y1="12" x2="22" y2="12"></line>
          </svg>
          <span>MỤC TIÊU 01</span>
         </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

export default function LiveTacticalMap({ uavPos = UAV_POS, targetPos = TARGET_POS, distance = "120 m", eta = "00:02:15" }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const uavMarkerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(uavPos, 14);

    // Dark tiles map layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);

    // Add markers
    L.marker(HOME_POS, { icon: homeIcon }).addTo(map);
    uavMarkerRef.current = L.marker(uavPos, { icon: uavIcon }).addTo(map);
    L.marker(targetPos, { icon: targetIcon }).addTo(map);

    // Path polylines
    L.polyline([HOME_POS, uavPos], { color: "#60a5fa", weight: 2, dashArray: "4, 6" }).addTo(map);
    L.polyline([uavPos, targetPos], { color: "#4ade80", weight: 3 }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (uavMarkerRef.current && uavPos) {
      uavMarkerRef.current.setLatLng(uavPos);
    }
  }, [uavPos]);

  return (
    <div className="tactical-map-card">
      <div className="tactical-map-header">
        <div className="title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>VỊ TRÍ UAV</span>
        </div>
        <div className="map-actions">
          <span className="badge-2d">2D</span>
          <button className="icon-btn" title="Lớp bản đồ">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 12 17 22 12"></polyline>
            </svg>
          </button>
        </div>
      </div>

      <div ref={containerRef} className="tactical-leaflet-container" />

      <div className="tactical-map-footer">
        <div>
          <span>Khoảng cách đến mục tiêu: </span>
          <strong>{distance}</strong>
        </div>
        <div>
          <span>ETA: </span>
          <strong>{eta}</strong>
        </div>
      </div>
    </div>
  );
}
