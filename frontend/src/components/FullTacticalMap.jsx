import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MAP_CENTER = [21.0285, 105.8542];

// Custom icons
const uavMarkerIcon = (id, color = "#60a5fa") =>
  L.divIcon({
    className: "map-tactical-marker",
    html: `<div class="drone-pin" style="border-color: ${color}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5">
              <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
            </svg>
            <span>${id}</span>
           </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

const tgtMarkerIcon = (id) =>
  L.divIcon({
    className: "map-tactical-marker",
    html: `<div class="target-pin">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="2" x2="12" y2="22"></line>
              <line x1="2" y1="12" x2="22" y2="12"></line>
            </svg>
            <span>${id}</span>
           </div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });

const wpNumberIcon = (num, color = "#60a5fa") =>
  L.divIcon({
    className: "wp-num-marker",
    html: `<div class="wp-circle" style="background:${color}">${num}</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

export default function FullTacticalMap({ onCursorMove, activeLayers }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef({
    satellite: null,
    streets: null,
    nofly: null,
    hazard: null,
    uavs: null,
    targets: null,
  });

  const [mapMode, setMapMode] = useState("2D"); // 2D | 3D
  const [selectedTool, setSelectedTool] = useState("pointer");

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(MAP_CENTER, 14);

    // Tile Layers
    const satTile = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
    }).addTo(map);

    const streetTile = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
    }).addTo(map);

    layersRef.current.satellite = satTile;
    layersRef.current.streets = streetTile;

    // Feature Groups
    const noflyGroup = L.featureGroup().addTo(map);
    const hazardGroup = L.featureGroup().addTo(map);
    const uavGroup = L.featureGroup().addTo(map);
    const targetGroup = L.featureGroup().addTo(map);

    layersRef.current.nofly = noflyGroup;
    layersRef.current.hazard = hazardGroup;
    layersRef.current.uavs = uavGroup;
    layersRef.current.targets = targetGroup;

    // --- 1. Drawn No-Fly Zone (Yellow Polygon) ---
    const noFlyCoords = [
      [21.0360, 105.8570],
      [21.0385, 105.8600],
      [21.0350, 105.8635],
      [21.0325, 105.8590],
    ];
    L.polygon(noFlyCoords, {
      color: "#eab308",
      fillColor: "#eab308",
      fillOpacity: 0.25,
      weight: 2,
      dashArray: "6, 6",
    }).addTo(noflyGroup);

    // Warning marker on No-Fly zone
    L.marker([21.0355, 105.8598], {
      icon: L.divIcon({
        className: "nofly-badge-marker",
        html: `<div class="nofly-badge">⚠️</div>`,
        iconSize: [24, 24],
      }),
    }).addTo(noflyGroup);

    // --- 2. Interest Zone (Blue Polygon with Shield) ---
    const interestCoords = [
      [21.0230, 105.8450],
      [21.0260, 105.8490],
      [21.0210, 105.8505],
      [21.0185, 105.8465],
    ];
    L.polygon(interestCoords, {
      color: "#3b82f6",
      fillColor: "#3b82f6",
      fillOpacity: 0.2,
      weight: 2,
    }).addTo(hazardGroup);

    L.marker([21.0220, 105.8478], {
      icon: L.divIcon({
        className: "shield-badge-marker",
        html: `<div class="shield-badge">🛡️</div>`,
        iconSize: [24, 24],
      }),
    }).addTo(hazardGroup);

    // --- 3. UAVs & Flight Trajectories ---
    // UAV_01
    const uav1Pos = [21.0345, 105.8510];
    L.marker(uav1Pos, { icon: uavMarkerIcon("UAV_01", "#60a5fa") }).addTo(uavGroup);

    // UAV_02
    const uav2Pos = [21.0285, 105.8480];
    L.marker(uav2Pos, { icon: uavMarkerIcon("UAV_02", "#60a5fa") }).addTo(uavGroup);

    // UAV_03
    const uav3Pos = [21.0210, 105.8610];
    L.marker(uav3Pos, { icon: uavMarkerIcon("UAV_03", "#4ade80") }).addTo(uavGroup);

    // Blue Flight Path (UAV 1 & 2)
    const bluePath = [
      [21.0345, 105.8510],
      [21.0320, 105.8495],
      [21.0300, 105.8470],
      [21.0285, 105.8480],
      [21.0255, 105.8520],
    ];
    L.polyline(bluePath, { color: "#60a5fa", weight: 3 }).addTo(uavGroup);

    bluePath.forEach((pt, idx) => {
      L.marker(pt, { icon: wpNumberIcon(idx + 1, "#3b82f6") }).addTo(uavGroup);
    });

    // Green Flight Path (UAV 3)
    const greenPath = [
      [21.0210, 105.8610],
      [21.0240, 105.8580],
      [21.0260, 105.8550],
      [21.0275, 105.8580],
    ];
    L.polyline(greenPath, { color: "#4ade80", weight: 3 }).addTo(uavGroup);

    greenPath.forEach((pt, idx) => {
      L.marker(pt, { icon: wpNumberIcon(idx + 1, "#22c55e") }).addTo(uavGroup);
    });

    // --- 4. Targets & Warning Radii ---
    // TGT_001
    L.marker([21.0320, 105.8565], { icon: tgtMarkerIcon("TGT_001") }).addTo(targetGroup);

    // TGT_002 with Danger Radius Circle
    const tgt2Pos = [21.0275, 105.8580];
    L.marker(tgt2Pos, { icon: tgtMarkerIcon("TGT_002") }).addTo(targetGroup);
    L.circle(tgt2Pos, {
      radius: 250,
      color: "#ef4444",
      fillColor: "#ef4444",
      fillOpacity: 0.1,
      dashArray: "4, 6",
      weight: 1.5,
    }).addTo(targetGroup);

    // Connect line from Green Waypoint to TGT_002
    L.polyline([greenPath[greenPath.length - 1], tgt2Pos], { color: "#ef4444", weight: 2, dashArray: "4, 4" }).addTo(targetGroup);

    // TGT_003
    L.marker([21.0215, 105.8525], { icon: tgtMarkerIcon("TGT_003") }).addTo(targetGroup);

    // --- Mouse Move Listener for Cursor Coordinates ---
    map.on("mousemove", (e) => {
      if (onCursorMove) {
        onCursorMove({
          lat: e.latlng.lat.toFixed(6),
          lng: e.latlng.lng.toFixed(6),
          alt: Math.floor(40 + Math.random() * 15),
        });
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync active layer toggles
  useEffect(() => {
    if (!layersRef.current || !mapRef.current) return;
    const { nofly, hazard, uavs, targets } = layersRef.current;

    if (activeLayers) {
      if (nofly) activeLayers.nofly ? mapRef.current.addLayer(nofly) : mapRef.current.removeLayer(nofly);
      if (hazard) activeLayers.hazard ? mapRef.current.addLayer(hazard) : mapRef.current.removeLayer(hazard);
      if (uavs) activeLayers.uavs ? mapRef.current.addLayer(uavs) : mapRef.current.removeLayer(uavs);
      if (targets) activeLayers.targets ? mapRef.current.addLayer(targets) : mapRef.current.removeLayer(targets);
    }
  }, [activeLayers]);

  return (
    <div className="full-tactical-map-wrap">
      {/* Top Map Toolbar Overlays */}
      <div className="map-top-bar">
        <div className="map-search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" placeholder="Tìm kiếm địa điểm..." className="search-input" />
        </div>

        <div className="map-top-actions">
          <select className="uav-filter-select" defaultValue="all">
            <option value="all">Tất cả UAV</option>
            <option value="uav1">UAV_01 - Falcon 8X</option>
            <option value="uav2">UAV_02 - Eagle Pro</option>
            <option value="uav3">UAV_03 - SkyEye 4K</option>
          </select>

          <div className="dimension-toggles">
            <button
              className={`dim-btn ${mapMode === "2D" ? "active" : ""}`}
              onClick={() => setMapMode("2D")}
            >
              2D
            </button>
            <button
              className={`dim-btn ${mapMode === "3D" ? "active" : ""}`}
              onClick={() => setMapMode("3D")}
            >
              3D
            </button>
          </div>

          <div className="compass-rose" title="Hướng Bắc (North)">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="16" fill="#10141d" stroke="#334155" strokeWidth="2" />
              <polygon points="18 4 23 18 18 15 13 18 18 4" fill="#ef4444" />
              <polygon points="18 32 23 18 18 21 13 18 18 32" fill="#94a3b8" />
              <text x="18" y="11" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">N</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Left Map Vertical Toolbar Overlay */}
      <div className="map-left-toolbar">
        <button
          className={`map-tool-btn ${selectedTool === "pointer" ? "active" : ""}`}
          onClick={() => setSelectedTool("pointer")}
          title="Con trỏ chọn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3l7 18 3-7 7-3L3 3z"></path>
          </svg>
        </button>

        <button
          className={`map-tool-btn ${selectedTool === "target" ? "active" : ""}`}
          onClick={() => setSelectedTool("target")}
          title="Khóa mục tiêu"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="3"></circle>
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
          </svg>
        </button>

        <button
          className={`map-tool-btn ${selectedTool === "polygon" ? "active" : ""}`}
          onClick={() => setSelectedTool("polygon")}
          title="Vẽ vùng"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2l9 5-3 12H6L3 7l9-5z"></path>
          </svg>
        </button>

        <button
          className={`map-tool-btn ${selectedTool === "ruler" ? "active" : ""}`}
          onClick={() => setSelectedTool("ruler")}
          title="Đo khoảng cách"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.3 15.3l-10-10a1 1 0 0 0-1.4 0l-7 7a1 1 0 0 0 0 1.4l10 10a1 1 0 0 0 1.4 0l7-7a1 1 0 0 0 0-1.4z"></path>
          </svg>
        </button>

        <button
          className={`map-tool-btn ${selectedTool === "pin" ? "active" : ""}`}
          onClick={() => setSelectedTool("pin")}
          title="Cắm ghim"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </button>

        <button className="map-tool-btn" title="Bật/Tắt các lớp">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
        </button>
      </div>

      {/* Leaflet Map Main Viewport Container */}
      <div ref={containerRef} className="full-leaflet-container" />

      {/* Bottom Scale Indicator Overlay */}
      <div className="map-bottom-scale">
        <div className="scale-line"></div>
        <span>500 m</span>
      </div>
    </div>
  );
}
