// buckets: 13 điểm (mỗi 2h trong 24h qua), mỗi điểm { red, yellow } — số cảnh báo thật theo giờ
export default function AlertsTimeChart({ buckets = Array.from({ length: 13 }, () => ({ red: 0, yellow: 0 })) }) {
  const svgWidth = 360;
  const svgHeight = 150;
  const paddingLeft = 30;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;
  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;
  const maxY = Math.max(1, ...buckets.map((b) => Math.max(b.red, b.yellow))) + 1;

  const getCoords = (key) => {
    const stepX = chartW / (buckets.length - 1);
    return buckets.map((b, idx) => {
      const x = paddingLeft + idx * stepX;
      const y = paddingTop + chartH - (b[key] / maxY) * chartH;
      return { x, y, val: b[key] };
    });
  };

  const redCoords = getCoords("red");
  const yellowCoords = getCoords("yellow");

  const makePath = (coords) =>
    coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");

  const makeAreaPath = (coords) => {
    const line = makePath(coords);
    const lastX = coords[coords.length - 1].x.toFixed(1);
    const firstX = coords[0].x.toFixed(1);
    const bottomY = (paddingTop + chartH).toFixed(1);
    return `${line} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  const yTicks = [maxY, Math.round(maxY * 0.75), Math.round(maxY * 0.5), Math.round(maxY * 0.25), 0];

  return (
    <div className="dashboard-panel btm-chart-card-v2">
      <div className="panel-section-header">
        <h3 className="section-title">THỐNG KÊ CẢNH BÁO THEO THỜI GIAN</h3>
        <select className="select-sm">
          <option>24 giờ qua</option>
        </select>
      </div>

      <div className="chart-top-legend-row">
        <span className="lgd-item"><span className="dot dot-red">●</span> Nguy hiểm</span>
        <span className="lgd-item"><span className="dot dot-yellow">●</span> Cảnh báo nhẹ</span>
      </div>

      <div className="time-chart-svg-wrapper">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="time-area-svg">
          <defs>
            <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradYellow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {yTicks.map((val) => {
            const y = paddingTop + chartH - (val / maxY) * chartH;
            return (
              <g key={val}>
                <line x1={paddingLeft} y1={y} x2={svgWidth - paddingRight} y2={y} stroke="#1a2333" strokeWidth="1" />
                <text x={paddingLeft - 6} y={y + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono, monospace">
                  {val}
                </text>
              </g>
            );
          })}

          <path d={makeAreaPath(redCoords)} fill="url(#gradRed)" />
          <path d={makeAreaPath(yellowCoords)} fill="url(#gradYellow)" />
          <path d={makePath(redCoords)} fill="none" stroke="#ef4444" strokeWidth="2" />
          <path d={makePath(yellowCoords)} fill="none" stroke="#f59e0b" strokeWidth="2" />

          {redCoords.map((c, i) => (
            <circle key={`r-${i}`} cx={c.x} cy={c.y} r="3" fill="#ef4444" stroke="#0b0f19" strokeWidth="1" />
          ))}
          {yellowCoords.map((c, i) => (
            <circle key={`y-${i}`} cx={c.x} cy={c.y} r="3" fill="#f59e0b" stroke="#0b0f19" strokeWidth="1" />
          ))}
        </svg>

        <div className="time-x-labels-v2">
          <span>00:00</span>
          <span>04:00</span>
          <span>08:00</span>
          <span>12:00</span>
          <span>16:00</span>
          <span>20:00</span>
          <span>24:00</span>
        </div>
      </div>
    </div>
  );
}
