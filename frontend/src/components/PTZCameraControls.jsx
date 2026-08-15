import { useState } from "react";

export default function PTZCameraControls() {
  const [zoomLevel, setZoomLevel] = useState("5.2X");
  const [focusMode, setFocusMode] = useState("AF"); // AF | MF
  const [pitch, setPitch] = useState("-10.2°");
  const [yaw, setYaw] = useState("320.5°");

  return (
    <div className="ptz-control-panel-v2">
      <div className="ptz-flex-container">
        {/* Sub-section 1: 4-Way Circular D-Pad */}
        <div className="dpad-circle-wrapper">
          <div className="dpad-circle">
            <button className="dpad-arrow up" title="Xoay lên">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M18 15l-6-6-6 6" />
              </svg>
            </button>
            <div className="dpad-mid-row">
              <button className="dpad-arrow left" title="Xoay trái">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button className="dpad-center-dot" title="Về trung tâm">
                <div className="inner-dot" />
              </button>
              <button className="dpad-arrow right" title="Xoay phải">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
            <button className="dpad-arrow down" title="Xoay xuống">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Sub-section 2: ZOOM Stack */}
        <div className="ptz-sub-col">
          <span className="sub-hdr">ZOOM</span>
          <div className="ptz-zoom-stack">
            <button className="z-btn">+</button>
            <div className="z-divider" />
            <span className="z-val">{zoomLevel}</span>
            <div className="z-divider" />
            <button className="z-btn">—</button>
          </div>
        </div>

        {/* Sub-section 3: FOCUS Stack */}
        <div className="ptz-sub-col">
          <span className="sub-hdr">FOCUS</span>
          <div className="focus-btns">
            <button
              className={`f-btn ${focusMode === "AF" ? "active-green" : ""}`}
              onClick={() => setFocusMode("AF")}
            >
              AF
            </button>
            <button
              className={`f-btn ${focusMode === "MF" ? "active" : ""}`}
              onClick={() => setFocusMode("MF")}
            >
              MF
            </button>
          </div>
          <div className="focus-slider-box">
            <div className="focus-track-line" />
            <div className="focus-knob" />
          </div>
        </div>

        {/* Vertical Separator Divider Line */}
        <div className="ptz-vertical-divider" />

        {/* Sub-section 4: GIMBAL Sliders */}
        <div className="ptz-sub-col gimbal-col">
          <span className="sub-hdr">GIMBAL</span>

          <div className="gimbal-slider-group">
            <div className="gimbal-lbl-row">
              <span className="g-lbl">PITCH</span>
              <span className="g-val">{pitch}</span>
            </div>
            <div className="g-slider-track">
              <div className="g-slider-thumb" style={{ left: "35%" }} />
            </div>
          </div>

          <div className="gimbal-slider-group">
            <div className="gimbal-lbl-row">
              <span className="g-lbl">YAW</span>
              <span className="g-val">{yaw}</span>
            </div>
            <div className="g-slider-track">
              <div className="g-slider-thumb" style={{ left: "80%" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
