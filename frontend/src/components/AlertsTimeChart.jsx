export default function AlertsTimeChart() {
  // 13 time slots: 00:00, 02:00, 04:00, 06:00, 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00, 24:00
  const bluePoints = [5, 10, 9, 14, 18, 20, 22, 29, 24, 30, 35, 30, 27];
  const redPoints = [3, 7, 6, 10, 9, 11, 15, 18, 14, 20, 24, 20, 17];
  const orangePoints = [1, 4, 5, 7, 7, 9, 11, 13, 11, 15, 17, 14, 12];
  const yellowPoints = [0, 1, 1, 2, 3, 3, 4, 6, 7, 9, 10, 9, 7];

  const svgWidth = 360;
  const svgHeight = 150;
  const paddingLeft = 30;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 25;
  const chartW = svgWidth - paddingLeft - paddingRight;
  const chartH = svgHeight - paddingTop - paddingBottom;
  const maxY = 40;

  const getCoords = (pts) => {
    const stepX = chartW / (pts.length - 1);
    return pts.map((val, idx) => {
      const x = paddingLeft + idx * stepX;
      const y = paddingTop + chartH - (val / maxY) * chartH;
      return { x, y, val };
    });
  };

  const blueCoords = getCoords(bluePoints);
  const redCoords = getCoords(redPoints);
  const orangeCoords = getCoords(orangePoints);
  const yellowCoords = getCoords(yellowPoints);

  const makePath = (coords) => {
    return coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(" ");
  };

  const makeAreaPath = (coords) => {
    const line = makePath(coords);
    const lastX = coords[coords.length - 1].x.toFixed(1);
    const firstX = coords[0].x.toFixed(1);
    const bottomY = (paddingTop + chartH).toFixed(1);
    return `${line} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  };

  return (
    <div className="dashboard-panel btm-chart-card-v2">
      {/* Header */}
      <div className="panel-section-header">
        <h3 className="section-title">THỐNG KÊ CẢNH BÁO THEO THỜI GIAN</h3>
        <select className="select-sm">
          <option>24 giờ qua</option>
        </select>
      </div>

      {/* Sub Legend */}
      <div className="chart-top-legend-row">
        <span className="lgd-item">
          <span className="dot dot-red">●</span> Nghiêm trọng
        </span>
        <span className="lgd-item">
          <span className="dot dot-orange">●</span> Quan trọng
        </span>
        <span className="lgd-item">
          <span className="dot dot-yellow">●</span> Trung bình
        </span>
        <span className="lgd-item">
          <span className="dot dot-blue">●</span> Thông tin
        </span>
      </div>

      {/* Main SVG Area Line Chart */}
      <div className="time-chart-svg-wrapper">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="time-area-svg">
          <defs>
            <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradOrange" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradYellow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines and Y-axis labels */}
          {[40, 30, 20, 10, 0].map((val) => {
            const y = paddingTop + chartH - (val / maxY) * chartH;
            return (
              <g key={val}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={svgWidth - paddingRight}
                  y2={y}
                  stroke="#1a2333"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 6}
                  y={y + 3}
                  fill="#64748b"
                  fontSize="9"
                  textAnchor="end"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          <path d={makeAreaPath(blueCoords)} fill="url(#gradBlue)" />
          <path d={makeAreaPath(redCoords)} fill="url(#gradRed)" />
          <path d={makeAreaPath(orangeCoords)} fill="url(#gradOrange)" />
          <path d={makeAreaPath(yellowCoords)} fill="url(#gradYellow)" />

          {/* Stroke Lines */}
          <path d={makePath(blueCoords)} fill="none" stroke="#3b82f6" strokeWidth="2" />
          <path d={makePath(redCoords)} fill="none" stroke="#ef4444" strokeWidth="2" />
          <path d={makePath(orangeCoords)} fill="none" stroke="#f97316" strokeWidth="2" />
          <path d={makePath(yellowCoords)} fill="none" stroke="#f59e0b" strokeWidth="2" />

          {/* Data Circle Markers (Nodes) */}
          {blueCoords.map((c, i) => (
            <circle key={`b-${i}`} cx={c.x} cy={c.y} r="3" fill="#3b82f6" stroke="#0b0f19" strokeWidth="1" />
          ))}
          {redCoords.map((c, i) => (
            <circle key={`r-${i}`} cx={c.x} cy={c.y} r="3" fill="#ef4444" stroke="#0b0f19" strokeWidth="1" />
          ))}
          {orangeCoords.map((c, i) => (
            <circle key={`o-${i}`} cx={c.x} cy={c.y} r="3" fill="#f97316" stroke="#0b0f19" strokeWidth="1" />
          ))}
          {yellowCoords.map((c, i) => (
            <circle key={`y-${i}`} cx={c.x} cy={c.y} r="3" fill="#f59e0b" stroke="#0b0f19" strokeWidth="1" />
          ))}
        </svg>

        {/* X Axis Labels */}
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
