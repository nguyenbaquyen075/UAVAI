export default function UavRadarChart() {
  const axes = [
    "Tỷ lệ thành công",
    "Thời gian hoàn thành",
    "Tiêu thụ pin",
    "Quãng đường",
    "Độ chính xác",
    "An toàn bay",
  ];

  const size = 260;
  const center = size / 2;
  const radius = 90;

  // 6 radial lines angles (in radians)
  const angles = axes.map((_, i) => (i * 2 * Math.PI) / axes.length - Math.PI / 2);

  // Helper to convert polygon ratios [0..1] to polygon points
  const getPolygonPoints = (ratios) => {
    return ratios
      .map((r, i) => {
        const angle = angles[i];
        const x = center + radius * r * Math.cos(angle);
        const y = center + radius * r * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  };

  const uav1Ratios = [0.95, 0.85, 0.70, 0.90, 0.92, 0.96]; // Green
  const uav2Ratios = [0.90, 0.78, 0.82, 0.85, 0.88, 0.90]; // Blue
  const uav3Ratios = [0.88, 0.82, 0.65, 0.75, 0.85, 0.89]; // Purple

  return (
    <div className="radar-chart-card">
      <div className="card-header-row">
        <span className="card-title">HIỆU SUẤT NHIỆM VỤ</span>
        <select className="mini-select" defaultValue="30">
          <option value="30">30 ngày</option>
          <option value="7">7 ngày</option>
          <option value="90">90 ngày</option>
        </select>
      </div>

      <div className="radar-svg-wrapper">
        <svg viewBox={`0 0 ${size} ${size}`} className="radar-svg">
          {/* Background Concentric Polygon Web */}
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((level) => (
            <polygon
              key={level}
              points={getPolygonPoints(Array(6).fill(level))}
              fill="none"
              stroke="#1e293b"
              strokeWidth="1"
            />
          ))}

          {/* Radial Axis Lines */}
          {angles.map((angle, i) => {
            const x2 = center + radius * Math.cos(angle);
            const y2 = center + radius * Math.sin(angle);
            return <line key={i} x1={center} y1={center} x2={x2} y2={y2} stroke="#1e293b" strokeWidth="1" />;
          })}

          {/* UAV_03 Series (Purple) */}
          <polygon
            points={getPolygonPoints(uav3Ratios)}
            fill="rgba(168, 85, 247, 0.15)"
            stroke="#a855f7"
            strokeWidth="1.5"
          />

          {/* UAV_02 Series (Blue) */}
          <polygon
            points={getPolygonPoints(uav2Ratios)}
            fill="rgba(59, 130, 246, 0.15)"
            stroke="#3b82f6"
            strokeWidth="1.5"
          />

          {/* UAV_01 Series (Green) */}
          <polygon
            points={getPolygonPoints(uav1Ratios)}
            fill="rgba(74, 222, 128, 0.2)"
            stroke="#4ade80"
            strokeWidth="2"
          />

          {/* Axis Labels */}
          {axes.map((label, i) => {
            const angle = angles[i];
            const labelRadius = radius + 22;
            const lx = center + labelRadius * Math.cos(angle);
            const ly = center + labelRadius * Math.sin(angle);
            return (
              <text
                key={label}
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#94a3b8"
                fontSize="8"
                fontWeight="600"
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      <div className="radar-legend">
        <div className="legend-chip">
          <span className="chip-dot" style={{ background: "#4ade80" }}></span>
          <span>UAV_01</span>
        </div>
        <div className="legend-chip">
          <span className="chip-dot" style={{ background: "#3b82f6" }}></span>
          <span>UAV_02</span>
        </div>
        <div className="legend-chip">
          <span className="chip-dot" style={{ background: "#a855f7" }}></span>
          <span>UAV_03</span>
        </div>
      </div>
    </div>
  );
}
