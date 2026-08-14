export default function BatteryConsumptionChart() {
  const dates = ["14/04", "20/04", "26/04", "02/05", "08/05", "13/05"];

  const series = [
    { id: "UAV_01", color: "#4ade80", points: [95, 82, 70, 55, 40, 25] },
    { id: "UAV_02", color: "#60a5fa", points: [90, 75, 58, 42, 28, 15] },
    { id: "UAV_03", color: "#c084fc", points: [88, 70, 50, 35, 20, 10] },
  ];

  const svgWidth = 340;
  const svgHeight = 140;
  const maxY = 100;

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
    <div className="battery-chart-card">
      <div className="card-header-row">
        <span className="card-title">PHÂN TÍCH TIÊU THỤ PIN</span>
      </div>

      <div className="battery-chart-body">
        <div className="bat-y-axis">
          <span>Pin (%)</span>
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0%</span>
        </div>

        <div className="bat-svg-wrap">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none" className="bat-svg">
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

          <div className="bat-x-axis">
            {dates.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-series-legend center">
        {series.map((s) => (
          <div key={s.id} className="legend-chip">
            <span className="chip-line" style={{ background: s.color }}></span>
            <span>{s.id}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
