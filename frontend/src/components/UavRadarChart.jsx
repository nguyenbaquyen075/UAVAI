const COLORS = ["#4ade80", "#3b82f6", "#a855f7"];

// ponytail: 3 trục đều tính được thật từ dữ liệu hiện có (missions/alert_events) — không thêm trục
// "độ chính xác"/"an toàn bay" vì không có nguồn dữ liệu thật cho chúng.
// "Ít cảnh báo" = điểm càng cao nếu UAV càng ít cảnh báo so với UAV nhiều cảnh báo nhất trong danh sách.
export default function UavRadarChart({ perUav = [] }) {
  const axes = ["Tỷ lệ thành công", "Số nhiệm vụ", "Ít cảnh báo"];
  const top3 = [...perUav].sort((a, b) => b.missions_total - a.missions_total).slice(0, 3);
  const maxMissions = Math.max(...perUav.map((u) => u.missions_total), 1);
  const maxAlerts = Math.max(...perUav.map((u) => u.alerts_count), 1);

  const series = top3.map((u, i) => ({
    id: u.name,
    color: COLORS[i],
    ratios: [
      u.success_rate / 100,
      u.missions_total / maxMissions,
      1 - u.alerts_count / maxAlerts,
    ],
  }));

  const size = 260;
  const center = size / 2;
  const radius = 90;
  const angles = axes.map((_, i) => (i * 2 * Math.PI) / axes.length - Math.PI / 2);

  const getPolygonPoints = (ratios) =>
    ratios
      .map((r, i) => {
        const angle = angles[i];
        const x = center + radius * r * Math.cos(angle);
        const y = center + radius * r * Math.sin(angle);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  return (
    <div className="radar-chart-card">
      <div className="card-header-row">
        <span className="card-title">SO SÁNH UAV (TOP 3 THEO SỐ NHIỆM VỤ)</span>
      </div>

      {series.length === 0 ? (
        <p className="muted">Chưa có dữ liệu nhiệm vụ để so sánh.</p>
      ) : (
        <>
          <div className="radar-svg-wrapper">
            <svg viewBox={`0 0 ${size} ${size}`} className="radar-svg">
              {[0.2, 0.4, 0.6, 0.8, 1.0].map((level) => (
                <polygon key={level} points={getPolygonPoints(Array(axes.length).fill(level))} fill="none" stroke="#1e293b" strokeWidth="1" />
              ))}
              {angles.map((angle, i) => {
                const x2 = center + radius * Math.cos(angle);
                const y2 = center + radius * Math.sin(angle);
                return <line key={i} x1={center} y1={center} x2={x2} y2={y2} stroke="#1e293b" strokeWidth="1" />;
              })}
              {series.map((s) => (
                <polygon key={s.id} points={getPolygonPoints(s.ratios)} fill={`${s.color}26`} stroke={s.color} strokeWidth="1.5" />
              ))}
              {axes.map((label, i) => {
                const angle = angles[i];
                const labelRadius = radius + 22;
                const lx = center + labelRadius * Math.cos(angle);
                const ly = center + labelRadius * Math.sin(angle);
                return (
                  <text key={label} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize="8" fontWeight="600">
                    {label}
                  </text>
                );
              })}
            </svg>
          </div>

          <div className="radar-legend">
            {series.map((s) => (
              <div key={s.id} className="legend-chip">
                <span className="chip-dot" style={{ background: s.color }}></span>
                <span>{s.id}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
