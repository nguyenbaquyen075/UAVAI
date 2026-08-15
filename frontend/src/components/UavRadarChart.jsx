import { useState } from "react";

export default function UavRadarChart() {
  const axes = [
    "Tỷ lệ thành công",
    "Thời gian hoàn thành",
    "Tiêu thụ pin",
    "Quãng đường",
    "Độ chính xác",
    "An toàn bay",
  ];

  const series = [
    {
      name: "UAV_01",
      color: "#22c55e",
      ratios: [0.95, 0.82, 0.88, 0.92, 0.88, 0.94],
    },
    {
      name: "UAV_02",
      color: "#3b82f6",
      ratios: [0.82, 0.75, 0.70, 0.80, 0.78, 0.84],
    },
    {
      name: "UAV_03",
      color: "#a855f7",
      ratios: [0.70, 0.65, 0.62, 0.68, 0.72, 0.76],
    },
  ];

  const width = 380;
  const height = 240;
  const centerX = 190;
  const centerY = 120;
  const radius = 65;

  // 6 Angles starting at top (-Math.PI/2)
  const angles = axes.map((_, i) => (i * 2 * Math.PI) / 6 - Math.PI / 2);

  const getPolygonPoints = (ratios) =>
    ratios
      .map((r, i) => {
        const angle = angles[i];
        const x = centerX + radius * r * Math.cos(angle);
        const y = centerY + radius * r * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <div className="uav-radar-chart-container-v2">
      {/* SVG Spider Net & Polygon Overlay */}
      <div className="radar-svg-box">
        <svg width="100%" height="240" viewBox={`0 0 ${width} ${height}`}>
          {/* 4 Concentric Hexagonal Grid Lines */}
          {[0.25, 0.5, 0.75, 1.0].map((level) => (
            <polygon
              key={level}
              points={getPolygonPoints(Array(6).fill(level))}
              fill="none"
              stroke="#1e293b"
              strokeWidth="1"
            />
          ))}

          {/* 6 Radial Grid Spokes */}
          {angles.map((angle, i) => {
            const x2 = centerX + radius * Math.cos(angle);
            const y2 = centerY + radius * Math.sin(angle);
            return <line key={i} x1={centerX} y1={centerY} x2={x2} y2={y2} stroke="#1e293b" strokeWidth="1" />;
          })}

          {/* 3 UAV Polygons with Filled Glow & Glowing Vertex Dots */}
          {series.map((s) => {
            const pointsStr = getPolygonPoints(s.ratios);
            return (
              <g key={s.name}>
                <polygon points={pointsStr} fill={`${s.color}25`} stroke={s.color} strokeWidth="2" />
                {s.ratios.map((r, i) => {
                  const angle = angles[i];
                  const cx = centerX + radius * r * Math.cos(angle);
                  const cy = centerY + radius * r * Math.sin(angle);
                  return (
                    <circle
                      key={i}
                      cx={cx}
                      cy={cy}
                      r="3.5"
                      fill={s.color}
                      stroke="#0b0f19"
                      strokeWidth="1.5"
                    />
                  );
                })}
              </g>
            );
          })}

          {/* 6 Metric Labels around Vertices */}
          {axes.map((label, i) => {
            const angle = angles[i];
            const labelRadius = radius + 18;
            const lx = centerX + labelRadius * Math.cos(angle);
            const ly = centerY + labelRadius * Math.sin(angle);

            // Text Alignment & Anchors
            let textAnchor = "middle";
            if (i === 1 || i === 2) {
              textAnchor = "start";
            } else if (i === 4 || i === 5) {
              textAnchor = "end";
            }

            return (
              <text
                key={label}
                x={lx}
                y={ly}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                fill="#cbd5e1"
                fontSize="11"
                fontWeight="500"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Bottom Series Legend Bar */}
      <div className="radar-legend-bar-v2">
        {series.map((s) => (
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
