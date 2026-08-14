import { API_BASE } from "../api";

const SEVERITY_LABEL = { red: "NGUY HIỂM", yellow: "CẢNH BÁO", green: "Bình thường" };

export default function LiveMonitoring({ payload }) {
  const objects = payload?.objects ?? [];
  const alerts = objects.filter((o) => o.alert);
  const personCount = objects.filter((o) => o.class === "person").length;
  const vehicleCount = objects.length - personCount;

  return (
    <div className="layout">
      <div className="video-panel">
        <img className="video" src={`${API_BASE}/video`} alt="UAV live feed" />
        <div className="counters">
          <span>Người: {personCount}</span>
          <span>Phương tiện: {vehicleCount}</span>
        </div>
      </div>

      <aside className="side-panel">
        <section>
          <h2>Cảnh báo</h2>
          {alerts.length === 0 && <p className="muted">Không có cảnh báo</p>}
          {alerts.map((o) => (
            <div key={o.track_id} className={`alert-card ${o.severity}`}>
              <strong>{SEVERITY_LABEL[o.severity]}</strong>
              <span>
                #{o.track_id} · {o.class} · {o.distance_m} m
              </span>
            </div>
          ))}
        </section>
      </aside>
    </div>
  );
}
