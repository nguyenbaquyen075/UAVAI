import { useEffect, useRef } from "react";

// Missions per day bar chart + success rate line
export default function MissionDayChart() {
  const canvasRef = useRef(null);

  const days = ["01/05","02/05","03/05","04/05","05/05","06/05","07/05","08/05","09/05","10/05","11/05","12/05","13/05"];
  const completed = [6,4,8,5,7,6,9,7,5,8,7,6,8];
  const inProgress = [1,1,2,1,1,1,2,1,1,1,1,1,0];
  const successRate = [85,80,90,82,88,85,92,88,84,90,88,86,94];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    const h = canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    const cw = canvas.offsetWidth;
    const ch = canvas.offsetHeight;

    ctx.clearRect(0, 0, cw, ch);

    const padL = 38, padR = 50, padT = 12, padB = 28;
    const plotW = cw - padL - padR;
    const plotH = ch - padT - padB;
    const n = days.length;
    const barW = (plotW / n) * 0.6;
    const gap = plotW / n;

    const maxBar = 12;

    // Grid lines left axis
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padT + plotH - (plotH * i / 4);
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
      ctx.fillStyle = "#64748b"; ctx.font = "9px sans-serif"; ctx.textAlign = "right";
      ctx.fillText(Math.round(maxBar * i / 4), padL - 4, y + 3);
    }

    // Right axis labels (success rate %)
    ctx.textAlign = "left";
    for (let i = 0; i <= 4; i++) {
      const y = padT + plotH - (plotH * i / 4);
      ctx.fillStyle = "#64748b"; ctx.font = "9px sans-serif";
      ctx.fillText(`${25 * i + (i === 0 ? 0 : 0)}%`, padL + plotW + 4, y + 3);
    }

    // Bars
    days.forEach((_, i) => {
      const x = padL + i * gap + (gap - barW) / 2;
      const compH = (completed[i] / maxBar) * plotH;
      const progH = (inProgress[i] / maxBar) * plotH;

      ctx.fillStyle = "#22c55e";
      ctx.fillRect(x, padT + plotH - compH, barW * 0.55, compH);
      ctx.fillStyle = "#a855f7";
      ctx.fillRect(x + barW * 0.55, padT + plotH - progH, barW * 0.45, progH);
    });

    // Success rate line (right axis 0-100%)
    const rateToY = (v) => padT + plotH - ((v - 75) / 25) * plotH;
    ctx.beginPath(); ctx.strokeStyle = "#60a5fa"; ctx.lineWidth = 2;
    days.forEach((_, i) => {
      const x = padL + i * gap + gap / 2;
      const y = rateToY(successRate[i]);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Dots on line
    days.forEach((_, i) => {
      const x = padL + i * gap + gap / 2;
      const y = rateToY(successRate[i]);
      ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#60a5fa"; ctx.fill();
    });

    // X axis labels
    ctx.fillStyle = "#64748b"; ctx.font = "8px sans-serif"; ctx.textAlign = "center";
    days.forEach((d, i) => {
      ctx.fillText(d, padL + i * gap + gap / 2, padT + plotH + 16);
    });
  }, []);

  return (
    <div className="report-chart-card" style={{ gridColumn: "1 / 3" }}>
      <div className="card-header-row">
        <span className="card-title">THỐNG KÊ NHIỆM VỤ THEO NGÀY</span>
        <select className="mini-select" defaultValue="13">
          <option value="7">7 ngày</option>
          <option value="13">13 ngày</option>
          <option value="30">30 ngày</option>
        </select>
      </div>
      <div className="chart-legend-row">
        <span><span className="lgd-sq" style={{background:"#22c55e"}}></span>Hoàn thành</span>
        <span><span className="lgd-sq" style={{background:"#a855f7"}}></span>Đang thực hiện</span>
        <span><span className="lgd-line" style={{background:"#60a5fa"}}></span>Tỷ lệ hoàn thành (%)</span>
      </div>
      <canvas ref={canvasRef} className="report-canvas" style={{height:"150px"}}></canvas>
    </div>
  );
}
