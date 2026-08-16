function fmtHours(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

// perUav: [{ uav_id, name, flight_seconds_planned }] — tổng thời lượng kế hoạch nhiệm vụ đã hoàn thành,
// KHÔNG phải giờ bay đo thật (chưa có telemetry/MAVLink), xem ghi chú backend/main.py stats_analytics
export default function FlightHoursChart({ perUav = [] }) {
  const colors = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#06b6d4", "#ef4444"];
  const maxVal = Math.max(1, ...perUav.map((u) => u.flight_seconds_planned));

  return (
    <div className="flight-hours-chart-container-v2">
      <div className="y-unit-lbl">Giờ bay kế hoạch (nhiệm vụ đã hoàn thành)</div>

      {perUav.length === 0 ? (
        <div className="chart-empty-state">Chưa có nhiệm vụ hoàn thành nào</div>
      ) : (
        <div className="perf-bar-list">
          {perUav.map((u, i) => (
            <div key={u.uav_id} className="type-progress-item">
              <div className="type-meta-row">
                <span className="lgd-dot" style={{ background: colors[i % colors.length] }} />
                <span className="name">{u.name}</span>
                <span className="val font-mono">{fmtHours(u.flight_seconds_planned)}</span>
              </div>
              <div className="type-bar-track">
                <div
                  className="type-bar-fill"
                  style={{ width: `${(u.flight_seconds_planned / maxVal) * 100}%`, background: colors[i % colors.length] }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
