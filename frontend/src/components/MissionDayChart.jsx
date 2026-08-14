import { useEffect, useRef } from "react";

// ponytail: bucket THẬT theo started_at của missions (không phải chuỗi giả). Có thể thưa vì hệ
// thống demo có ít nhiệm vụ — đó là dữ liệu thật, không bịa thêm cho đẹp biểu đồ.
export default function MissionDayChart({ days = [] }) {
  const canvasRef = useRef(null);

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

    const padL = 30, padR = 40, padT = 12, padB = 28;
    const plotW = cw - padL - padR;
    const plotH = ch - padT - padB;
    const n = days.length;
    const barW = (plotW / n) * 0.6;
    const gap = plotW / n;
    const maxBar = Math.max(...days.map((d) => d.completed + d.other), 4);

    ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + plotH - (plotH * i) / 4;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
      ctx.fillStyle = "#64748b"; ctx.font = "9px sans-serif"; ctx.textAlign = "right";
      ctx.fillText(Math.round((maxBar * i) / 4), padL - 4, y + 3);
    }

    days.forEach((d, i) => {
      const x = padL + i * gap + (gap - barW) / 2;
      const compH = (d.completed / maxBar) * plotH;
      const otherH = (d.other / maxBar) * plotH;
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(x, padT + plotH - compH, barW * 0.55, compH);
      ctx.fillStyle = "#a855f7";
      ctx.fillRect(x + barW * 0.55, padT + plotH - otherH, barW * 0.45, otherH);
    });

    ctx.fillStyle = "#64748b"; ctx.font = "8px sans-serif"; ctx.textAlign = "center";
    days.forEach((d, i) => ctx.fillText(d.label, padL + i * gap + gap / 2, padT + plotH + 16));
  }, [days]);

  return (
    <div className="report-chart-card" style={{ gridColumn: "1 / 3" }}>
      <div className="card-header-row"><span className="card-title">NHIỆM VỤ THEO NGÀY</span></div>
      <div className="chart-legend-row">
        <span><span className="lgd-sq" style={{ background: "#22c55e" }}></span>Hoàn thành</span>
        <span><span className="lgd-sq" style={{ background: "#a855f7" }}></span>Khác (đang chạy/huỷ/tạm dừng)</span>
      </div>
      {days.length === 0 ? <p className="muted">Chưa có nhiệm vụ trong khoảng thời gian này.</p> : <canvas ref={canvasRef} className="report-canvas" style={{ height: "150px" }}></canvas>}
    </div>
  );
}
