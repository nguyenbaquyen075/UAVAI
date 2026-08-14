export default function AlertsTimeChart() {
  const times = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "24:00"];

  const series = [
    { id: "red", color: "#ef4444", points: [1, 2, 1, 3, 2, 4, 3] },
    { id: "orange", color: "#f97316", points: [2, 3, 4, 6, 5, 8, 7] },
    { id: "yellow", color: "#facc15", points: [4, 5, 8, 12, 10, 16, 15] },
    { id: "blue", color: "#3b82f6", points: [8, 10, 15, 22, 18, 29, 28] },
  ];

  const svgWidth = 340;
  const svgHeight = 140;
  const maxY = 30;

  const getPath = (pts) => {
    const step = svgWidth / (pts.length - 1);
    return pts
      .map((val, idx) => {
        const x = idx * step;
        const y = svgHeight - (val / maxY) * (svgHeight - 16) - 8;
        return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  };

  return (
    <div className="alerts-time-chart-card">
      <div className="card-header-row">
        <span className="card-title">THỐNG KÊ CẢNH BÁO THEO THỜI GIAN</span>
        <select className="mini-select" defaultValue="24h">
          <option value="24h">24 giờ qua</option>
          <option value="7d">7 ngày qua</option>
        </select>
      </div>

      <div className="time-chart-body">
        <div className="time-svg-wrap">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none" className="time-svg">
            {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
              <line key={i} x1="0" y1={svgHeight * r} x2={svgWidth} y2={svgHeight * r} stroke="#1e293b" strokeDasharray="3 3" strokeWidth="1" />
            ))}

            {series.map((s) => (
              <g key={s.id}>
                <path d={getPath(s.points)} fill="none" stroke={s.color} strokeWidth="2" />
                {s.points.map((val, idx) => {
                  const step = svgWidth / (s.points.length - 1);
                  const cx = idx * step;
                  const cy = svgHeight - (val / maxY) * (svgHeight - 16) - 8;
                  return <circle key={idx} cx={cx} cy={cy} r="3" fill={s.color} />;
                })}
              </g>
            ))}
          </svg>

          <div className="time-x-axis">
            {times.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-series-legend center">
        <div className="legend-chip"><span className="chip-line" style={{ background: "#ef4444" }}></span> Nghiêm trọng</div>
        <div className="legend-chip"><span className="chip-line" style={{ background: "#f97316" }}></span> Quan trọng</div>
        <div className="legend-chip"><span className="chip-line" style={{ background: "#facc15" }}></span> Trung bình</div>
        <div className="legend-chip"><span className="chip-line" style={{ background: "#3b82f6" }}></span> Thông tin</div>
      </div>
    </div>
  );
}
