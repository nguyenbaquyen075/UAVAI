import { useState } from "react";

export default function BatteryConsumptionChart() {
  const dates = ["14/04", "17/04", "20/04", "23/04", "26/04", "29/04", "02/05", "05/05", "08/05", "11/05", "13/05"];

  const seriesData = [
    {
      name: "UAV_01",
      color: "#22c55e",
      points: [100, 90, 82, 78, 72, 65, 62, 64, 53, 49, 44, 41, 35, 30, 27, 18],
    },
    {
      name: "UAV_02",
      color: "#3b82f6",
      points: [100, 88, 74, 63, 52, 36, 24, 14, 0],
    },
    {
      name: "UAV_03",
      color: "#a855f7",
      points: [100, 92, 84, 72, 62, 50, 42, 38, 38, 41, 35, 26, 22, 19, 12, 5],
    },
    {
      name: "UAV_04",
      color: "#06b6d4",
      points: [100, 90, 80, 68, 62, 56, 48, 40, 30, 18, 10, 8, 0],
    },
  ];

  const width = 360;
  const height = 190;
  const padL = 36;
  const padR = 12;
  const padT = 16;
  const padB = 26;

  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const totalPoints = 16;
  const stepX = plotW / (totalPoints - 1);

  const getSvgY = (val) => padT + plotH - (val / 100) * plotH;
  const getSvgX = (idx) => padL + idx * stepX;

  const makeCurvePath = (pts) => {
    return pts
      .map((val, idx) => {
        const x = getSvgX(idx);
        const y = getSvgY(val);
        return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  };

  return (
    <div className="battery-chart-container-v2">
      {/* Y-Unit Label */}
      <div className="y-unit-lbl">Pin (%)</div>

      {/* SVG Canvas */}
      <div className="svg-battery-wrapper">
        <svg width="100%" height="190" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          {/* Gridlines & Y-Axis Labels */}
          {[100, 75, 50, 25, 0].map((val) => {
            const y = getSvgY(val);
            return (
              <g key={val}>
                <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#1e293b" strokeWidth="1" />
                <text
                  x={padL - 6}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="9"
                  textAnchor="end"
                  fontFamily="JetBrains Mono"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Discharge Curves & Circle Points */}
          {seriesData.map((s) => {
            const pathD = makeCurvePath(s.points);
            return (
              <g key={s.name}>
                <path d={pathD} fill="none" stroke={s.color} strokeWidth="2" opacity={s.name === "UAV_04" ? 0.5 : 1.0} />
                {s.points.map((val, idx) => (
                  <circle
                    key={idx}
                    cx={getSvgX(idx)}
                    cy={getSvgY(val)}
                    r="3"
                    fill={s.color}
                    stroke="#0b0f19"
                    strokeWidth="1.2"
                    opacity={s.name === "UAV_04" ? 0.5 : 1.0}
                  />
                ))}
              </g>
            );
          })}

          {/* X-Axis Date Labels */}
          {dates.map((d, idx) => {
            const posX = padL + (idx / (dates.length - 1)) * plotW;
            return (
              <text
                key={idx}
                x={posX}
                y={height - 6}
                fill="#64748b"
                fontSize="9"
                textAnchor="middle"
                fontFamily="JetBrains Mono"
              >
                {d}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Bottom Series Legend Bar */}
      <div className="battery-legend-bar">
        {seriesData.slice(0, 3).map((s) => (
          <div key={s.name} className="legend-chip-v2">
            <span className="lgd-line-with-dot">
              <span className="line" style={{ background: s.color }} />
              <span className="dot" style={{ background: s.color }} />
              <span className="line" style={{ background: s.color }} />
            </span>
            <span className="series-name">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
