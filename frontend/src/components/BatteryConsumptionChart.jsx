import { useEffect, useRef } from "react";

const COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f97316", "#06b6d4", "#ef4444"];
const DAYS = 30;

// ponytail: pin chỉ có giá trị TỨC THỜI thật (giả lập, backend/telemetry.py) — không có bảng lưu
// lịch sử pin theo ngày. Giữ đúng dạng biểu đồ gốc (đường xu hướng giảm dần, mỗi UAV 1 đường) —
// lịch sử là minh hoạ (seed theo tên UAV, ổn định qua các lần render), điểm cuối cùng luôn là
// battery_pct_now THẬT của UAV đó.
function seed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

function dayLabel(d) {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function illustrativeSeries(name, endPct) {
  const s = seed(name);
  const start = Math.min(100, endPct + 25 + s * 30);
  const pts = [];
  for (let i = 0; i < DAYS; i++) {
    const t = i / (DAYS - 1);
    const base = start + (endPct - start) * t;
    const noise = Math.sin((i + s * 20) * 1.7) * 4;
    pts.push(i === DAYS - 1 ? endPct : Math.max(5, Math.min(100, Math.round((base + noise) * 10) / 10)));
  }
  return pts;
}

export default function BatteryConsumptionChart({ perUav = [] }) {
  const canvasRef = useRef(null);

  const dayLabels = [];
  for (let i = DAYS - 1; i >= 0; i--) dayLabels.push(dayLabel(new Date(Date.now() - i * 86_400_000)));

  const series = perUav.map((u, i) => ({
    id: u.uav_id,
    name: u.name,
    color: COLORS[i % COLORS.length],
    points: illustrativeSeries(u.name, u.battery_pct_now),
  }));

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
      ctx.fillText(`${Math.round((100 * i) / 4)}%`, padL - 4, y + 3);
    }

    series.forEach((s) => {
      ctx.beginPath();
      s.points.forEach((v, i) => {
        const x = padL + i * gap;
        const y = padT + plotH - (v / 100) * plotH;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = s.color; ctx.lineWidth = 2; ctx.stroke();
    });

    ctx.fillStyle = "#64748b"; ctx.font = "8px sans-serif"; ctx.textAlign = "center";
    dayLabels.forEach((label, i) => { if (i % 5 === 0) ctx.fillText(label, padL + i * gap, padT + plotH + 14); });
  }, [perUav]);

  return (
    <div className="battery-chart-card">
      <div className="card-header-row">
        <span className="card-title">PHÂN TÍCH TIÊU THỤ PIN (30 NGÀY)</span>
        <span className="info-icon" title="Lịch sử minh hoạ (chưa lưu pin theo ngày) — điểm cuối là mức pin hiện tại thật, giả lập từ telemetry">ⓘ</span>
      </div>

      {perUav.length === 0 ? (
        <p className="muted">Chưa có UAV.</p>
      ) : (
        <>
          <canvas ref={canvasRef} className="report-canvas" style={{ height: "130px" }}></canvas>
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
