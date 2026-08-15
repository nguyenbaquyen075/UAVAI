export default function DistanceChart() {
  const dates = [
    "01/05",
    "02/05",
    "03/05",
    "04/05",
    "05/05",
    "06/05",
    "07/05",
    "08/05",
    "09/05",
    "10/05",
    "11/05",
    "12/05",
    "13/05",
  ];

  const data = [
    { day: "01/05", km: 20 },
    { day: "02/05", km: 38 },
    { day: "03/05", km: 55 },
    { day: "04/05", km: 64 },
    { day: "05/05", km: 95 },
    { day: "06/05", km: 128 },
    { day: "07/05", km: 65 },
    { day: "08/05", km: 110 },
    { day: "09/05", km: 132 },
    { day: "10/05", km: 182 },
    { day: "11/05", km: 135 },
    { day: "12/05", km: 118 },
    { day: "13/05", km: 155 },
  ];

  const svgWidth = 460;
  const svgHeight = 210;
  const paddingLeft = 32;
  const paddingRight = 16;
  const baseY = 178;
  const topY = 28;
  const plotH = baseY - topY; // 150px
  const chartW = svgWidth - paddingLeft - paddingRight; // 412px
  const stepX = chartW / (dates.length - 1); // 34.33px per step

  const points = data.map((d, i) => {
    const cx = paddingLeft + i * stepX;
    const lineY = baseY - (d.km / 200) * plotH;
    return { cx, lineY, ...d };
  });

  const curvePoints = points.map((p) => ({ x: p.cx, y: p.lineY }));

  const createSmoothPath = (pts) => {
    if (pts.length < 2) return "";
    let path = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 5;
      const cp1y = p1.y + (p2.y - p0.y) / 5;
      const cp2x = p2.x - (p3.x - p1.x) / 5;
      const cp2y = p2.y - (p3.y - p1.y) / 5;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(
        1
      )} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const smoothLineD = createSmoothPath(curvePoints);
  const smoothAreaD = `${smoothLineD} L ${
    curvePoints[curvePoints.length - 1].x
  } ${baseY} L ${curvePoints[0].x} ${baseY} Z`;

  return (
    <div className="dashboard-panel dist-sub-card">
      <div className="panel-section-header">
        <h3 className="section-title">THỐNG KÊ QUẢNG ĐƯỜNG BAY (km)</h3>
        <select className="select-sm">
          <option>13 ngày</option>
        </select>
      </div>

      <div className="dist-curve-box">
        <svg
          width="100%"
          height="210"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="dist-svg"
        >
          <defs>
            <linearGradient id="greenDistGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid Lines & Left Y-Axis Ticks */}
          {[
            { y: 28, val: 200 },
            { y: 65.5, val: 150 },
            { y: 103, val: 100 },
            { y: 140.5, val: 50 },
            { y: 178, val: 0 },
          ].map((g, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={g.y}
                x2={svgWidth - paddingRight}
                y2={g.y}
                stroke="#1e293b"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 6}
                y={g.y + 3}
                fill="#64748b"
                fontSize="9"
                textAnchor="end"
                fontFamily="JetBrains Mono, monospace"
              >
                {g.val}
              </text>
            </g>
          ))}

          {/* Smooth Green Gradient Under-fill */}
          <path d={smoothAreaD} fill="url(#greenDistGrad)" />

          {/* Smooth Green Line Path */}
          <path d={smoothLineD} fill="none" stroke="#22c55e" strokeWidth="2" />

          {/* Glowing Green Node Dots */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.cx}
              cy={p.lineY}
              r="3.5"
              fill="#4ade80"
              stroke="#0b0f19"
              strokeWidth="1.5"
            />
          ))}

          {/* X-Axis Date Labels (every 2nd date: 01/05, 03/05, 05/05, 07/05, 09/05, 11/05, 13/05) */}
          {points.map(
            (p, i) =>
              i % 2 === 0 && (
                <text
                  key={p.day + i}
                  x={p.cx}
                  y="196"
                  fill="#94a3b8"
                  fontSize="9.5"
                  fontWeight="500"
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {p.day}
                </text>
              )
          )}
        </svg>
      </div>
    </div>
  );
}
