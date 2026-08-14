import { useEffect, useRef } from "react";

// ponytail: không có log quãng đường bay thật (chỉ vị trí tức thời giả lập, không tích luỹ theo
// thời gian) — giữ đúng dạng biểu đồ gốc (area/line, quãng đường theo ngày). Số liệu là minh hoạ,
// seed theo NHÃN NGÀY THẬT (dayLabels truyền từ ReportsView) nên ổn định qua các lần render,
// không phải Math.random() mỗi lần vẽ.
function seed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0) / 4294967295;
}

function illustrativeKm(label, idx) {
  const s = seed(label);
  const wave = 0.5 + 0.5 * Math.sin(idx / 2.2 + s * 10);
  return Math.round(30 + wave * 130 + s * 25);
}

export default function DistanceChart({ dayLabels = [] }) {
  const canvasRef = useRef(null);
  const days = dayLabels.map((label, i) => ({ label, count: illustrativeKm(label, i) }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || days.length === 0) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const cw = canvas.offsetWidth;
    const ch = canvas.offsetHeight;
    ctx.clearRect(0, 0, cw, ch);

    const padL = 30, padR = 12, padT = 12, padB = 28;
    const plotW = cw - padL - padR;
    const plotH = ch - padT - padB;
    const n = days.length;
    const gap = n > 1 ? plotW / (n - 1) : 0;
    const maxVal = Math.max(...days.map((d) => d.count), 4);

    ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + plotH - (plotH * i) / 4;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
      ctx.fillStyle = "#64748b"; ctx.font = "9px sans-serif"; ctx.textAlign = "right";
      ctx.fillText(Math.round((maxVal * i) / 4), padL - 4, y + 3);
    }

    const pts = days.map((d, i) => ({ x: padL + i * gap, y: padT + plotH - (d.count / maxVal) * plotH }));
    if (pts.length > 1) {
      ctx.beginPath();
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.lineTo(pts[pts.length - 1].x, padT + plotH);
      ctx.lineTo(pts[0].x, padT + plotH);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, padT, 0, padT + plotH);
      grad.addColorStop(0, "rgba(34,197,94,0.4)");
      grad.addColorStop(1, "rgba(34,197,94,0.02)");
      ctx.fillStyle = grad; ctx.fill();

      ctx.beginPath(); ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 2.5;
      pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
    }
    pts.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2); ctx.fillStyle = "#22c55e"; ctx.fill(); });

    ctx.fillStyle = "#64748b"; ctx.font = "9px sans-serif"; ctx.textAlign = "center";
    days.forEach((d, i) => { if (n <= 15 || i % 2 === 0) ctx.fillText(d.label, padL + i * gap, padT + plotH + 16); });
  }, [dayLabels]);

  return (
    <div className="report-chart-card">
      <div className="card-header-row">
        <span className="card-title">THỐNG KÊ QUÃNG ĐƯỜNG BAY (KM)</span>
        <span className="info-icon" title="Chưa có log quãng đường thật (chỉ vị trí tức thời giả lập) — số liệu minh hoạ theo ngày">ⓘ</span>
      </div>
      {days.length === 0 ? <p className="muted">Chưa có dữ liệu trong khoảng thời gian này.</p> : <canvas ref={canvasRef} className="report-canvas" style={{ height: "130px" }}></canvas>}
    </div>
  );
}
