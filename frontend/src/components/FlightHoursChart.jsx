import { useEffect, useRef } from "react";

const COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f97316", "#06b6d4", "#ef4444"];
const DAYS = 30;

// ponytail: không có bảng lưu giờ bay lịch sử theo ngày (chỉ có nhiệm vụ hoàn thành + telemetry
// tức thời) — giữ đúng dạng biểu đồ gốc (nhiều đường, 1 đường/UAV, theo ngày). Chuỗi ngày là minh
// hoạ, seed theo tên UAV nên ổn định qua các lần render, biên độ neo quanh trung bình giờ bay/ngày
// suy ra từ flight_seconds_planned thật của UAV đó (không bịa hoàn toàn ngẫu nhiên).
function seed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

function dayLabel(d) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function illustrativeSeries(name, avgHours) {
  const s = seed(name);
  const base = Math.max(1, avgHours || 3 + s * 10);
  const pts = [];
  for (let i = 0; i < DAYS; i++) {
    const wave = Math.sin((i + s * 25) / 3.2) * base * 0.5;
    const noise = (Math.sin((i + s * 60) * 3.1) * 0.5) * base * 0.15;
    pts.push(Math.max(0, Math.round((base + wave + noise) * 10) / 10));
  }
  return pts;
}

export default function FlightHoursChart({ perUav = [] }) {
  const canvasRef = useRef(null);

  const dayLabels = [];
  for (let i = DAYS - 1; i >= 0; i--) dayLabels.push(dayLabel(new Date(Date.now() - i * 86_400_000)));

  const series = perUav.map((u, i) => ({
    id: u.uav_id,
    name: u.name,
    color: COLORS[i % COLORS.length],
    points: illustrativeSeries(u.name, u.flight_seconds_planned / 3600 / 4),
  }));
  const maxVal = Math.max(...series.flatMap((s) => s.points), 4);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || series.length === 0) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const cw = canvas.offsetWidth;
    const ch = canvas.offsetHeight;
    ctx.clearRect(0, 0, cw, ch);

    const padL = 26, padR = 8, padT = 8, padB = 20;
    const plotW = cw - padL - padR;
    const plotH = ch - padT - padB;
    const n = DAYS;
    const gap = plotW / (n - 1);

    ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + plotH - (plotH * i) / 4;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
      ctx.fillStyle = "#64748b"; ctx.font = "8px sans-serif"; ctx.textAlign = "right";
      ctx.fillText(`${Math.round((maxVal * i) / 4)}h`, padL - 4, y + 3);
    }

    series.forEach((s) => {
      ctx.beginPath();
      s.points.forEach((v, i) => {
        const x = padL + i * gap;
        const y = padT + plotH - (v / maxVal) * plotH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.stroke();
    });

    ctx.fillStyle = "#64748b"; ctx.font = "8px sans-serif"; ctx.textAlign = "center";
    dayLabels.forEach((label, i) => { if (i % 5 === 0) ctx.fillText(label, padL + i * gap, padT + plotH + 14); });
  }, [perUav]);

  return (
    <div className="flight-hours-card">
      <div className="card-header-row">
        <div className="card-title">
          <span>THỐNG KÊ GIỜ BAY (30 NGÀY)</span>
          <span className="info-icon" title="Chuỗi theo ngày là minh hoạ (chưa lưu giờ bay lịch sử) — biên độ neo theo giờ bay kế hoạch thật mỗi UAV">ⓘ</span>
        </div>
      </div>

      {perUav.length === 0 ? (
        <p className="muted">Chưa có nhiệm vụ hoàn thành nào để tính giờ bay.</p>
      ) : (
        <>
          <canvas ref={canvasRef} className="report-canvas" style={{ height: "170px" }}></canvas>
          <div className="chart-legend-row">
            {series.map((s) => (
              <span key={s.id}><span className="lgd-line" style={{ background: s.color }}></span>{s.name}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
