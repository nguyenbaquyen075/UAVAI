import { useState, useRef } from "react";
import {
  Camera,
  Crosshair,
  Maximize2,
  Minimize2,
  X,
  MapPin,
  Layers,
  Navigation,
  Plus,
  Minus,
} from "lucide-react";
import { API_BASE } from "../api";

export default function TacticalVideoHUD({
  isLive = true,
  telemetry,
  objects = [],
  cameraMode = "EO",
  zoomLevel = 5.2,
  onZoomChange,
}) {
  const [zoom, setZoom] = useState(zoomLevel);
  const [isFull, setIsFull] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [activeTool, setActiveTool] = useState("crosshair");
  const [feedSrc, setFeedSrc] = useState("/uav_aerial_feed.png");
  const containerRef = useRef(null);

  const currentZoom = onZoomChange ? zoomLevel : zoom;

  const handleZoom = (newVal) => {
    const clamped = Math.max(1.0, Math.min(10.0, Number(newVal.toFixed(1))));
    setZoom(clamped);
    if (onZoomChange) onZoomChange(clamped);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFull(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFull(false);
    }
  };

  const snapshot = () => {
    const a = document.createElement("a");
    a.href = `${API_BASE}/api/snapshot`;
    a.download = `uav_snapshot_${Date.now()}.jpg`;
    a.click();
  };

  const displayTargets =
    objects.length > 0
      ? objects
      : [
          {
            id: "01",
            label: "MỤC TIÊU 01",
            type: "XE",
            speed: "32 km/h",
            distance: "120m",
            color: "red",
            top: "38%",
            left: "44%",
          },
        ];

  return (
    <div
      ref={containerRef}
      className={`tactical-video-container ${cameraMode === "IR" ? "thermal-mode" : ""}`}
    >
      {/* Background Aerial Stream / Feed Image */}
      <img
        className="tactical-video-feed"
        src={feedSrc}
        onError={() => setFeedSrc("/uav_aerial_feed.png")}
        alt="UAV Live Feed"
      />

      {/* TOP LEFT METADATA OVERLAY (CLEAN TEXT, NO CARD BACKGROUND) */}
      <div className="hud-top-left-info-clean">
        <div>CAMERA: {cameraMode === "IR" ? "IR / THERMAL" : "EO/IR"}</div>
        <div>MODE: TRACK</div>
        <div>RES: 1080p 30fps</div>
        <div>FOV: 12.6°</div>
      </div>

      {/* TOP COMPASS HEADER STRIP */}
      <div className="hud-compass-header">
        <div className="compass-tape">
          <span className="mark">W</span>
          <span className="mark">285</span>
          <span className="mark">300</span>
          <span className="mark active-heading">NW</span>
          <span className="mark">330</span>
          <span className="mark">345</span>
          <span className="mark">N</span>
        </div>

        {/* TOP RIGHT TOOL BUTTONS */}
        <div className="hud-top-right-tools">
          <span className="zoom-indicator-pill-green">ZOOM {currentZoom.toFixed(1)}X</span>
          <button
            className="hud-icon-btn-square"
            onClick={() => setShowGrid(!showGrid)}
            title="Đóng / Toggle Lưới"
          >
            <X size={16} />
          </button>
          <button className="hud-icon-btn-square" onClick={toggleFullscreen} title="Toàn màn hình">
            {isFull ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* CENTER CROSSHAIR / RETICLE */}
      {showGrid && (
        <div className="center-reticle-overlay">
          <div className="reticle-line horiz" />
          <div className="reticle-line vert" />
          <div className="reticle-center-box" />
        </div>
      )}

      {/* DYNAMIC TARGET BOUNDING BOXES */}
      {displayTargets.map((target) => (
        <div
          key={target.id || target.label}
          className={`hud-target-box ${target.color || "red"}`}
          style={{ top: target.top || "40%", left: target.left || "45%" }}
        >
          <div className="target-corners">
            <div className="c-tl" />
            <div className="c-tr" />
            <div className="c-bl" />
            <div className="c-br" />
          </div>

          <div className="target-info-card">
            <div className="target-card-header">{target.label}</div>
            <div className="target-card-row">LOẠI: {target.type}</div>
            <div className="target-card-row">TỐC ĐỘ: {target.speed}</div>
            <div className="target-card-row">KHOẢNG CÁCH: {target.distance}</div>
          </div>
        </div>
      ))}

      {/* LEFT TOOLBAR OVERLAY (EXACT USER IMAGE REFERENCE) */}
      <div className="hud-left-toolbar-stack">
        <button
          className={`hud-left-sq-btn ${activeTool === "select" ? "active" : ""}`}
          onClick={() => setActiveTool("select")}
          title="Con trỏ định hướng"
        >
          <Navigation size={18} style={{ transform: "rotate(-45deg)" }} />
        </button>
        <button
          className={`hud-left-sq-btn ${activeTool === "crosshair" ? "active" : ""}`}
          onClick={() => setActiveTool("crosshair")}
          title="Tâm ngắm mục tiêu"
        >
          <Crosshair size={18} />
        </button>
        <button
          className={`hud-left-sq-btn ${activeTool === "pin" ? "active" : ""}`}
          onClick={() => setActiveTool("pin")}
          title="Tọa độ vị trí"
        >
          <MapPin size={18} />
        </button>
        <button
          className={`hud-left-sq-btn ${activeTool === "layers" ? "active" : ""}`}
          onClick={() => setActiveTool("layers")}
          title="Lớp bản đồ"
        >
          <Layers size={18} />
        </button>
      </div>

      {/* RIGHT SIDEBAR OVERLAY GROUP */}
      <div className="hud-right-side-group">
        {/* VERTICAL CAPSULE ZOOM PANEL */}
        <div className="vertical-zoom-capsule-panel">
          <button className="capsule-zoom-btn" onClick={() => handleZoom(currentZoom + 0.5)}>
            <Plus size={16} />
          </button>
          
          <div className="capsule-ruler-scale">
            <div className="ruler-line" />
            <div className="ruler-line short" />
            <div className="ruler-line" />
          </div>

          <span className="capsule-zoom-val">{currentZoom.toFixed(1)}X</span>

          <div className="capsule-ruler-scale">
            <div className="ruler-line" />
            <div className="ruler-line short" />
            <div className="ruler-line" />
          </div>

          <button className="capsule-zoom-btn" onClick={() => handleZoom(currentZoom - 0.5)}>
            <Minus size={16} />
          </button>
        </div>

        {/* BOTTOM RIGHT STACKED ACTION BUTTONS */}
        <div className="hud-right-stacked-actions">
          <button className="hud-action-sq-btn" onClick={snapshot} title="Tải xuống dữ liệu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>

          <button className="hud-action-sq-btn" onClick={snapshot} title="Chụp ảnh">
            <Camera size={18} color="#f8fafc" />
          </button>
        </div>
      </div>

      {/* BOTTOM TELEMETRY HUD STRIP */}
      <div className="hud-bottom-telemetry">
        <div className="telemetry-cell">
          ALT <strong className="green-text">{telemetry?.altitude_m ?? 150} m</strong>
        </div>
        <div className="telemetry-cell">
          H.SPD <strong>{telemetry?.speed_kmh ?? 48.0} km/h</strong>
        </div>
        <div className="telemetry-cell">
          V.SPD <strong>1.2 m/s</strong>
        </div>
        <div className="telemetry-cell">
          COG <strong className="green-text">320°</strong>
        </div>
        <div className="telemetry-cell">
          BAT <strong className="green-text">{telemetry?.battery_pct ?? 78}%</strong>
        </div>
        <div className="telemetry-cell">
          GPS <strong>{telemetry?.satellites ?? 12}</strong>
        </div>
        <div className="telemetry-cell">
          RSSI <strong className="green-text">-65 dBm</strong>
        </div>
      </div>
    </div>
  );
}
