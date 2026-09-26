import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Plane, ClipboardList, Crosshair, AlertTriangle, BatteryWarning, Cpu, ChevronRight, Wifi, WifiOff } from "lucide-react";
import { getOverviewStats } from "../api";

const BASE = [21.0285, 105.8542];
const UAV_STATUS = {
  flying: ["Đang bay", "#22c55e"],
  ready: ["Sẵn sàng", "#38bdf8"],
  offline: ["Offline", "#64748b"],
  maintenance: ["Bảo trì", "#a855f7"],
};
const MISSION_STATUS = { active: "Đang thực hiện", paused: "Tạm dừng" };
const PRIORITY = { high: ["Cao", "#f87171"], medium: ["Trung bình", "#fbbf24"], low: ["Thấp", "#94a3b8"] };
const CLASS_LABEL = { person: "Người", car: "Ô tô", motorcycle: "Xe máy", bus: "Xe buýt", truck: "Xe tải" };
// Màu trạng thái dành riêng cho mức nguy hiểm — luôn kèm chữ, không dùng màu đơn thuần
const SEVERITY = { red: ["Nguy hiểm", "#ef4444"], yellow: ["Cảnh báo", "#f59e0b"], green: ["Bình thường", "#22c55e"] };
const THREAT = { high: ["Cao", "#ef4444"], medium: ["Trung bình", "#f59e0b"], low: ["Thấp", "#22c55e"] };
const LOW_BATTERY = 30;

const fmtClock = (iso) => new Date(iso).toLocaleTimeString("vi-VN", { hour12: false });
const sum = (obj) => Object.values(obj || {}).reduce((a, b) => a + b, 0);

function KpiCard({ icon: Icon, tone, title, value, total, sub, onClick }) {
  return (
    <button className={`ov-kpi ${tone || ""}`} onClick={onClick}>
      <span className="ov-kpi-icon">
        <Icon size={22} />
      </span>
      <span className="ov-kpi-body">
        <span className="ov-kpi-title">{title}</span>
        <span className="ov-kpi-value">
          {value}
          {total != null && <small> / {total}</small>}
        </span>
        <span className="ov-kpi-sub">{sub}</span>
      </span>
      <ChevronRight size={16} className="ov-kpi-go" />
    </button>
  );
}

function Panel({ title, action, onAction, children, className = "" }) {
  return (
    <section className={`dashboard-panel ov-panel ${className}`}>
      <div className="panel-section-header">
        <h3 className="section-title">{title}</h3>
        {action && (
          <button className="btn-view-all" onClick={onAction}>
            {action} ›
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

// Bản đồ vị trí cả đội UAV (toạ độ lấy sẵn từ API tổng quan, không gọi thêm)
function FleetOverviewMap({ fleet }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    const map = L.map(ref.current, { zoomControl: false, attributionControl: false }).setView(BASE, 14);
    L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
      maxNativeZoom: 16,
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.circleMarker(BASE, { radius: 6, color: "#ef4444", fillColor: "#ef4444", fillOpacity: 1 }).bindTooltip("Căn cứ").addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => map.remove();
  }, []);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();
    fleet
      .filter((u) => typeof u.lat === "number")
      .forEach((u) => {
        const [label, color] = UAV_STATUS[u.status] || ["-", "#64748b"];
        L.marker([u.lat, u.lon], {
          icon: L.divIcon({
            className: "",
            html: `<div class="ov-uav-pin" style="--c:${color}"><span></span>${u.name}</div>`,
            iconSize: null,
            iconAnchor: [8, 8],
          }),
        })
          .bindTooltip(`${u.name} · ${label}${u.battery_pct != null ? ` · Pin ${Math.round(u.battery_pct)}%` : ""}`)
          .addTo(layer);
      });
  }, [fleet]);

  return <div ref={ref} className="ov-map" />;
}

