import { useEffect, useRef } from "react";

export default function DistanceChart() {
  const canvasRef = useRef(null);

  const days = ["01/05","03/05","05/05","07/05","09/05","11/05","13/05"];
  const distances = [80, 120, 95, 155, 130, 170, 148];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const cw = canvas.offsetWidth;
    const ch = canvas.offsetHeight;
    ctx.clearRect(0, 0, cw, ch);

    const padL = 38, padR = 12, padT = 12, padB = 28;
    const plotW = cw - padL - padR;
    const plotH = ch - padT - padB;
    const n = days.length;
    const gap = plotW / (n - 1);
    const maxVal = 200;

    // Grid
    ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + plotH - (plotH * i / 4);
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
      ctx.fillStyle = "#64748b"; ctx.font = "9px sans-serif"; ctx.textAlign = "right";
      ctx.fillText(Math.round(maxVal * i / 4), padL - 4, y + 3);
    }

    // Area fill
    const pts = distances.map((v, i) => ({ x: padL + i * gap, y: padT + plotH - (v / maxVal) * plotH }));
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, padT + plotH);
    ctx.lineTo(pts[0].x, padT + plotH);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
    grad.addColorStop(0, "rgba(34,197,94,0.4)");
    grad.addColorStop(1, "rgba(34,197,94,0.02)");
    ctx.fillStyle = grad; ctx.fill();

    // Line
    ctx.beginPath(); ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 2.5;
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.stroke();

    // Dots
    pts.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = "#22c55e"; ctx.fill();
    });

    // X labels
    ctx.fillStyle = "#64748b"; ctx.font = "9px sans-serif"; ctx.textAlign = "center";
    days.forEach((d, i) => ctx.fillText(d, padL + i * gap, padT + plotH + 16));
  }, []);

  return (
    <div className="report-chart-card">
      <div className="card-header-row">
        <span className="card-title">THỐNG KÊ QUẢNG ĐƯỜNG BAY (km)</span>
        <select className="mini-select" defaultValue="13">
          <option value="7">7 ngày</option>
          <option value="13">13 ngày</option>
        </select>
      </div>
      <canvas ref={canvasRef} className="report-canvas" style={{height:"130px"}}></canvas>
    </div>
  );
}
