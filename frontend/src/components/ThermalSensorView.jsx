import { useState } from "react";

export default function ThermalSensorView({ onSnapshot }) {
  const [activeSensor, setActiveSensor] = useState("IR"); // EO | IR | Laser
  const [palette, setPalette] = useState("White Hot"); // White Hot | Black Hot
  const [scaleVal, setScaleVal] = useState(0.5);

  return (
    <div className="sensor-card">
      <div className="sensor-header">
        <div className="title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2">
            <path d="M12 2v20M2 12h20M12 6a6 6 0 0 0 0 12 6 6 0 0 0 0-12z"></path>
          </svg>
          <span>CẢM BIẾN</span>
        </div>
        <div className="sensor-tabs">
          {["EO", "IR", "Laser"].map((mode) => (
            <button
              key={mode}
              className={`sensor-tab ${activeSensor === mode ? "active" : ""}`}
              onClick={() => setActiveSensor(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className={`sensor-feed-box ${palette === "Black Hot" ? "black-hot" : "white-hot"}`}>
        {/* IR Stream background simulation */}
        <div className="ir-stream-sim">
          <div className="ir-thermal-target">
            <div className="target-crosshair"></div>
            <div className="ir-heat-box"></div>
          </div>

          {/* Vertical Scale bar */}
          <div className="ir-scale-bar">
            <span>2.0</span>
            <span>1.0</span>
            <span>0.0</span>
            <span>-1.0</span>
            <span>-2.0</span>
            <div className="scale-indicator" style={{ top: `${(1 - scaleVal) * 50}%` }}></div>
          </div>
        </div>
      </div>

      <div className="sensor-footer">
        <div className="palette-btns">
          <button
            className={`mode-btn ${palette === "White Hot" ? "active" : ""}`}
            onClick={() => setPalette("White Hot")}
          >
            White Hot
          </button>
          <button
            className={`mode-btn ${palette === "Black Hot" ? "active" : ""}`}
            onClick={() => setPalette("Black Hot")}
          >
            Black Hot
          </button>
        </div>
        <button className="snap-btn" onClick={onSnapshot} title="Chụp ảnh cảm biến">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
        </button>
      </div>
    </div>
  );
}