// Cảnh báo theo giờ, 24 giờ gần nhất (1 chuỗi -> 1 màu, không cần chú thích; rê chuột xem số)
function AlertsByHour({ byHour }) {
  const now = Date.now();
  const bars = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(now - (23 - i) * 3600_000);
    return { key: d.toISOString().slice(0, 13), hour: d.getHours(), count: byHour?.[d.toISOString().slice(0, 13)] || 0 };
  });
  const max = Math.max(1, ...bars.map((b) => b.count));
  return (
    <div className="ov-hour-chart" role="img" aria-label="Số cảnh báo theo giờ trong 24 giờ qua">
      <div className="ov-hour-bars">
        {bars.map((b) => (
          <div key={b.key} className="ov-hour-col" title={`${b.hour}:00–${b.hour + 1}:00 · ${b.count} cảnh báo`}>
            <div className="ov-hour-bar" style={{ height: `${(b.count / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="ov-hour-axis">
        {bars.map((b, i) => (
          <span key={b.key}>{i % 6 === 0 || i === 23 ? `${b.hour}h` : ""}</span>
        ))}
      </div>
      <span className="ov-chart-max">tối đa {max}/giờ</span>
    </div>
  );
}

function HBar({ label, value, max, color = "var(--ov-series)" }) {
  return (
    <div className="ov-hbar" title={`${label}: ${value}`}>
      <span className="ov-hbar-label">{label}</span>
      <span className="ov-hbar-track">
        <span className="ov-hbar-fill" style={{ width: `${max ? (value / max) * 100 : 0}%`, background: color }} />
      </span>
      <span className="ov-hbar-val">{value}</span>
    </div>
  );
}

export default function Overview({ onNavigateTab }) {
  const [s, setS] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => getOverviewStats().then((d) => !cancelled && d?.fleet && setS(d));
    load();
    const id = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!s) return <div className="ov-page ov-loading">Đang tải số liệu tổng quan…</div>;

  const go = (tab) => () => onNavigateTab?.(tab);
  const fleet = s.fleet;
  const byStatus = fleet.reduce((a, u) => ({ ...a, [u.status]: (a[u.status] || 0) + 1 }), {});
  const lowBattery = fleet.filter((u) => u.status === "flying" && u.battery_pct != null && u.battery_pct < LOW_BATTERY);
  const uavName = (id) => fleet.find((u) => u.id === id)?.name || `UAV #${id}`;
  const ms = s.missions.by_status;
  const sev = s.alerts.by_severity;
  const classes = Object.entries(s.alerts.by_class).sort((a, b) => b[1] - a[1]);
  const classMax = Math.max(0, ...classes.map(([, n]) => n));
  const threatTotal = sum(s.targets.by_threat);

  return (
    <div className="ov-page">
      <div className="ov-status-line">
        <span className={`ov-chip ${s.ai_enabled ? "on" : ""}`}>
          <Cpu size={13} /> Nhận diện AI: {s.ai_enabled ? "Đang bật" : "Đang tắt"}
        </span>
        <span className="ov-updated">Cập nhật {fmtClock(s.generated_at)} · tự làm mới mỗi 5 giây</span>
      </div>

      <div className="ov-kpis">
        <KpiCard
          icon={Plane}
          title="UAV ĐANG BAY"
          value={byStatus.flying || 0}
          total={fleet.length}
          sub={`${byStatus.ready || 0} sẵn sàng · ${byStatus.maintenance || 0} bảo trì · ${byStatus.offline || 0} offline`}
          onClick={go("uavs")}
        />
        <KpiCard
          icon={ClipboardList}
          title="NHIỆM VỤ ĐANG CHẠY"
          value={ms.active || 0}
          total={sum(ms)}
          sub={`${ms.paused || 0} tạm dừng · ${ms.completed || 0} hoàn thành`}
          onClick={go("missions")}
        />
        <KpiCard
          icon={Crosshair}
          title="MỤC TIÊU ĐANG THEO DÕI"
          value={s.targets.live}
          sub={`${threatTotal} trong 24h · ${s.targets.by_threat.high || 0} nguy hiểm cao`}
          tone={s.targets.by_threat.high ? "warn" : ""}
          onClick={go("tracking")}
        />
        <KpiCard
          icon={AlertTriangle}
          title="CẢNH BÁO 24H"
          value={s.alerts.total}
          sub={`${sev.red || 0} nguy hiểm · ${sev.yellow || 0} cảnh báo`}
          tone={sev.red ? "danger" : s.alerts.total ? "warn" : ""}
          onClick={go("logs")}
        />
        <KpiCard
          icon={BatteryWarning}
          title={`PIN DƯỚI ${LOW_BATTERY}%`}
          value={lowBattery.length}
          sub={lowBattery.length ? lowBattery.map((u) => u.name).join(", ") : "Mọi UAV đang bay đủ pin"}
          tone={lowBattery.length ? "danger" : ""}
          onClick={go("uavs")}
        />
      </div>

      <div className="ov-row ov-row-main">
        <Panel title="VỊ TRÍ ĐỘI UAV" action="Bản đồ" onAction={go("map")} className="ov-map-panel">
          <FleetOverviewMap fleet={fleet} />
          <div className="ov-legend">
            {Object.entries(UAV_STATUS).map(([k, [label, color]]) => (
              <span key={k}>
                <i style={{ background: color }} /> {label} ({byStatus[k] || 0})
              </span>
            ))}
            <span>
              <i style={{ background: "#ef4444" }} /> Căn cứ
            </span>
          </div>
        </Panel>

        <Panel title="TRẠNG THÁI ĐỘI UAV" action="Quản lý UAV" onAction={go("uavs")}>
          <div className="ov-fleet">
            {fleet.map((u) => {
              const [label, color] = UAV_STATUS[u.status] || ["-", "#64748b"];
              const bat = u.battery_pct != null ? Math.round(u.battery_pct) : null;
              const batColor = bat == null ? "#334155" : bat < LOW_BATTERY ? "#ef4444" : bat < 50 ? "#f59e0b" : "#22c55e";
              return (
                <div key={u.id} className="ov-fleet-row">
                  <div className="ov-fleet-name">
                    <strong>{u.name}</strong>
                    <span>{u.mission ? u.mission.name : u.zone || u.type || "—"}</span>
                  </div>
                  <span className="ov-pill" style={{ color, borderColor: color }}>
                    {label}
                  </span>
                  <div className="ov-battery" title={bat != null ? `Pin ${bat}%` : "Không có dữ liệu pin"}>
                    <span className="ov-battery-track">
                      <span style={{ width: `${bat ?? 0}%`, background: batColor }} />
                    </span>
                    <span className="ov-battery-val">{bat != null ? `${bat}%` : "—"}</span>
                  </div>
                  <span className="ov-signal" title={`Tín hiệu: ${u.signal || "—"}`}>
                    {u.status === "offline" ? <WifiOff size={14} /> : <Wifi size={14} className={u.signal === "Weak" ? "weak" : ""} />}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="ov-row ov-row-3">
        <Panel title="NHIỆM VỤ ĐANG THỰC HIỆN" action="Tất cả" onAction={go("missions")}>
          {s.missions.active.length === 0 ? (
            <p className="ov-empty">Không có nhiệm vụ nào đang chạy</p>
          ) : (
            <div className="ov-missions">
              {s.missions.active.map((m) => {
                const [pLabel, pColor] = PRIORITY[m.priority] || ["-", "#94a3b8"];
                return (
                  <div key={m.id} className="ov-mission">
                    <div className="ov-mission-head">
                      <strong>{m.name}</strong>
                      <span style={{ color: pColor }}>{pLabel}</span>
                    </div>
                    <div className="ov-mission-meta">
                      {uavName(m.uav_id)} · {MISSION_STATUS[m.status] || m.status}
                    </div>
                    <div className="ov-progress">
                      <span className="ov-progress-track">
                        <span style={{ width: `${m.progress_pct ?? 0}%` }} />
                      </span>
                      <span>{Math.round(m.progress_pct ?? 0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="CẢNH BÁO GẦN NHẤT" action="Tất cả" onAction={go("logs")}>
          {s.alerts.recent.length === 0 ? (
            <p className="ov-empty">Không có cảnh báo trong 24 giờ qua</p>
          ) : (
            <div className="ov-alerts">
              {s.alerts.recent.map((a) => {
                const [label, color] = SEVERITY[a.severity] || ["-", "#64748b"];
                return (
                  <div key={a.id} className="ov-alert">
                    <span className="ov-alert-time">{fmtClock(a.timestamp)}</span>
                    <span className="ov-alert-text">
                      {CLASS_LABEL[a.class] || a.class} cách {a.distance_m ?? "?"}m · {uavName(a.uav_id)}
                    </span>
                    <span className="ov-pill" style={{ color, borderColor: color }}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>

        <Panel title="THỐNG KÊ 24 GIỜ" action="Phân tích" onAction={go("analytics")}>
          <div className="ov-stats">
            <div className="ov-stat-block">
              <span className="ov-stat-title">Cảnh báo theo giờ</span>
              <AlertsByHour byHour={s.alerts.by_hour} />
            </div>
            <div className="ov-stat-block">
              <span className="ov-stat-title">Cảnh báo theo loại mục tiêu</span>
              {classes.length === 0 ? (
                <p className="ov-empty">Chưa có</p>
              ) : (
                classes.map(([cls, n]) => <HBar key={cls} label={CLASS_LABEL[cls] || cls} value={n} max={classMax} />)
              )}
            </div>
            <div className="ov-stat-block">
              <span className="ov-stat-title">Mục tiêu theo mức nguy hiểm</span>
              <div className="ov-stack" role="img" aria-label="Tỉ lệ mục tiêu theo mức nguy hiểm">
                {Object.entries(THREAT).map(([k, [label, color]]) => {
                  const n = s.targets.by_threat[k] || 0;
                  return n ? <span key={k} style={{ flexGrow: n, background: color }} title={`${label}: ${n}`} /> : null;
                })}
              </div>
              <div className="ov-legend compact">
                {Object.entries(THREAT).map(([k, [label, color]]) => (
                  <span key={k}>
                    <i style={{ background: color }} /> {label} {s.targets.by_threat[k] || 0}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
