import { useState, useRef, useEffect } from "react";
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

const CLASS_LABEL = { person: "Người", car: "Ô tô", motorcycle: "Xe máy", bus: "Xe buýt", truck: "Xe tải" };
const SEVERITY_COLOR = { red: "#ef4444", yellow: "#f59e0b", green: "#4ade80" };
const SEVERITY_TEXT = { red: "NGUY HIỂM", yellow: "CẢNH BÁO", green: "BÌNH THƯỜNG" };

// object-fit: cover cắt bớt frame để lấp đầy khung — quy đổi bbox (toạ độ pixel gốc) sang
// vị trí % trên khung hiển thị phải bù đúng phần bị crop, không thì box sẽ lệch khỏi mục tiêu thật.
function bboxToBoxPx(bbox, frameW, frameH, boxW, boxH) {
  if (!frameW || !frameH || !boxW || !boxH) return null;
  const scale = Math.max(boxW / frameW, boxH / frameH);
  const renderedW = frameW * scale;
  const renderedH = frameH * scale;
  const offsetX = (boxW - renderedW) / 2;
  const offsetY = (boxH - renderedH) / 2;
  const [x1, y1, x2, y2] = bbox;
  return {
    left: offsetX + x1 * scale,
    top: offsetY + y1 * scale,
    width: (x2 - x1) * scale,
    height: (y2 - y1) * scale,
  };
}

export default function TacticalVideoHUD({
  isLive = true,
  telemetry,
  objects = [],
  frameSize,
  cameraMode = "EO",
  zoomLevel = 5.2,
  onZoomChange,
}) {
  const [zoom, setZoom] = useState(zoomLevel);
  const [isFull, setIsFull] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [activeTool, setActiveTool] = useState("crosshair");
  // ponytail: /video là stream MJPEG thật (chỉ chạy khi có 1 UAV active) — nếu backend
  // chưa bật/không có UAV active thì ảnh vỡ, fallback về placeholder tĩnh qua onError.
  const [feedSrc, setFeedSrc] = useState(`${API_BASE}/video`);
  const [boxSize, setBoxSize] = useState({ w: 0, h: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setBoxSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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

      {/* KHUNG BÁM MỤC TIÊU THẬT — toạ độ quy đổi từ bbox YOLO (pixel gốc) sang vị trí hiển thị,
          bù đúng phần crop của object-fit:cover nên bám khớp mục tiêu trên video */}
      {objects.slice(0, 8).map((o) => {
        const box = bboxToBoxPx(o.bbox, frameSize?.width, frameSize?.height, boxSize.w, boxSize.h);
        if (!box) return null;
        const color = SEVERITY_COLOR[o.severity] || "#4ade80";
        return (
          <div
            key={o.track_id}
            className="hud-target-box"
            style={{ left: box.left, top: box.top, width: box.width, height: box.height, borderColor: color }}
          >
            <span className="corner tl" style={{ borderColor: color }} />
            <span className="corner tr" style={{ borderColor: color }} />
            <span className="corner bl" style={{ borderColor: color }} />
            <span className="corner br" style={{ borderColor: color }} />

            <div className="hud-target-card" style={{ borderColor: color }}>
              <div className="hud-target-card-title">
                MỤC TIÊU <span style={{ color }}>{o.track_id}</span>
              </div>
              <div className="row">LOẠI: {CLASS_LABEL[o.class] || o.class}</div>
              <div className="row">KHOẢNG CÁCH: {o.distance_m != null ? `${o.distance_m}m` : "--"}</div>
              <div className="row" style={{ color }}>{SEVERITY_TEXT[o.severity] || "ĐANG THEO DÕI"}</div>
            </div>
          </div>
        );
      })}

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
          COG <strong className="green-text">{telemetry?.heading_deg ?? 0}°</strong>
        </div>
        <div className="telemetry-cell">
          BAT <strong className="green-text">{telemetry?.battery_pct ?? 78}%</strong>
        </div>
        <div className="telemetry-cell">
          TÍN HIỆU <strong className={telemetry?.signal === "Weak" ? "text-red" : "green-text"}>{telemetry?.signal ?? "Strong"}</strong>
        </div>
      </div>
    </div>
  );
}
