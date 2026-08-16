// days: [{ day: "01/05", completed, active, ratePct }] — số nhiệm vụ thật theo ngày bắt đầu (started_at)
export default function MissionDayChart({ days = [] }) {
  const svgWidth = 520;
  const svgHeight = 220;
  const paddingLeft = 42;
  const paddingRight = 48;
  const baseY = 190;
  const topY = 32;
  const plotH = baseY - topY;
  const chartW = svgWidth - paddingLeft - paddingRight;
  const stepX = days.length > 1 ? chartW / (days.length - 1) : 0;
  const maxCount = Math.max(4, ...days.map((d) => d.completed + d.active));

  const points = days.map((d, i) => {
    const cx = paddingLeft + i * stepX;
    const lineY = baseY - (d.ratePct / 100) * plotH;
    return { cx, lineY, ...d };
  });

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
      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const curvePoints = points.map((p) => ({ x: p.cx, y: p.lineY }));
  const smoothLineD = createSmoothPath(curvePoints);
  const smoothAreaD = curvePoints.length > 1
    ? `${smoothLineD} L ${curvePoints[curvePoints.length - 1].x} ${baseY} L ${curvePoints[0].x} ${baseY} Z`
    : "";

  return (
    <div className="dashboard-panel chart-panel-2fr">
      <div className="panel-section-header">
        <h3 className="section-title">THỐNG KÊ NHIỆM VỤ THEO NGÀY</h3>
        <span className="sort-sub-text">{days.length} ngày</span>
      </div>

      <div className="stacked-combo-chart-box">
        {days.length === 0 ? (
          <div className="chart-empty-state">Chưa có nhiệm vụ nào trong khoảng thời gian này</div>
        ) : (
          <svg width="100%" height="220" viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="combo-svg">
            <defs>
              <linearGradient id="blueLineGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>

            <text x="12" y="16" fill="#64748b" fontSize="9" fontWeight="600">Số nhiệm vụ</text>
            <text x={svgWidth - 12} y="16" fill="#64748b" fontSize="9" fontWeight="600" textAnchor="end">Tỷ lệ (%)</text>

            {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
              const y = baseY - frac * plotH;
              return (
                <g key={frac}>
                  <line x1={paddingLeft} y1={y} x2={svgWidth - paddingRight} y2={y} stroke="#1e293b" strokeWidth="1" />
                  <text x={paddingLeft - 8} y={y + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono, monospace">
                    {Math.round(frac * maxCount)}
                  </text>
                  <text x={svgWidth - paddingRight + 8} y={y + 3} fill="#64748b" fontSize="9" textAnchor="start" fontFamily="JetBrains Mono, monospace">
                    {Math.round(frac * 100)}%
                  </text>
                </g>
              );
            })}

            {points.map((p, i) => {
              const barW = Math.min(16, stepX * 0.5);
              const barX = p.cx - barW / 2;
              const activeH = (p.active / maxCount) * plotH;
              const activeY = baseY - activeH;
              const completedH = (p.completed / maxCount) * plotH;
              const completedY = activeY - completedH;
              return (
                <g key={i}>
                  <rect x={barX} y={activeY} width={barW} height={activeH} fill="#a855f7" rx="2" />
                  <rect x={barX} y={completedY} width={barW} height={completedH} fill="#22c55e" rx="2" />
                </g>
              );
            })}

            <path d={smoothAreaD} fill="url(#blueLineGrad)" />
            <path d={smoothLineD} fill="none" stroke="#3b82f6" strokeWidth="2" />
            {points.map((p, i) => (
              <circle key={i} cx={p.cx} cy={p.lineY} r="3.5" fill="#38bdf8" stroke="#0b0f19" strokeWidth="1.5" />
            ))}

            {points.map((p, i) => (
              <text key={p.day + i} x={p.cx} y="208" fill="#94a3b8" fontSize="9.5" fontWeight="500" textAnchor="middle" fontFamily="JetBrains Mono, monospace">
                {p.day}
              </text>
            ))}
          </svg>
        )}

        <div className="chart-bottom-legend-row">
          <span className="lgd-item"><span className="sq sq-green" /> Hoàn thành</span>
          <span className="lgd-item"><span className="sq sq-purple" /> Đang thực hiện</span>
          <span className="lgd-item"><span className="dot dot-blue" /> Tỷ lệ hoàn thành (%)</span>
        </div>
      </div>
    </div>
  );
}
