import { useEffect, useState } from "react";
import {
  User,
  Car,
  Bike,
  Bus,
  Truck,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Target,
  Search,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Check,
  Crosshair,
  Wifi,
  Battery,
} from "lucide-react";
import {
  API_BASE,
  addTargetNote,
  getRecentTargetEvents,
  getTargetEvents,
  getTargetNotes,
  getTargetSnapshots,
  getUavTelemetry,
  listTargets,
  listUAVs,
  patchTarget,
} from "../api";
import TargetsMap from "../components/TargetsMap";
import DonutChart from "../components/DonutChart";

const CLASS_LABEL = { person: "Con người", car: "Phương tiện", motorcycle: "Phương tiện", bus: "Phương tiện", truck: "Phương tiện" };
const CLASS_ICON = { person: User, car: Car, motorcycle: Bike, bus: Bus, truck: Truck };
const THREAT_LABEL = { high: "Cao", medium: "Trung bình", low: "Thấp" };
const THREAT_CLASS = { high: "red", medium: "yellow", low: "blue" };
const STATUS_LABEL = { new: "Mới phát hiện", tracking: "Đang theo dõi", confirmed: "Đã xác định", processed: "Đã xử lý" };
const STATUS_CLASS = { new: "blue", tracking: "green", confirmed: "yellow", processed: "grey" };
const EVENT_ICON = { detected: Sparkles, status_changed: RefreshCw };

function fmtTime(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
}

