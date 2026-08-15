import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, Layers, Maximize2 } from "lucide-react";

const MAP_CENTER = [21.0285, 105.8542];

export default function FullTacticalMap({ onCursorMove, activeLayers }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapMode, setMapMode] = useState("2D");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(MAP_CENTER, 14);

    // Satellite Tile Layer
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
    }).addTo(map);

    // Labels overlay
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      opacity: 0.6,
    }).addTo(map);

    // Mousemove coordinate tracking
    map.on("mousemove", (e) => {
      onCursorMove?.({
        lat: e.latlng.lat.toFixed(6),
        lng: e.latlng.lng.toFixed(6),
        alt: "48",
      });
    });

    // 1. Flight Paths & UAV Markers
    // UAV_01 (Blue path)
    const uav1Waypoints = [
      [21.036, 105.845],
      [21.032, 105.84],
    ];
    L.polyline(uav1Waypoints, { color: "#3b82f6", weight: 2, dashArray: "4, 4" }).addTo(map);

    uav1Waypoints.forEach((wp, idx) => {
      const wpIcon = L.divIcon({
        className: "custom-wp-num-icon",
        html: `<div class="wp-circle-blue">${idx + 1}</div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker(wp, { icon: wpIcon }).addTo(map);
    });

    const uav1Icon = L.divIcon({
      className: "custom-uav-marker-icon",
      html: `<div class="uav-marker-pill">
              <span class="drone-ic">🛸</span>
              <span class="drone-code">UAV_01</span>
             </div>`,
      iconSize: [60, 24],
      iconAnchor: [30, 12],
    });
    L.marker([21.037, 105.846], { icon: uav1Icon }).addTo(map);

    // UAV_02 (Blue path with 5 waypoints)
    const uav2Waypoints = [
      [21.031, 105.835],
      [21.026, 105.832],
      [21.028, 105.842],
      [21.025, 105.848],
      [21.022, 105.852],
    ];
    L.polyline(uav2Waypoints, { color: "#3b82f6", weight: 2.5 }).addTo(map);

    uav2Waypoints.forEach((wp, idx) => {
      const wpIcon = L.divIcon({
        className: "custom-wp-num-icon",
        html: `<div class="wp-circle-blue">${idx + 1}</div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker(wp, { icon: wpIcon }).addTo(map);
    });

    const uav2Icon = L.divIcon({
      className: "custom-uav-marker-icon",
      html: `<div class="uav-marker-pill active">
              <span class="drone-ic">🛸</span>
              <span class="drone-code">UAV_02</span>
             </div>`,
      iconSize: [60, 24],
      iconAnchor: [30, 12],
    });
    L.marker([21.029, 105.838], { icon: uav2Icon }).addTo(map);

    // UAV_03 (Green path with 4 waypoints)
    const uav3Waypoints = [
      [21.023, 105.862],
      [21.018, 105.868],
      [21.014, 105.872],
      [21.011, 105.876],
    ];
    L.polyline(uav3Waypoints, { color: "#22c55e", weight: 2.5 }).addTo(map);

    uav3Waypoints.forEach((wp, idx) => {
      const wpIcon = L.divIcon({
        className: "custom-wp-num-icon",
        html: `<div class="wp-circle-green">${idx + 1}</div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker(wp, { icon: wpIcon }).addTo(map);
    });

    const uav3Icon = L.divIcon({
      className: "custom-uav-marker-icon",
      html: `<div class="uav-marker-pill green">
              <span class="drone-ic">🛸</span>
              <span class="drone-code">UAV_03</span>
             </div>`,
      iconSize: [60, 24],
      iconAnchor: [30, 12],
    });
    L.marker([21.009, 105.878], { icon: uav3Icon }).addTo(map);

    // 2. Targets Markers
    // TGT_001
    const tgt1Icon = L.divIcon({
      className: "custom-tgt-marker-icon",
      html: `<div class="tgt-pin-circle red">
              <span class="ic">🎯</span>
             </div>
             <span class="tgt-lbl">TGT_001</span>`,
      iconSize: [50, 44],
      iconAnchor: [25, 22],
    });
    L.marker([21.033, 105.852], { icon: tgt1Icon }).addTo(map);

    // TGT_002 with Danger Circle Zone
    const tgt2Icon = L.divIcon({
      className: "custom-tgt-marker-icon",
      html: `<div class="tgt-pin-circle red">
              <span class="ic">🎯</span>
             </div>
             <span class="tgt-lbl">TGT_002</span>`,
      iconSize: [50, 44],
      iconAnchor: [25, 22],
    });
    const tgt2Pos = [21.024, 105.865];
    L.marker(tgt2Pos, { icon: tgt2Icon }).addTo(map);

    // Red Dashed Circle Danger Zone
    L.circle(tgt2Pos, {
      radius: 450,
      color: "#ef4444",
      weight: 1.5,
      dashArray: "6, 6",
      fillColor: "#ef4444",
      fillOpacity: 0.08,
    }).addTo(map);

    // TGT_003
    const tgt3Icon = L.divIcon({
      className: "custom-tgt-marker-icon",
      html: `<div class="tgt-pin-circle red">
              <span class="ic">🎯</span>
             </div>
             <span class="tgt-lbl">TGT_003</span>`,
      iconSize: [50, 44],
      iconAnchor: [25, 22],
    });
    L.marker([21.012, 105.849], { icon: tgt3Icon }).addTo(map);

    // 3. No-Fly Yellow Polygon Zone
    const noFlyPolygon = [
      [21.037, 105.864],
      [21.035, 105.872],
      [21.029, 105.875],
      [21.028, 105.865],
    ];
    L.polygon(noFlyPolygon, {
      color: "#f59e0b",
      weight: 2,
      fillColor: "#f59e0b",
      fillOpacity: 0.2,
    }).addTo(map);

    // Warning icon inside No-Fly Zone
    const warnIcon = L.divIcon({
      className: "custom-warn-poly-icon",
      html: `<div class="warn-center-box">⚠️</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    L.marker([21.032, 105.869], { icon: warnIcon }).addTo(map);

    // 4. Area of Interest Blue Rectangle Zone
    const interestBounds = [
      [21.02, 105.836],
      [21.026, 105.846],
    ];
    L.rectangle(interestBounds, {
      color: "#3b82f6",
      weight: 1.5,
      dashArray: "4, 4",
      fillColor: "#3b82f6",
      fillOpacity: 0.15,
    }).addTo(map);

    // Shield icon inside Interest Zone
    const shieldIcon = L.divIcon({
      className: "custom-shield-poly-icon",
      html: `<div class="shield-center-box">🛡️</div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    L.marker([21.023, 105.841], { icon: shieldIcon }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="full-tactical-map-container">
      {/* Top Left Search Bar */}
      <div className="map-top-left-search">
        <Search size={14} className="ic" />
        <input type="text" placeholder="Tìm kiếm địa điểm..." />
      </div>

      {/* Top Right UAV Dropdown & 2D/3D Mode */}
      <div className="map-top-right-controls">
        <select className="map-uav-select">
          <option>Tất cả UAV</option>
          <option>UAV_01</option>
          <option>UAV_02</option>
          <option>UAV_03</option>
        </select>
        <div className="mode-toggle-group">
          <button className={`mode-btn ${mapMode === "2D" ? "active" : ""}`} onClick={() => setMapMode("2D")}>2D</button>
          <button className={`mode-btn ${mapMode === "3D" ? "active" : ""}`} onClick={() => setMapMode("3D")}>3D</button>
        </div>
      </div>

      {/* Left 7-Button Individual Vertical Toolbar Stack */}
      <div className="map-left-toolbar-7">
        <button className="tb-btn" title="Chọn con trỏ">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l7 18 3-7 7-3L3 3z" />
          </svg>
        </button>
        <button className="tb-btn" title="Căn giữa">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        </button>
        <button className="tb-btn" title="Vẽ vùng">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 4L20 9.5V17.5L11 20.5L4 16V8L14 4Z" />
          </svg>
        </button>
        <button className="tb-btn" title="Vẽ vùng nguy hiểm">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
          </svg>
        </button>
        <button className="tb-btn" title="Ghim tọa độ">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </button>
        <button className="tb-btn" title="Đo khoảng cách">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12h20M7 8v8M17 8v8M12 10v4" />
          </svg>
        </button>
        <button className="tb-btn" title="Lớp bản đồ">
          <Layers size={15} />
        </button>
      </div>

      {/* Right Controls Overlay on Map */}
      <div className="map-right-controls-stack">
        {/* Compass Rose Circle */}
        <div className="compass-rose-box" title="Hướng bắc N">
          <div className="north-arrow-tip">N</div>
          <div className="compass-inner-circle" />
        </div>

        {/* Zoom Stack */}
        <div className="map-zoom-group">
          <button className="zoom-btn" title="Phóng to">+</button>
          <div className="zoom-divider" />
          <button className="zoom-btn" title="Thu nhỏ">—</button>
        </div>

        {/* Center Target Lock */}
        <button className="map-center-btn" title="Căn vị trí">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="8" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* Bottom Right Scale */}
      <div className="map-bottom-scale-box">
        <span className="scale-lbl">500 m</span>
        <div className="scale-line" />
      </div>

      {/* Map Element */}
      <div ref={containerRef} className="full-map-element" />
    </div>
  );
}
