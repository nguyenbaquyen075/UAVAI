import { useState } from "react";

export default function FlightHoursChart() {
  const [timeRange, setTimeRange] = useState("30 ngày");

  const dates = ["14/04", "17/04", "20/04", "23/04", "26/04", "29/04", "02/05", "05/05", "08/05", "11/05", "13/05"];

  const uavSeries = [
    { id: "UAV_01", color: "#22c55e", points: [12, 14, 19, 13, 16, 17, 21, 18.6, 17, 19, 18] },
    { id: "UAV_02", color: "#3b82f6", points: [9, 11, 14, 12, 14, 12, 16, 14.3, 13, 14, 15] },
    { id: "UAV_03", color: "#a855f7", points: [7, 8, 11, 10, 11, 9, 13, 11.8, 11, 12, 13] },
    { id: "UAV_04", color: "#f97316", points: [5, 6, 8, 7, 9, 8, 10, 9.2, 9, 10, 9] },
    { id: "UAV_05", color: "#06b6d4", points: [3, 4, 6, 5, 7, 6, 8, 6.7, 7, 8, 7] },
    { id: "UAV_06", color: "#ef4444", points: [1, 2, 3, 3, 4, 3, 5, 3.1, 4, 4, 3] },
  ];

  const svgWidth = 560;
  const svgHeight = 200;
  const maxY = 25;

  const getPath = (points) => {
    const step = svgWidth / (points.length - 1);
    return points
      .map((val, idx) => {
        const x = idx * step;
        const y = svgHeight - (val / maxY) * (svgHeight - 20) - 10;
        return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  };

  // Tooltip x position for index 7 (05/05)
  const tooltipX = 7 * (svgWidth / (dates.length - 1));

  return (
    <div className="flight-hours-card">
      <div className="card-header-row">
        <div className="card-title">
          <span>THỐNG KÊ GIỜ BAY</span>
          <span className="info-icon" title="Tổng giờ bay của hệ thống theo mốc thời gian">ⓘ</span>
        </div>
        <div className="card-controls">
          <div className="range-tabs">
            {["7 ngày", "30 ngày", "90 ngày"].map((range) => (
              <button
                key={range}
                className={`range-tab ${timeRange === range ? "active" : ""}`}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
          <div className="datepicker-btn">
            <span>14/04/2024 - 13/05/2024</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </div>
        </div>
      </div>

      <div className="chart-wrapper">
        <div className="y-axis">
          <span>25h</span>
          <span>20h</span>
          <span>15h</span>
          <span>10h</span>
          <span>5h</span>
          <span>0h</span>
        </div>

        <div className="svg-container">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none" className="multi-line-svg">
            {/* Horizontal Grid lines */}
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, i) => (
              <line
                key={i}
                x1="0"
                y1={svgHeight * ratio}
                x2={svgWidth}
                y2={svgHeight * ratio}
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}

            {/* Series Lines */}
            {uavSeries.map((series) => (
              <path
                key={series.id}
                d={getPath(series.points)}
                fill="none"
                stroke={series.color}
                strokeWidth="2.5"
              />
            ))}

            {/* Active Vertical Tooltip Line */}
            <line x1={tooltipX} y1="0" x2={tooltipX} y2={svgHeight} stroke="#475569" strokeDasharray="3 3" strokeWidth="1.5" />

            {/* Hover Circles */}
            {uavSeries.map((series) => {
              const val = series.points[7];
              const cy = svgHeight - (val / maxY) * (svgHeight - 20) - 10;
              return <circle key={series.id} cx={tooltipX} cy={cy} r="4" fill={series.color} stroke="#10141d" strokeWidth="2" />;
            })}
          </svg>

          {/* Floating Tooltip Box */}
          <div className="chart-tooltip-box" style={{ left: `${(tooltipX / svgWidth) * 82}%` }}>
            <div className="tooltip-date">05/05/2024</div>
            <div className="tooltip-items">
              {uavSeries.map((s) => (
                <div key={s.id} className="tooltip-item">
                  <span className="dot" style={{ background: s.color }}></span>
                  <span className="lbl">{s.id}:</span>
                  <strong className="val">{s.points[7]} h</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="x-axis">
            {dates.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Series Legend at Bottom */}
      <div className="chart-series-legend">
        {uavSeries.map((s) => (
          <div key={s.id} className="legend-chip">
            <span className="chip-line" style={{ background: s.color }}></span>
            <span>{s.id}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
