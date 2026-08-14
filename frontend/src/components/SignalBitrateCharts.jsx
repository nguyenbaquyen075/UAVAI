import { useEffect, useState } from "react";

export default function SignalBitrateCharts() {
  const [downlink, setDownlink] = useState(25.6);
  const [uplink, setUplink] = useState(8.6);

  // Sparkline point arrays
  const [downPoints, setDownPoints] = useState([20, 22, 21, 24, 25.6, 25.2, 26.1, 25.6]);
  const [upPoints, setUpPoints] = useState([7.5, 8.0, 8.2, 8.6, 8.4, 8.9, 8.5, 8.6]);

  useEffect(() => {
    const timer = setInterval(() => {
      const newDown = +(24 + Math.random() * 3).toFixed(1);
      const newUp = +(8 + Math.random() * 1.2).toFixed(1);

      setDownlink(newDown);
      setUplink(newUp);

      setDownPoints((prev) => [...prev.slice(1), newDown]);
      setUpPoints((prev) => [...prev.slice(1), newUp]);
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  const makePath = (points, minVal, maxVal) => {
    const width = 140;
    const height = 28;
    const step = width / (points.length - 1);
    const range = maxVal - minVal || 1;

    return points
      .map((val, idx) => {
        const x = idx * step;
        const y = height - ((val - minVal) / range) * (height - 6) - 3;
        return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  };

  return (
    <div className="signal-chart-panel">
      <div className="panel-title">TRUYỀN TÍN HIỆU</div>
      <div className="signal-rows">
        {/* Downlink */}
        <div className="signal-row">
          <div className="signal-meta">
            <span className="signal-label">Downlink</span>
            <strong className="signal-val green">{downlink} Mbps</strong>
          </div>
          <div className="sparkline-wrap">
            <svg width="140" height="28" viewBox="0 0 140 28">
              <defs>
                <linearGradient id="downGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ade80" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#4ade80" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d={`${makePath(downPoints, 20, 28)} L 140 28 L 0 28 Z`}
                fill="url(#downGrad)"
              />
              <path
                d={makePath(downPoints, 20, 28)}
                fill="none"
                stroke="#4ade80"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        {/* Uplink */}
        <div className="signal-row">
          <div className="signal-meta">
            <span className="signal-label">Uplink</span>
            <strong className="signal-val blue">{uplink} Mbps</strong>
          </div>
          <div className="sparkline-wrap">
            <svg width="140" height="28" viewBox="0 0 140 28">
              <defs>
                <linearGradient id="upGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d={`${makePath(upPoints, 6, 11)} L 140 28 L 0 28 Z`}
                fill="url(#upGrad)"
              />
              <path
                d={makePath(upPoints, 6, 11)}
                fill="none"
                stroke="#60a5fa"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
