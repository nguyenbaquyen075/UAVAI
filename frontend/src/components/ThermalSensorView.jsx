import React, { useState } from "react";
import { Camera } from "lucide-react";

export default function ThermalSensorView({ onSnapshot }) {
  const [activeSensor, setActiveSensor] = useState("EO"); // EO | IR | Laser
  const [palette, setPalette] = useState("White Hot"); // White Hot | Black Hot
  const [scaleVal, setScaleVal] = useState(0.5);

  return (
    <div className="sensor-card-exact font-sans">
      {/* HEADER: TITLE & 3 SENSOR TABS */}
      <div className="sensor-card-header">
        <h3 className="sensor-title font-sans">CẢM BIẾN</h3>
        <div className="sensor-mode-tabs">
          <button
            className={`sensor-tab-btn ${activeSensor === "EO" ? "active" : ""}`}
            onClick={() => setActiveSensor("EO")}
          >
            EO
          </button>
          <button
            className={`sensor-tab-btn ${activeSensor === "IR" ? "active" : ""}`}
            onClick={() => setActiveSensor("IR")}
          >
            IR
          </button>
          <button
            className={`sensor-tab-btn ${activeSensor === "Laser" ? "active" : ""}`}
            onClick={() => setActiveSensor("Laser")}
          >
            Laser
          </button>
        </div>
      </div>

      {/* SENSOR FEED MAIN VIEWPORT */}
      <div className="sensor-feed-viewport">
        {/* Real Thermal Aerial Crossroad Image Viewport */}
        <div
          className={`sensor-img-overlay ${
            palette === "Black Hot" ? "black-hot-filter" : "white-hot-filter"
          }`}
        >
          {/* HIGH RESOLUTION MONOCHROME CROSSROAD SVG COMPOSITION */}
          <svg
            className="thermal-aerial-svg"
            viewBox="0 0 400 250"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              {/* Grayscale Pattern for Trees/Forest */}
              <pattern
                id="forestPattern"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="5" cy="5" r="4" fill="#2a2e38" />
                <circle cx="15" cy="8" r="5" fill="#1f232d" />
                <circle cx="8" cy="16" r="4.5" fill="#323844" />
                <circle cx="17" cy="17" r="3.5" fill="#242833" />
              </pattern>

              {/* Vehicle Shadow */}
              <filter id="shadowFilter" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="3" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.8" />
              </filter>
            </defs>

            {/* Background Forest Land */}
            <rect width="400" height="250" fill="#222630" />
            <rect width="400" height="250" fill="url(#forestPattern)" opacity="0.85" />

            {/* 4-Way Curved Asphalt Intersection */}
            <path
              d="M -20 180 Q 180 120 420 150 L 420 195 Q 180 165 -20 225 Z"
              fill="#4a5160"
            />
            <path
              d="M 60 -20 Q 200 130 320 270 L 270 270 Q 160 120 10 -20 Z"
              fill="#4a5160"
            />
            {/* Center Junction Intersection Zone */}
            <path
              d="M 140 80 Q 210 130 260 180 L 190 190 Q 140 120 90 90 Z"
              fill="#525a6b"
            />

            {/* Road Solid White Edge Lines */}
            <path
              d="M -20 178 Q 180 118 420 148"
              stroke="#e2e8f0"
              strokeWidth="2.5"
              fill="none"
              opacity="0.9"
            />
            <path
              d="M -20 227 Q 180 167 420 197"
              stroke="#e2e8f0"
              strokeWidth="2.5"
              fill="none"
              opacity="0.9"
            />
            <path
              d="M 62 -20 Q 202 132 322 272"
              stroke="#e2e8f0"
              strokeWidth="2.5"
              fill="none"
              opacity="0.9"
            />
            <path
              d="M 8 -20 Q 158 118 268 272"
              stroke="#e2e8f0"
              strokeWidth="2.5"
              fill="none"
              opacity="0.9"
            />

            {/* Center Lane Dashed Dividers */}
            <path
              d="M -20 202 Q 180 142 420 172"
              stroke="#cbd5e1"
              strokeWidth="1.5"
              strokeDasharray="8 6"
              fill="none"
              opacity="0.8"
            />
            <path
              d="M 35 -20 Q 180 125 295 272"
              stroke="#cbd5e1"
              strokeWidth="1.5"
              strokeDasharray="8 6"
              fill="none"
              opacity="0.8"
            />

            {/* WHITE BOX TRUCK (TARGET VEHICLE) IN CENTER */}
            <g transform="translate(165, 115) rotate(28)" filter="url(#shadowFilter)">
              {/* Truck Trailer Cargo */}
              <rect x="-16" y="-12" width="32" height="24" rx="2" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
              <rect x="-14" y="-10" width="28" height="20" fill="#ffffff" />
              {/* Truck Cab */}
              <rect x="16" y="-10" width="12" height="20" rx="2" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />
              <rect x="18" y="-7" width="7" height="14" rx="1" fill="#475569" />
              {/* Wheels */}
              <rect x="-12" y="-15" width="6" height="3" rx="1" fill="#1e293b" />
              <rect x="8" y="-15" width="6" height="3" rx="1" fill="#1e293b" />
              <rect x="-12" y="12" width="6" height="3" rx="1" fill="#1e293b" />
              <rect x="8" y="12" width="6" height="3" rx="1" fill="#1e293b" />
            </g>

            {/* BRIGHT GREEN TRACKING RETICLE BRACKETS AROUND TRUCK */}
            <g transform="translate(178, 126)">
              {/* Corner brackets */}
              <path d="M -28 -22 L -28 -32 L -18 -32" stroke="#22c55e" strokeWidth="2.5" fill="none" strokeLinecap="square" />
              <path d="M 28 -22 L 28 -32 L 18 -32" stroke="#22c55e" strokeWidth="2.5" fill="none" strokeLinecap="square" />
              <path d="M -28 22 L -28 32 L -18 32" stroke="#22c55e" strokeWidth="2.5" fill="none" strokeLinecap="square" />
              <path d="M 28 22 L 28 32 L 18 32" stroke="#22c55e" strokeWidth="2.5" fill="none" strokeLinecap="square" />
            </g>

            {/* RED LASER CROSSHAIR MARKER BELOW TRUCK */}
            <g transform="translate(178, 172)">
              {/* Laser crosshair vertical line */}
              <line x1="0" y1="-12" x2="0" y2="12" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 2" />
              {/* Laser crosshair horizontal line */}
              <line x1="-12" y1="0" x2="12" y2="0" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 2" />
              {/* Laser center target circle */}
              <circle cx="0" cy="0" r="4" stroke="#ef4444" strokeWidth="2" fill="rgba(239, 68, 68, 0.2)" />
              {/* Center point */}
              <circle cx="0" cy="0" r="1.5" fill="#ef4444" />
            </g>
          </svg>
        </div>

        {/* RIGHT SIDE VERTICAL SCALE SLIDER */}
        <div className="sensor-right-scale-bar">
          <div className="scale-track-line">
            <div
              className="scale-green-knob"
              style={{ top: `${(2.0 - scaleVal) * 25}%` }}
            />
          </div>
          <div className="scale-labels font-mono">
            <span>+ 2.0</span>
            <span>1.0</span>
            <span>0.0</span>
            <span>-1.0</span>
            <span>-2.0</span>
          </div>
        </div>
      </div>

      {/* FOOTER: COLOR PALETTES & SNAPSHOT BUTTON */}
      <div className="sensor-card-footer">
        <div className="palette-toggle-group">
          <button
            className={`palette-btn ${palette === "White Hot" ? "active" : ""}`}
            onClick={() => setPalette("White Hot")}
          >
            White Hot
          </button>
          <button
            className={`palette-btn ${palette === "Black Hot" ? "active" : ""}`}
            onClick={() => setPalette("Black Hot")}
          >
            Black Hot
          </button>
        </div>

        <button
          className="sensor-snapshot-btn"
          onClick={onSnapshot}
          title="Chụp ảnh cảm biến"
        >
          <Camera size={15} color="#cbd5e1" />
        </button>
      </div>
    </div>
  );
}
