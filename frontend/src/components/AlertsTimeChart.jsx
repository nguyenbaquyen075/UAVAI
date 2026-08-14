// ponytail: alert_events chỉ có 2 mức thật (red/yellow — xem pipeline.severity()), không có
// "nghiêm trọng/quan trọng/trung bình/thông tin" như bản mock cũ. buckets: mảng 24 số nguyên
// (đếm cảnh báo theo giờ trong 24h qua), truyền từ AlertsView (tính từ getLogs() thật).
export default function AlertsTimeChart({ redBuckets = Array(24).fill(0), yellowBuckets = Array(24).fill(0) }) {
  const series = [
    { id: "red", color: "#ef4444", points: redBuckets },
    { id: "yellow", color: "#facc15", points: yellowBuckets },
  ];
  const svgWidth = 340;
  const svgHeight = 140;
  const maxY = Math.max(...redBuckets, ...yellowBuckets, 1);

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

  const hasData = redBuckets.some((v) => v > 0) || yellowBuckets.some((v) => v > 0);

  return (
    <div className="alerts-time-chart-card">
      <div className="card-header-row">
        <span className="card-title">CẢNH BÁO THEO GIỜ (24H QUA)</span>
      </div>

      {!hasData ? (
        <p className="muted">Chưa có cảnh báo trong 24 giờ qua.</p>
      ) : (
        <div className="time-chart-body">
          <div className="time-svg-wrap">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none" className="time-svg">
              {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
                <line key={i} x1="0" y1={svgHeight * r} x2={svgWidth} y2={svgHeight * r} stroke="#1e293b" strokeDasharray="3 3" strokeWidth="1" />
              ))}
              {series.map((s) => (
                <g key={s.id}>
                  <path d={getPath(s.points)} fill="none" stroke={s.color} strokeWidth="2" />
                </g>
              ))}
            </svg>
            <div className="time-x-axis">
              {["-24h", "-18h", "-12h", "-6h", "now"].map((t) => <span key={t}>{t}</span>)}
            </div>
          </div>
        </div>
      )}

      <div className="chart-series-legend center">
        <div className="legend-chip"><span className="chip-line" style={{ background: "#ef4444" }}></span> Nguy hiểm</div>
        <div className="legend-chip"><span className="chip-line" style={{ background: "#facc15" }}></span> Cảnh báo</div>
      </div>
    </div>
  );
}
