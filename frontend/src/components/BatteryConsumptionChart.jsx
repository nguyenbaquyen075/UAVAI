// perUav: [{ uav_id, name, battery_pct_now }] — pin hiện tại (telemetry giả lập, xem backend/telemetry.py).
// Không có bảng lưu lịch sử pin theo ngày nên không vẽ đường xả pin theo thời gian như trước.
export default function BatteryConsumptionChart({ perUav = [] }) {
  const colorFor = (pct) => (pct > 50 ? "#22c55e" : pct > 20 ? "#f59e0b" : "#ef4444");

  return (
    <div className="battery-chart-container-v2">
      <div className="y-unit-lbl">Pin hiện tại (%)</div>

      {perUav.length === 0 ? (
        <div className="chart-empty-state">Chưa có dữ liệu UAV</div>
      ) : (
        <div className="perf-bar-list">
          {perUav.map((u) => (
            <div key={u.uav_id} className="type-progress-item">
              <div className="type-meta-row">
                <span className="name">{u.name}</span>
                <span className="val font-mono">{u.battery_pct_now}%</span>
              </div>
              <div className="type-bar-track">
                <div className="type-bar-fill" style={{ width: `${u.battery_pct_now}%`, background: colorFor(u.battery_pct_now) }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
