export default function MissionDayChart() {
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
    "13/05",
  ];

  const data = [
    { day: "01/05", greenVal: 4.0, purpleVal: 1.8, ratePct: 79 },
    { day: "02/05", greenVal: 2.5, purpleVal: 1.5, ratePct: 66 },
    { day: "03/05", greenVal: 3.6, purpleVal: 2.0, ratePct: 84 },
    { day: "04/05", greenVal: 3.6, purpleVal: 1.8, ratePct: 56 },
    { day: "05/05", greenVal: 3.7, purpleVal: 1.5, ratePct: 43 },
    { day: "06/05", greenVal: 4.8, purpleVal: 1.8, ratePct: 68 },
    { day: "07/05", greenVal: 5.7, purpleVal: 1.6, ratePct: 86 },
    { day: "08/05", greenVal: 3.3, purpleVal: 2.0, ratePct: 74 },
    { day: "09/05", greenVal: 3.4, purpleVal: 1.8, ratePct: 72 },
    { day: "10/05", greenVal: 3.3, purpleVal: 2.1, ratePct: 66 },
    { day: "11/05", greenVal: 4.5, purpleVal: 1.8, ratePct: 91 },
    { day: "13/05", greenVal: 2.7, purpleVal: 1.8, ratePct: 86 },
  ];

  const svgWidth = 520;
  const svgHeight = 220;
  const paddingLeft = 42;
  const paddingRight = 48;
  const baseY = 190;
  const topY = 32;
  const plotH = baseY - topY; // 158px
  const chartW = svgWidth - paddingLeft - paddingRight; // 430px
  const stepX = chartW / (dates.length - 1); // 39.09px per step

  const points = data.map((d, i) => {
    const cx = paddingLeft + i * stepX;
    const lineY = baseY - (d.ratePct / 100) * plotH;
    return { cx, lineY, ...d };
  });

  // Calculate smooth cubic Bezier curve
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
    <div className="dashboard-panel chart-panel-2fr">
      {/* Panel Header */}
      <div className="panel-section-header">
        <h3 className="section-title">THỐNG KÊ NHIỆM VỤ THEO NGÀY</h3>
        <select className="select-sm">
          <option>13 ngày</option>
        </select>
      </div>

      {/* Main Combined SVG Chart */}
      <div className="stacked-combo-chart-box">
        <svg
          width="100%"
          height="220"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="combo-svg"
        >
          <defs>
            <linearGradient id="blueLineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Titles above Y-Axes */}
          <text x="12" y="16" fill="#64748b" fontSize="9" fontWeight="600">
            Số nhiệm vụ
          </text>
          <text
            x={svgWidth - 12}
            y="16"
            fill="#64748b"
            fontSize="9"
            fontWeight="600"
            textAnchor="end"
          >
            Tỷ lệ (%)
          </text>

          {/* Grid Lines & Y-Axis Ticks */}
          {[
            { y: 32, numVal: 10, pctVal: "100%" },
            { y: 63.6, numVal: 8, pctVal: "" },
            { y: 95.2, numVal: 6, pctVal: "75%" },
            { y: 126.8, numVal: 4, pctVal: "50%" },
            { y: 158.4, numVal: 2, pctVal: "25%" },
            { y: 190, numVal: 0, pctVal: "0%" },
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
                x={paddingLeft - 8}
                y={g.y + 3}
                fill="#64748b"
                fontSize="9"
                textAnchor="end"
                fontFamily="JetBrains Mono, monospace"
              >
                {g.numVal}
              </text>
              {g.pctVal && (
                <text
                  x={svgWidth - paddingRight + 8}
                  y={g.y + 3}
                  fill="#64748b"
                  fontSize="9"
                  textAnchor="start"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {g.pctVal}
                </text>
              )}
            </g>
          ))}

          {/* Stacked Bars */}
          {points.map((p, i) => {
            const barW = 16;
            const barX = p.cx - barW / 2;

            const purpleH = (p.purpleVal / 10) * plotH;
            const purpleY = baseY - purpleH;

            const greenH = (p.greenVal / 10) * plotH;
            const greenY = purpleY - greenH;

            return (
              <g key={i}>
                {/* Purple bottom bar (Đang thực hiện) */}
                <rect
                  x={barX}
                  y={purpleY}
                  width={barW}
                  height={purpleH}
                  fill="#a855f7"
                  rx="2"
                />
                {/* Green top bar (Hoàn thành) */}
                <rect
                  x={barX}
                  y={greenY}
                  width={barW}
                  height={greenH}
                  fill="#22c55e"
                  rx="2"
                />
              </g>
            );
          })}

          {/* Smooth Blue Gradient Under-fill */}
          <path d={smoothAreaD} fill="url(#blueLineGrad)" />

          {/* Smooth Blue Line Path */}
          <path d={smoothLineD} fill="none" stroke="#3b82f6" strokeWidth="2" />

          {/* Cyan Node Dots */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.cx}
              cy={p.lineY}
              r="3.5"
              fill="#38bdf8"
              stroke="#0b0f19"
              strokeWidth="1.5"
            />
          ))}

          {/* X-Axis Date Labels 100% aligned under each bar */}
          {dates.map((date, i) => (
            <text
              key={date + i}
              x={points[i].cx}
              y="208"
              fill="#94a3b8"
              fontSize="9.5"
              fontWeight="500"
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
            >
              {date}
            </text>
          ))}
        </svg>

        {/* Sub Legend Row */}
        <div className="chart-bottom-legend-row">
          <span className="lgd-item">
            <span className="sq sq-green" /> Hoàn thành
          </span>
          <span className="lgd-item">
            <span className="sq sq-purple" /> Đang thực hiện
          </span>
          <span className="lgd-item">
            <span className="dot dot-blue" /> Tỷ lệ hoàn thành (%)
          </span>
        </div>
      </div>
    </div>
  );
}
