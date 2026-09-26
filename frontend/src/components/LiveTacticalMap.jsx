import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Layers, Plus, Minus } from "lucide-react";

const HOME_POS = [21.0285, 105.8482];
const MAV_POS = [21.0315, 105.8525];
const UAV_POS = [21.0305, 105.8515];
const TARGET_POS = [21.0275, 105.8640];

const uavIcon = L.divIcon({
  className: "tactical-map-marker uav-marker-v2",
  html: `<div class="tactical-pin blue-pin">
          <div class="pin-icon-wrap">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
          </div>
          <span class="pin-tag font-sans font-bold">UAV_02</span>
         </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const mavIcon = L.divIcon({
  className: "tactical-map-marker mav-marker-v2",
  html: `<div class="tactical-pin green-radar-pin">
          <div class="radar-dot-pulse"></div>
          <span class="pin-tag green-tag font-sans font-bold">MAV_02</span>
         </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const homeIcon = L.divIcon({
  className: "tactical-map-marker home-marker-v2",
  html: `<div class="tactical-pin home-pin">
          <div class="home-icon-circle">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            </svg>
          </div>
          <span class="pin-tag home-tag font-sans font-bold">HOME</span>
         </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const targetIcon = L.divIcon({
  className: "tactical-map-marker target-marker-v2",
  html: `<div class="tactical-pin target-red-pin">
          <div class="red-target-reticle">
            <div class="reticle-corner tl"></div>
            <div class="reticle-corner tr"></div>
            <div class="reticle-corner bl"></div>
            <div class="reticle-corner br"></div>
            <div class="house-ic">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              </svg>
            </div>
          </div>
          <span class="pin-tag target-tag font-sans font-bold">MỤC TIÊU 01</span>
         </div>`,
  iconSize: [50, 50],
  iconAnchor: [25, 25],
});

export default function LiveTacticalMap({
  uavPos = UAV_POS,
  targetPos = TARGET_POS,
  distance = "120 m",
  eta = "00:02:15",
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([21.0295, 105.8570], 15);

    // Dark tiles map layer
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        maxNativeZoom: 16,
      }
    ).addTo(map);

    // Add markers
    L.marker(HOME_POS, { icon: homeIcon }).addTo(map);
    L.marker(MAV_POS, { icon: mavIcon }).addTo(map);
    L.marker(uavPos, { icon: uavIcon }).addTo(map);
    L.marker(targetPos, { icon: targetIcon }).addTo(map);

    // Path polylines (Trajectory line)
    L.polyline([HOME_POS, MAV_POS], {
      color: "#3b82f6",
      weight: 2,
      dashArray: "4, 6",
    }).addTo(map);

    L.polyline([MAV_POS, targetPos], {
      color: "#22c55e",
      weight: 2.5,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  return (
    <div className="vti-uav-card-exact font-sans">
      {/* HEADER BAR */}
      <div className="vti-header font-sans">
        <h3 className="vti-title">VỊ TRÍ UAV</h3>
        <div className="vti-header-actions">
          <span className="badge-2d-mode font-sans">2D</span>
        </div>
      </div>

      {/* MAP VIEWPORT & OVERLAY CONTROLS */}
      <div className="vti-map-viewport-wrapper">
        <div ref={containerRef} className="vti-leaflet-container" />

        {/* TOP RIGHT LAYER ICON OVERLAY */}
        <button className="btn-layer-icon-overlay" title="Lớp bản đồ">
          <Layers size={15} color="#cbd5e1" />
        </button>

        {/* RIGHT ZOOM BUTTONS STACK OVERLAY */}
        <div className="vti-zoom-stacked-box">
          <button className="zoom-btn" onClick={handleZoomIn} title="Phóng to">
            <Plus size={16} />
          </button>
          <div className="zoom-divider" />
          <button className="zoom-btn" onClick={handleZoomOut} title="Thu nhỏ">
            <Minus size={16} />
          </button>
        </div>
      </div>

      {/* BOTTOM TELEMETRY FOOTER BAR */}
      <div className="vti-footer-bar font-sans">
        <div className="tele-item">
          <span>Khoảng cách đến mục tiêu: </span>
          <strong className="val-white font-mono">{distance}</strong>
        </div>
        <div className="tele-item">
          <span>ETA: </span>
          <strong className="val-white font-mono">{eta}</strong>
        </div>
      </div>
    </div>
  );
}
