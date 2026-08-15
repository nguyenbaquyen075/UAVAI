import { useState } from "react";

export default function FlightHoursChart() {
  const [hoverIndex, setHoverIndex] = useState(21); // Default active tooltip at 05/05/2024

  const dates = [
    "14/04", "15/04", "16/04", "17/04", "18/04", "19/04", "20/04", "21/04",
    "22/04", "23/04", "24/04", "25/04", "26/04", "27/04", "28/04", "29/04",
    "30/04", "01/05", "02/05", "03/05", "04/05", "05/05", "06/05", "07/05",
    "08/05", "09/05", "10/05", "11/05", "12/05", "13/05"
  ];

  const seriesData = [
    { name: "UAV_01", color: "#22c55e", points: [14, 13.8, 14.2, 16.5, 15.8, 14.0, 15.5, 17.8, 20.2, 15.5, 15.8, 17.5, 19.8, 16.8, 17.8, 21.0, 19.5, 18.8, 19.2, 22.0, 18.5, 18.6, 16.5, 19.2, 19.8, 18.8, 19.2, 21.0] },
    { name: "UAV_02", color: "#3b82f6", points: [9, 9.8, 10.5, 11.6, 11.0, 10.2, 9.4, 11.2, 14.3, 12.0, 12.2, 13.5, 13.8, 11.8, 12.5, 15.2, 13.8, 12.8, 14.5, 17.0, 14.8, 14.3, 12.2, 14.5, 15.5, 14.8, 15.2, 16.0] },
    { name: "UAV_03", color: "#a855f7", points: [6, 6.5, 7.0, 7.8, 7.5, 6.8, 7.2, 8.5, 10.2, 9.0, 8.8, 10.0, 10.5, 8.5, 9.8, 10.5, 11.0, 11.8, 11.5, 12.2, 11.5, 11.8, 9.0, 8.6, 10.5, 10.2, 9.8, 11.5] },
    { name: "UAV_04", color: "#f59e0b", points: [3.5, 3.8, 4.2, 4.6, 4.4, 4.6, 4.8, 5.2, 5.8, 5.2, 5.4, 6.0, 7.5, 5.4, 5.8, 5.8, 6.5, 8.2, 6.8, 8.5, 7.2, 9.2, 6.2, 5.8, 6.8, 6.5, 6.8, 8.2] },
    { name: "UAV_05", color: "#06b6d4", points: [2.5, 2.8, 3.0, 3.2, 3.1, 3.4, 3.5, 3.8, 4.2, 3.8, 4.0, 4.2, 4.5, 3.8, 4.2, 4.5, 5.0, 6.0, 4.8, 6.5, 5.0, 6.7, 4.5, 4.2, 4.8, 4.5, 4.8, 5.5] },
    { name: "UAV_06", color: "#ef4444", points: [1.8, 1.8, 2.0, 2.0, 2.1, 2.0, 2.2, 2.5, 3.0, 2.4, 2.4, 2.8, 3.0, 2.2, 2.4, 2.6, 3.8, 4.2, 3.5, 3.4, 1.0, 3.1, 2.8, 3.0, 3.0, 3.2, 3.5, 3.8] },
  ];

  const maxVal = 25;
  const width = 640;
  const height = 210;
  const padL = 36;
  const padR = 16;
  const padT = 20;
  const padB = 30;

  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const stepX = plotW / (dates.length - 1);

  const getSvgY = (val) => padT + plotH - (val / maxVal) * plotH;
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
    <div className="flight-hours-chart-container-v2">
      {/* Top Left Y-Unit Label */}
      <div className="y-unit-lbl">Giờ bay (h)</div>

      {/* SVG Chart Canvas */}
      <div className="svg-chart-wrapper">
        <svg width="100%" height="220" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            {seriesData.map((s) => (
              <linearGradient key={s.name} id={`grad-${s.name}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.0" />
              </linearGradient>
            ))}
          </defs>

          {/* Gridlines & Y-Axis Labels */}
          {[25, 20, 15, 10, 5, 0].map((val) => {
            const y = getSvgY(val);
            return (
              <g key={val}>
                <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#1e293b" strokeWidth="1" />
                <text x={padL - 6} y={y + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">
                  {val}h
                </text>
              </g>
            );
          })}

          {/* Area Gradients & Curve Lines */}
          {seriesData.map((s) => {
            const pathD = makeCurvePath(s.points);
            const areaD = `${pathD} L ${getSvgX(s.points.length - 1)} ${padT + plotH} L ${padL} ${padT + plotH} Z`;
            return (
              <g key={s.name}>
                <path d={areaD} fill={`url(#grad-${s.name})`} />
                <path d={pathD} fill="none" stroke={s.color} strokeWidth="2.5" />
                {s.points.map((val, idx) => (
                  <circle
                    key={idx}
                    cx={getSvgX(idx)}
                    cy={getSvgY(val)}
                    r="3"
                    fill={s.color}
                    stroke="#0b0f19"
                    strokeWidth="1.5"
                  />
                ))}
              </g>
            );
          })}

          {/* Active Guideline at hoverIndex */}
          {hoverIndex !== null && (
            <g className="guideline-group">
              <line
                x1={getSvgX(hoverIndex)}
                y1={padT}
                x2={getSvgX(hoverIndex)}
                y2={padT + plotH}
                stroke="#ffffff"
                strokeWidth="1"
                strokeDasharray="3, 3"
                opacity="0.6"
              />
              {seriesData.map((s) => (
                <circle
                  key={s.name}
                  cx={getSvgX(hoverIndex)}
                  cy={getSvgY(s.points[hoverIndex])}
                  r="5"
                  fill={s.color}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              ))}
            </g>
          )}

          {/* X-Axis Date Labels */}
          {dates.map((d, idx) => {
            if (idx % 3 === 0 || idx === dates.length - 1) {
              return (
                <text
                  key={idx}
                  x={getSvgX(idx)}
                  y={height - 8}
                  fill="#64748b"
                  fontSize="9"
                  textAnchor="middle"
                  fontFamily="JetBrains Mono"
                >
                  {d}
                </text>
              );
            }
            return null;
          })}
        </svg>

        {/* Hover Tooltip Card (Positioned over index 21 by default) */}
        {hoverIndex !== null && (
          <div
            className="chart-hover-tooltip"
            style={{
              left: `${((getSvgX(hoverIndex) / width) * 100).toFixed(1)}%`,
              top: "20px",
            }}
          >
            <div className="tooltip-date">05/05/2024</div>
            <div className="tooltip-item"><span className="dot dot-green" /><span>UAV_01:</span><strong>18.6 h</strong></div>
            <div className="tooltip-item"><span className="dot dot-blue" /><span>UAV_02:</span><strong>14.3 h</strong></div>
            <div className="tooltip-item"><span className="dot dot-purple" /><span>UAV_03:</span><strong>11.8 h</strong></div>
            <div className="tooltip-item"><span className="dot dot-yellow" /><span>UAV_04:</span><strong>9.2 h</strong></div>
            <div className="tooltip-item"><span className="dot dot-cyan" /><span>UAV_05:</span><strong>6.7 h</strong></div>
            <div className="tooltip-item"><span className="dot dot-red" /><span>UAV_06:</span><strong>3.1 h</strong></div>
          </div>
        )}
      </div>

      {/* Bottom Series Legend Bar */}
      <div className="flight-chart-legend">
        {seriesData.map((s) => (
          <div key={s.name} className="legend-item">
            <span className="lgd-dot" style={{ background: s.color }} />
            <span>{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
