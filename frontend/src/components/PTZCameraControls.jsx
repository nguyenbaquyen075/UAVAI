import { useState } from "react";

export default function PTZCameraControls() {
  const [zoomLevel, setZoomLevel] = useState(5.2);
  const [focusMode, setFocusMode] = useState("AF"); // AF | MF
  const [pitch, setPitch] = useState(-10.2);
  const [yaw, setYaw] = useState(320.5);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(10, +(z + 0.5).toFixed(1)));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(1, +(z - 0.5).toFixed(1)));

  return (
    <div className="ptz-control-panel">
      <div className="panel-title">ĐIỀU KHIỂN CAMERA</div>
      <div className="ptz-body">
        {/* Left: Direction D-Pad */}
        <div className="dpad-container">
          <button className="dpad-btn up" title="Nghiêng lên">▲</button>
          <div className="dpad-mid-row">
            <button className="dpad-btn left" title="Quay trái">◀</button>
            <button className="dpad-btn center" title="Về trung tâm">●</button>
            <button className="dpad-btn right" title="Quay phải">▶</button>
          </div>
          <button className="dpad-btn down" title="Nghiêng xuống">▼</button>
        </div>

        {/* Center: Zoom & Focus Controls */}
        <div className="ptz-middle">
          <div className="ptz-subgroup">
            <div className="subgroup-label">ZOOM</div>
            <div className="zoom-box">
              <button className="zoom-btn" onClick={handleZoomOut}>-</button>
              <span className="zoom-value">{zoomLevel}X</span>
              <button className="zoom-btn" onClick={handleZoomIn}>+</button>
            </div>
          </div>

          <div className="ptz-subgroup">
            <div className="subgroup-label">FOCUS</div>
            <div className="focus-toggle">
              <button
                className={`focus-btn ${focusMode === "AF" ? "active" : ""}`}
                onClick={() => setFocusMode("AF")}
              >
                AF
              </button>
              <button
                className={`focus-btn ${focusMode === "MF" ? "active" : ""}`}
                onClick={() => setFocusMode("MF")}
              >
                MF
              </button>
            </div>
            <div className="focus-slider-wrap">
              <input type="range" min="0" max="100" defaultValue="50" className="mini-range" />
            </div>
          </div>
        </div>

        {/* Right: Gimbal Angles */}
        <div className="ptz-right">
          <div className="subgroup-label">GIMBAL</div>
          <div className="gimbal-row">
            <div className="gimbal-info">
              <span>PITCH</span>
              <strong>{pitch}°</strong>
            </div>
            <input
              type="range"
              min="-90"
              max="30"
              value={pitch}
              onChange={(e) => setPitch(Number(e.target.value))}
              className="gimbal-slider"
            />
          </div>

          <div className="gimbal-row">
            <div className="gimbal-info">
              <span>YAW</span>
              <strong>{yaw}°</strong>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={yaw}
              onChange={(e) => setYaw(Number(e.target.value))}
              className="gimbal-slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
