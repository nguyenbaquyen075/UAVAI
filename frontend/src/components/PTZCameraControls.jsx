import { useState } from "react";

// ponytail: chưa nối gimbal/MAVLink thật (xem README "Chỉ là UI, chưa nối phần cứng") —
// D-pad/gimbal disabled, chỉ zoom digital (khớp TacticalVideoHUD) là thao tác thật.
export default function PTZCameraControls() {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [focusMode, setFocusMode] = useState("AF"); // AF | MF
  const [pitch, setPitch] = useState(0);
  const [yaw, setYaw] = useState(0);

  const handleZoomIn = () => setZoomLevel((z) => Math.min(10, +(z + 0.5).toFixed(1)));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(1, +(z - 0.5).toFixed(1)));

  return (
    <div className="ptz-control-panel">
      <div className="panel-title">ĐIỀU KHIỂN CAMERA</div>
      <p className="muted" style={{ fontSize: "11px", margin: "0 0 6px" }}>Chưa nối gimbal thật — D-pad/PITCH/YAW chỉ dựng UI trước.</p>
      <div className="ptz-body">
        {/* Left: Direction D-Pad */}
        <div className="dpad-container">
          <button className="dpad-btn up" disabled title="Chưa nối gimbal thật">▲</button>
          <div className="dpad-mid-row">
            <button className="dpad-btn left" disabled title="Chưa nối gimbal thật">◀</button>
            <button className="dpad-btn center" disabled title="Chưa nối gimbal thật">●</button>
            <button className="dpad-btn right" disabled title="Chưa nối gimbal thật">▶</button>
          </div>
          <button className="dpad-btn down" disabled title="Chưa nối gimbal thật">▼</button>
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
              <input type="range" min="0" max="100" defaultValue="50" className="mini-range" disabled title="Chưa nối gimbal thật" />
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
              disabled
              title="Chưa nối gimbal thật"
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
              disabled
              title="Chưa nối gimbal thật"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
