// perUav: [{ uav_id, name, success_rate, alerts_count }] — hai chỉ số thật duy nhất có sẵn per-UAV
// (các trục khác của radar cũ — tiêu thụ pin/quãng đường/độ chính xác/an toàn bay — không có dữ liệu backend)
export default function UavRadarChart({ perUav = [] }) {
  const colors = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#06b6d4", "#ef4444"];
  const maxAlerts = Math.max(1, ...perUav.map((u) => u.alerts_count));

  return (
    <div className="uav-radar-chart-container-v2">
      {perUav.length === 0 ? (
        <div className="chart-empty-state">Chưa có dữ liệu UAV</div>
      ) : (
        <div className="perf-bar-list">
          {perUav.map((u, i) => (
            <div key={u.uav_id} className="type-progress-item">
              <div className="type-meta-row">
                <span className="lgd-dot" style={{ background: colors[i % colors.length] }} />
                <span className="name">{u.name}</span>
                <span className="val font-mono">{u.success_rate}% HT · {u.alerts_count} cảnh báo</span>
              </div>
              <div className="type-bar-track">
                <div className="type-bar-fill green" style={{ width: `${u.success_rate}%` }} />
              </div>
              <div className="type-bar-track">
                <div className="type-bar-fill" style={{ width: `${(u.alerts_count / maxAlerts) * 100}%`, background: "#ef4444" }} />
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="radar-legend-bar-v2">
        <div className="legend-chip-v2"><span className="dot" style={{ background: "#22c55e" }} /><span className="series-name">Tỷ lệ hoàn thành</span></div>
        <div className="legend-chip-v2"><span className="dot" style={{ background: "#ef4444" }} /><span className="series-name">Số cảnh báo</span></div>
      </div>
    </div>
  );
}