export default function Targets({ payload }) {
  const [targets, setTargets] = useState([]);
  const [uavs, setUavs] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [telemetry, setTelemetry] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [threatFilter, setThreatFilter] = useState("");

  async function refresh() {
    const list = await listTargets();
    const safeTargets = Array.isArray(list) ? list : [];
    setTargets(safeTargets);

    const uList = await listUAVs();
    setUavs(Array.isArray(uList) ? uList : []);

    const evList = await getRecentTargetEvents();
    setRecentEvents(Array.isArray(evList) ? evList : []);

    if (selectedId == null && safeTargets.length) setSelectedId(safeTargets[0].id);
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [selectedId]);

  const safeTargets = Array.isArray(targets) ? targets : [];
  const safeUavs = Array.isArray(uavs) ? uavs : [];
  const safeRecentEvents = Array.isArray(recentEvents) ? recentEvents : [];
  const safeEvents = Array.isArray(events) ? events : [];
  const safeNotes = Array.isArray(notes) ? notes : [];
  const safeSnapshots = Array.isArray(snapshots) ? snapshots : [];

  const selected = safeTargets.find((t) => t.id === selectedId);

  useEffect(() => {
    if (selectedId == null) return;
    let cancelled = false;
    async function load() {
      const ev = await getTargetEvents(selectedId);
      if (!cancelled) setEvents(Array.isArray(ev) ? ev : []);

      const nt = await getTargetNotes(selectedId);
      if (!cancelled) setNotes(Array.isArray(nt) ? nt : []);

      const sn = await getTargetSnapshots(selectedId);
      if (!cancelled) setSnapshots(Array.isArray(sn) ? sn : []);
    }
    load();
    return () => { cancelled = true; };
  }, [selectedId]);

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    async function poll() {
      const t = await getUavTelemetry(selected.uav_id);
      if (!cancelled) setTelemetry(t);
    }
    poll();
    const id = setInterval(poll, 2000);
    return () => { cancelled = true; clearInterval(id); };
  }, [selected?.uav_id]);

  async function setStatus(status) {
    await patchTarget(selectedId, { status });
    refresh();
  }

  async function submitNote(e) {
    e.preventDefault();
    if (!noteText.trim()) return;
    await addTargetNote(selectedId, noteText.trim());
    setNoteText("");
    const updatedNotes = await getTargetNotes(selectedId);
    setNotes(Array.isArray(updatedNotes) ? updatedNotes : []);
  }

  const filtered = safeTargets.filter((t) => {
    if (search && !`TGT_${t.id} ${t.class}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && t.status !== statusFilter) return false;
    if (threatFilter && t.threat_level !== threatFilter) return false;
    return true;
  });

  const total = safeTargets.length;
  const tracking = safeTargets.filter((t) => t.status === "tracking" || t.status === "new").length;
  const confirmed = safeTargets.filter((t) => t.status === "confirmed").length;
  const highThreat = safeTargets.filter((t) => t.threat_level === "high").length;
  const processed = safeTargets.filter((t) => t.status === "processed").length;

  const vehicleCount = safeTargets.filter((t) => t.class !== "person").length;
  const personCount = safeTargets.filter((t) => t.class === "person").length;

  const isLive = selected && payload?.active_uav_id === selected.uav_id;
  const uavGps = isLive ? payload?.uav_status?.gps : telemetry;

  return (
    <div className="targets-page">
      <div className="live-sub-header" style={{ marginBottom: "10px" }}>
        <div className="header-left">
          <div className="uav-selector-wrapper">
            <span className="sub-title-label"><Target size={16} /> QUẢN LÝ MỤC TIÊU</span>
            <span className="dot-divider">/</span>
            <span className="breadcrumb-sub">Trang chủ &gt; Mục tiêu</span>
          </div>
        </div>
        <div className="header-right-telemetry">
          <div className="telemetry-pill"><Crosshair size={14} color="#4ade80" /><span>GPS <strong>12</strong></span></div>
          <div className="telemetry-pill green"><Wifi size={14} /><span>Liên kết <strong>Strong</strong></span></div>
          <div className="telemetry-pill green"><Battery size={14} /><span>Pin <strong>78%</strong></span></div>
          <div className="telemetry-pill clock-pill">18:42:10 13/05/2024</div>
          <div className="user-profile-badge">
            <div className="avatar"><User size={16} color="#e6e8ec" /></div>
            <div className="user-info"><span className="username">admin</span><span className="user-role">Quản trị viên</span></div>
          </div>
        </div>
      </div>
      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-icon"><Target size={20} /></div>
          <div className="stat-label">TỔNG MỤC TIÊU</div>
          <div className="stat-value">{total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Search size={20} /></div>
          <div className="stat-label">ĐANG THEO DÕI</div>
          <div className="stat-value">{tracking}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><CheckCircle2 size={20} color="#4ade80" /></div>
          <div className="stat-label">ĐÃ XÁC ĐỊNH</div>
          <div className="stat-value">{confirmed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><AlertTriangle size={20} color="#f87171" /></div>
          <div className="stat-label">MỨC ĐỘ NGUY HIỂM CAO</div>
          <div className="stat-value warn">{highThreat}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FolderOpen size={20} /></div>
          <div className="stat-label">ĐÃ XỬ LÝ</div>
          <div className="stat-value">{processed}</div>
        </div>
      </div>

      <div className="targets-body-3col">
        <section className="panel">
          <h2>Danh sách mục tiêu</h2>
          <div className="filters stacked">
            <input placeholder="Tìm kiếm mục tiêu..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Trạng thái: Tất cả</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={threatFilter} onChange={(e) => setThreatFilter(e.target.value)}>
              <option value="">Mức độ: Tất cả</option>
              {Object.entries(THREAT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="targets-list">
            {filtered.map((t) => {
              const ClassIcon = CLASS_ICON[t.class] ?? HelpCircle;
              return (
              <div key={t.id} className={`target-row ${t.id === selectedId ? "selected" : ""}`} onClick={() => setSelectedId(t.id)}>
                <span className="target-row-icon"><ClassIcon size={16} /></span>
                <div className="target-row-body">
                  <strong>TGT_{t.id} · {CLASS_LABEL[t.class] ?? t.class}</strong>
                  <span className="muted">{t.distance_m != null ? `${t.distance_m} m` : "-"} · {fmtTime(t.last_seen)}</span>
                </div>
                <div className="target-row-badges">
                  <span className={`badge ${THREAT_CLASS[t.threat_level]}`}>{THREAT_LABEL[t.threat_level]}</span>
                  <span className={`badge ${STATUS_CLASS[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                </div>
              </div>
              );
            })}
            {filtered.length === 0 && <p className="muted">Không có mục tiêu nào</p>}
          </div>
        </section>

        <section className="panel">
          <h2>Bản đồ mục tiêu</h2>
          <p className="muted small">Vị trí mục tiêu là ước tính (GPS+hướng UAV giả lập kết hợp khoảng cách thật), không phải toạ độ đo được.</p>
          <TargetsMap targets={safeTargets} uavPosition={uavGps} onSelect={setSelectedId} />
        </section>

        <aside className="side-panel">
          <section>
            <div className="panel-header">
              <h2>Chi tiết mục tiêu</h2>
              {selected && <span className={`badge ${STATUS_CLASS[selected.status]}`}>{STATUS_LABEL[selected.status]}</span>}
            </div>
            {!selected && <p className="muted">Chọn 1 mục tiêu trong danh sách</p>}
            {selected && (
              <>
                <div className="target-hero">
                  {(() => {
                    const HeroIcon = CLASS_ICON[selected.class] ?? HelpCircle;
                    return <HeroIcon size={40} />;
                  })()}
                </div>
                <h3 style={{ textAlign: "center" }}>TGT_{selected.id}</h3>
                <dl className="telemetry-list">
                  <dt>Loại</dt><dd>{CLASS_LABEL[selected.class] ?? selected.class}</dd>
                  <dt>Mức độ</dt><dd className={THREAT_CLASS[selected.threat_level] === "red" ? "ok" : ""}>{THREAT_LABEL[selected.threat_level]}</dd>
                  <dt>Khoảng cách</dt><dd>{selected.distance_m ?? "-"} m</dd>
                  <dt>Vị trí (ước tính)</dt><dd>{selected.lat ? `${selected.lat.toFixed(4)}, ${selected.lon.toFixed(4)}` : "-"}</dd>
                  <dt>Phát hiện lúc</dt><dd>{fmtTime(selected.first_seen)}</dd>
                  <dt>Cập nhật cuối</dt><dd>{fmtTime(selected.last_seen)}</dd>
                  <dt>UAV theo dõi</dt><dd>{safeUavs.find((u) => u.id === selected.uav_id)?.name}</dd>
                </dl>
                <div className="detail-actions">
                  {selected.status !== "confirmed" && <button onClick={() => setStatus("confirmed")}><Check size={14} /> Đã xác định</button>}
                  {selected.status !== "processed" && <button onClick={() => setStatus("processed")}><FolderOpen size={14} /> Đã xử lý</button>}
                  {selected.status !== "tracking" && <button onClick={() => setStatus("tracking")}><Search size={14} /> Theo dõi tiếp</button>}
                </div>
              </>
            )}
          </section>

          {selected && safeSnapshots.length > 0 && (
            <section>
              <h2>Ảnh liên quan</h2>
              <div className="snapshot-grid">
                {safeSnapshots.map((s) => (
                  <a key={s.id} href={`${API_BASE}/api/logs/${s.id}/snapshot`} target="_blank" rel="noreferrer">
                    <img src={`${API_BASE}/api/logs/${s.id}/snapshot`} alt={s.timestamp} />
                  </a>
                ))}
              </div>
            </section>
          )}

          {selected && (
            <section>
              <h2>Ghi chú</h2>
              <form onSubmit={submitNote} className="note-form">
                <input placeholder="Thêm ghi chú..." value={noteText} onChange={(e) => setNoteText(e.target.value)} />
                <button type="submit">Thêm</button>
              </form>
              <div className="notes-list">
                {safeNotes.map((n) => (
                  <div key={n.id} className="note-item">
                    <strong>{n.author}</strong> <span className="muted">{fmtTime(n.created_at)}</span>
                    <p>{n.text}</p>
                  </div>
                ))}
                {safeNotes.length === 0 && <p className="muted">Chưa có ghi chú</p>}
              </div>
            </section>
          )}
        </aside>
      </div>

      <div className="fleet-row">
        <section className="panel">
          <h2>Phân loại mục tiêu</h2>
          <DonutChart segments={[
            { label: "Phương tiện", value: vehicleCount, color: "#fb923c" },
            { label: "Con người", value: personCount, color: "#a78bfa" },
          ]} />
        </section>

        <section className="panel">
          <h2>Mức độ nguy hiểm</h2>
          <DonutChart segments={[
            { label: "Cao", value: highThreat, color: "#f87171" },
            { label: "Trung bình", value: safeTargets.filter((t) => t.threat_level === "medium").length, color: "#facc15" },
            { label: "Thấp", value: safeTargets.filter((t) => t.threat_level === "low").length, color: "#60a5fa" },
          ]} />
        </section>

        <section className="panel wide">
          <h2>Hoạt động gần đây</h2>
          <div className="activity-list">
            {safeRecentEvents.map((e) => {
              const EvIcon = EVENT_ICON[e.type];
              return (
                <div key={e.id} className="activity-item" onClick={() => setSelectedId(e.target_id)}>
                  <span className="timeline-icon">{EvIcon ? <EvIcon size={14} /> : "•"}</span>
                  <span className="timeline-time">{fmtTime(e.timestamp)}</span>
                  <span>TGT_{e.target_id} ({CLASS_LABEL[e.class] ?? e.class}) — {e.label}</span>
                </div>
              );
            })}
            {safeRecentEvents.length === 0 && <p className="muted">Chưa có hoạt động nào</p>}
          </div>
        </section>
      </div>

      {selected && safeEvents.length > 0 && (
        <section className="panel wide">
          <h2>Lịch sử mục tiêu TGT_{selected.id}</h2>
          <div className="timeline">
            {safeEvents.slice().reverse().map((e) => {
              const EvIcon = EVENT_ICON[e.type];
              return (
                <div key={e.id} className="timeline-item">
                  <span className="timeline-icon">{EvIcon ? <EvIcon size={14} /> : "•"}</span>
                  <span className="timeline-time">{fmtTime(e.timestamp)}</span>
                  <span className="timeline-label">{e.label}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
