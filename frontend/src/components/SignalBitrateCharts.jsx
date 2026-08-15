import { useEffect, useState } from "react";

export default function SignalBitrateCharts() {
  const [downlink, setDownlink] = useState(25.6);
  const [uplink, setUplink] = useState(8.6);

  const downPoints = [12, 18, 14, 22, 19, 28, 24, 32, 28, 35, 30, 42, 36, 45, 38, 48, 40, 36];
  const upPoints = [8, 12, 10, 16, 14, 22, 18, 26, 20, 28, 24, 18, 22, 29, 21, 26, 22, 20];

  const makeSvgPath = (points, maxVal) => {
    const width = 160;
    const height = 34;
    const step = width / (points.length - 1);

    const pathData = points
      .map((val, idx) => {
        const x = idx * step;
        const y = height - (val / maxVal) * (height - 4) - 2;
        return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");

    return pathData;
  };

  return (
    <div className="signal-bitrate-panel-v2">
      {/* Downlink Row */}
      <div className="signal-metric-row">
        <div className="signal-info">
          <span className="sig-lbl">Downlink</span>
          <span className="sig-val font-mono">{downlink} Mbps</span>
        </div>
        <div className="sparkline-chart">
          <svg width="160" height="34" viewBox="0 0 160 34">
            <defs>
              <linearGradient id="downGradV2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d={`${makeSvgPath(downPoints, 50)} L 160 34 L 0 34 Z`}
              fill="url(#downGradV2)"
            />
            <path
              d={makeSvgPath(downPoints, 50)}
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      <div className="signal-divider-line" />

      {/* Uplink Row */}
      <div className="signal-metric-row">
        <div className="signal-info">
          <span className="sig-lbl">Uplink</span>
          <span className="sig-val font-mono">{uplink} Mbps</span>
        </div>
        <div className="sparkline-chart">
          <svg width="160" height="34" viewBox="0 0 160 34">
            <defs>
              <linearGradient id="upGradV2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d={`${makeSvgPath(upPoints, 35)} L 160 34 L 0 34 Z`}
              fill="url(#upGradV2)"
            />
            <path
              d={makeSvgPath(upPoints, 35)}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
