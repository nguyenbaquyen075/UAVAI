import { useState, useEffect } from "react";
import {
  Settings,
  Crosshair,
  Wifi,
  Battery,
  User,
  CheckCircle2,
  Plane,
  Bell,
  Database,
  Plug,
  ScrollText,
  Users,
  Info,
  Palette,
  Map,
  Ruler,
  Clock,
  Globe,
  Shield,
  Archive,
  Upload,
  Pencil,
} from "lucide-react";
import { getLogs, getSettings, listUAVs, updateSettings, updateUAV } from "../api";

const LEFT_SECTIONS = [
  { key: "info", label: "Thông tin hệ thống", Icon: Info },
  { key: "interface", label: "Giao diện", Icon: Palette },
  { key: "map", label: "Bản đồ", Icon: Map },
  { key: "units", label: "Đơn vị đo lường", Icon: Ruler },
  { key: "time", label: "Thời gian", Icon: Clock },
  { key: "language", label: "Ngôn ngữ", Icon: Globe },
  { key: "security", label: "Bảo mật", Icon: Shield },
  { key: "backup", label: "Sao lưu & Khôi phục", Icon: Archive },
];

const TOP_TABS = [
  "Cài đặt chung",
  "UAV & Thiết bị",
  "Người dùng & Phân quyền",
  "Thông báo",
  "Dữ liệu & Lưu trữ",
  "Tích hợp",
  "Nhật ký hệ thống",
];

const CLASS_LABEL = { person: "Người", car: "Ô tô", motorcycle: "Xe máy", bus: "Xe buýt", truck: "Xe tải" };
const ALL_CLASSES = Object.keys(CLASS_LABEL);
const SEVERITY_LABEL = { red: "Nguy hiểm", yellow: "Cảnh báo" };

export default function SettingsPage() {
  const [topTab, setTopTab] = useState("Cài đặt chung");
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const t = now.toTimeString().slice(0, 8);
      const d = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
      setCurrentTime(`${t} ${d}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="settings-page-layout">

      <div className="settings-top-tabs">
        {TOP_TABS.map((t) => (
          <button key={t} className={`stab ${topTab === t ? "active" : ""}`} onClick={() => setTopTab(t)}>{t}</button>
        ))}
      </div>

      {topTab === "Cài đặt chung" && <GeneralSettingsTab />}
      {topTab === "UAV & Thiết bị" && <UavDeviceTab />}
      {topTab === "Người dùng & Phân quyền" && <UsersTab />}
      {topTab === "Nhật ký hệ thống" && <SystemLogTab />}
      {["Thông báo", "Dữ liệu & Lưu trữ", "Tích hợp"].includes(topTab) && <NotBuiltTab name={topTab} />}
    </div>
  );
}

// --- Cài đặt chung: menu con bên trái + form theo mục đang chọn ---
function GeneralSettingsTab() {
  const [settings, setSettings] = useState(null);
  const [saved, setSaved] = useState(false);
  const [counts, setCounts] = useState({ uavs: 0, alerts: 0 });
  const [section, setSection] = useState("info");
  const [quickToggles, setQuickToggles] = useState({
    darkMode: true,
    autoSaveNotes: true,
    mapGrid: true,
    alertSound: true,
    confirmDelete: true,
  });

  useEffect(() => {
    getSettings().then(setSettings);
    Promise.all([listUAVs(), getLogs()]).then(([uavs, logs]) => {
      setCounts({ uavs: Array.isArray(uavs) ? uavs.length : 0, alerts: Array.isArray(logs) ? logs.length : 0 });
    });
  }, []);

  if (!settings) return <div className="settings-body"><p className="muted">Đang tải cài đặt...</p></div>;

  function patch(field, value) {
    setSettings((s) => ({ ...s, [field]: value }));
  }
  function toggleClass(cls) {
    const enabled = settings.enabled_classes.includes(cls);
    patch("enabled_classes", enabled ? settings.enabled_classes.filter((c) => c !== cls) : [...settings.enabled_classes, cls]);
  }
  function toggleQuick(key) {
    setQuickToggles((q) => ({ ...q, [key]: !q[key] }));
  }
  async function handleSave() {
    const result = await updateSettings({
      alert_threshold_m: Number(settings.alert_threshold_m),
      warning_threshold_m: Number(settings.warning_threshold_m),
      max_acceptable_delay: Number(settings.max_acceptable_delay),
      enabled_classes: settings.enabled_classes,
      system_name: settings.system_name,
      system_description: settings.system_description,
      timezone: settings.timezone,
      date_format: settings.date_format,
      time_format: settings.time_format,
      distance_unit: settings.distance_unit,
      speed_unit: settings.speed_unit,
    });
    setSettings(result);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="settings-body">
      <nav className="settings-left-menu">
        {LEFT_SECTIONS.map((s) => (
          <button key={s.key} className={`sleft-item ${section === s.key ? "active" : ""}`} onClick={() => setSection(s.key)}>
            <span className="sleft-icon"><s.Icon size={14} /></span>
            {s.label}
          </button>
        ))}
      </nav>

      <div className="settings-center-content">
        {section === "info" && (
          <section className="settings-section">
            <h2 className="s-section-title">THÔNG TIN HỆ THỐNG</h2>
            <p className="s-section-desc">Cấu hình các thông tin cơ bản của hệ thống — lưu thật vào backend/settings.json.</p>
            <div className="settings-form">
              <div className="sf-row">
                <label className="sf-label">Tên hệ thống</label>
                <input className="sf-input" value={settings.system_name} onChange={(e) => patch("system_name", e.target.value)} />
              </div>
              <div className="sf-row">
                <label className="sf-label">Mô tả</label>
                <textarea className="sf-textarea" value={settings.system_description} onChange={(e) => patch("system_description", e.target.value)} />
              </div>
              <div className="sf-row">
                <label className="sf-label">Logo hệ thống</label>
                <div className="logo-upload-area">
                  <div className="logo-preview"><Plane size={24} color="#4ade80" /></div>
                  <div className="logo-actions">
                    <button type="button" className="btn-upload-logo" disabled title="Chưa hỗ trợ tải logo tuỳ chỉnh"><Upload size={12} /> Thay đổi logo</button>
                    <span className="logo-hint">Định dạng: PNG, JPG (không quá 2MB)</span>
                  </div>
                </div>
              </div>
              <div className="sf-save-row">
                <button className={`btn-save-settings ${saved ? "saved" : ""}`} onClick={handleSave}>
                  {saved ? <><CheckCircle2 size={14} /> Đã lưu!</> : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </section>
        )}

        {section === "interface" && (
          <section className="settings-section">
            <h2 className="s-section-title">GIAO DIỆN</h2>
            <p className="s-section-desc">Hệ thống hiện chỉ hỗ trợ giao diện tối (dark mode).</p>
            <div className="quick-settings-list">
              <div className="qs-row">
                <span className="qs-label">Chế độ tối</span>
                <button className={`toggle-switch ${quickToggles.darkMode ? "on" : ""}`} disabled title="Hệ thống chỉ có giao diện tối"><span className="toggle-knob" /></button>
              </div>
            </div>
          </section>
        )}

        {section === "map" && (
          <section className="settings-section">
            <h2 className="s-section-title">BẢN ĐỒ</h2>
            <p className="s-section-desc">Tuỳ chỉnh hiển thị mặc định cho trang Bản đồ.</p>
            <div className="quick-settings-list">
              <div className="qs-row">
                <span className="qs-label">Hiển thị lưới trên bản đồ</span>
                <button className={`toggle-switch ${quickToggles.mapGrid ? "on" : ""}`} onClick={() => toggleQuick("mapGrid")}><span className="toggle-knob" /></button>
              </div>
            </div>
          </section>
        )}

        {section === "units" && (
          <section className="settings-section">
            <h2 className="s-section-title">ĐƠN VỊ ĐO LƯỜNG</h2>
            <p className="s-section-desc">Áp dụng cho hiển thị khoảng cách/tốc độ trên toàn hệ thống.</p>
            <div className="settings-form">
              <div className="sf-row-double">
                <div className="sf-half">
                  <label className="sf-label">Đơn vị khoảng cách</label>
                  <select className="sf-select" value={settings.distance_unit} onChange={(e) => patch("distance_unit", e.target.value)}>
                    <option value="m">Mét (m)</option>
                    <option value="ft">Feet (ft)</option>
                  </select>
                </div>
                <div className="sf-half">
                  <label className="sf-label">Đơn vị tốc độ</label>
                  <select className="sf-select" value={settings.speed_unit} onChange={(e) => patch("speed_unit", e.target.value)}>
                    <option value="km/h">km/h</option>
                    <option value="m/s">m/s</option>
                  </select>
                </div>
              </div>
              <div className="sf-save-row">
                <button className={`btn-save-settings ${saved ? "saved" : ""}`} onClick={handleSave}>
                  {saved ? <><CheckCircle2 size={14} /> Đã lưu!</> : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </section>
        )}

        {section === "time" && (
          <section className="settings-section">
            <h2 className="s-section-title">THỜI GIAN</h2>
            <p className="s-section-desc">Múi giờ và định dạng ngày/giờ hiển thị.</p>
            <div className="settings-form">
              <div className="sf-row">
                <label className="sf-label">Múi giờ</label>
                <input className="sf-input" value={settings.timezone} onChange={(e) => patch("timezone", e.target.value)} />
              </div>
              <div className="sf-row-double">
                <div className="sf-half">
                  <label className="sf-label">Định dạng ngày</label>
                  <select className="sf-select" value={settings.date_format} onChange={(e) => patch("date_format", e.target.value)}>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div className="sf-half">
                  <label className="sf-label">Định dạng giờ</label>
                  <select className="sf-select" value={settings.time_format} onChange={(e) => patch("time_format", e.target.value)}>
                    <option value="24h">24 giờ</option>
                    <option value="12h">12 giờ (AM/PM)</option>
                  </select>
                </div>
              </div>
              <div className="sf-save-row">
                <button className={`btn-save-settings ${saved ? "saved" : ""}`} onClick={handleSave}>
                  {saved ? <><CheckCircle2 size={14} /> Đã lưu!</> : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </section>
        )}

        {section === "language" && (
          <section className="settings-section">
            <h2 className="s-section-title">NGÔN NGỮ</h2>
            <p className="s-section-desc">Hệ thống hiện chỉ hỗ trợ Tiếng Việt.</p>
            <div className="sf-row" style={{ maxWidth: "260px" }}>
              <select className="sf-select" disabled value="vi"><option value="vi">Tiếng Việt</option></select>
            </div>
          </section>
        )}

        {section === "security" && (
          <section className="settings-section">
            <h2 className="s-section-title">BẢO MẬT</h2>
            <p className="s-section-desc">Hệ thống hiện chỉ có 1 người vận hành (admin) — chưa có đăng nhập/phân quyền nhiều người dùng.</p>
            <div className="quick-settings-list">
              <div className="qs-row">
                <span className="qs-label">Xác nhận trước khi xoá</span>
                <button className={`toggle-switch ${quickToggles.confirmDelete ? "on" : ""}`} onClick={() => toggleQuick("confirmDelete")}><span className="toggle-knob" /></button>
              </div>
            </div>
            <div className="sf-save-row" style={{ borderTop: "none", paddingTop: 0 }}>
              <button className="btn-backup-action" disabled title="Chưa có hệ thống đăng nhập">Đổi mật khẩu</button>
            </div>
          </section>
        )}

        {section === "backup" && (
          <section className="settings-section">
            <h2 className="s-section-title">SAO LƯU DỮ LIỆU</h2>
            <p className="s-section-desc">Hệ thống hiện lưu toàn bộ dữ liệu trong 1 file SQLite (backend/uav_patrol.db) — sao lưu/khôi phục tự động chưa triển khai, thực hiện thủ công bằng cách copy file này.</p>
            <div className="backup-cards-row">
              <div className="backup-card">
                <span className="bc-label">Sao lưu gần nhất</span>
                <span className="bc-date">Chưa có bản sao lưu</span>
                <span className="bc-by">—</span>
              </div>
              <div className="backup-card">
                <span className="bc-label">Tự động sao lưu</span>
                <div className="bc-auto-row"><span className="auto-check">○</span><span className="auto-text">Chưa bật — cần chạy tác vụ định kỳ copy file thủ công</span></div>
              </div>
              <div className="backup-card actions">
                <button className="btn-backup-action primary" disabled title="Chưa triển khai">Sao lưu ngay</button>
                <button className="btn-backup-action" disabled title="Chưa triển khai">Cài đặt sao lưu</button>
              </div>
            </div>

            <h2 className="s-section-title" style={{ marginTop: "18px" }}>KHÔI PHỤC DỮ LIỆU</h2>
            <p className="s-section-desc">Khôi phục dữ liệu hệ thống từ các bản sao lưu.</p>
            <div className="backup-cards-row" style={{ gridTemplateColumns: "1fr" }}>
              <div className="backup-card actions" style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <button className="btn-backup-action" disabled title="Chưa triển khai"><Upload size={12} /> Chọn file sao lưu</button>
                <span className="logo-hint">Định dạng: .zip (không quá 2GB)</span>
              </div>
            </div>
          </section>
        )}
      </div>

      <aside className="settings-right-sidebar">
        <div className="srb-card">
          <div className="srb-card-title">TÀI KHOẢN QUẢN TRỊ</div>
          <div className="admin-account-row">
            <div className="admin-avatar-box">
              <div className="admin-avatar-circle"><User size={24} color="#94a3b8" /></div>
              <button className="btn-avatar-edit" disabled title="Chưa hỗ trợ đổi ảnh"><Pencil size={10} color="#000" /></button>
            </div>
            <div className="admin-info-grid">
              <div className="ai-row"><span className="ai-key">Tên đăng nhập</span><span className="ai-val">admin</span></div>
              <div className="ai-row"><span className="ai-key">Họ và tên</span><span className="ai-val">Quản trị viên</span></div>
              <div className="ai-row"><span className="ai-key">Email</span><span className="ai-val">admin@uavcontrol.vn</span></div>
            </div>
          </div>
        </div>

        <div className="srb-card">
          <div className="srb-card-title">THÔNG TIN HỆ THỐNG</div>
          <div className="sys-info-grid">
            <div className="si-row"><span className="si-key">Số UAV trong hệ thống</span><span className="si-val green">{counts.uavs}</span></div>
            <div className="si-row"><span className="si-key">Tổng cảnh báo đã ghi nhận</span><span className="si-val">{counts.alerts}</span></div>
            <div className="si-row"><span className="si-key">Phiên bản hệ thống</span><span className="si-val">v1.0.0</span></div>
            <div className="si-row"><span className="si-key">Cơ sở dữ liệu</span><span className="si-val font-mono">SQLite</span></div>
            <div className="si-row col">
              <span className="si-key">Dung lượng lưu trữ</span>
              <div className="storage-bar-wrap">
                <div className="storage-bar-track"><div className="storage-bar-fill" style={{ width: "8%" }} /></div>
                <span className="storage-bar-label">~vài MB / không giới hạn</span>
              </div>
            </div>
          </div>
          <button className="btn-check-update" disabled title="Chưa có cơ chế cập nhật tự động">Kiểm tra cập nhật</button>
        </div>

        <div className="srb-card">
          <div className="srb-card-title">CÀI ĐẶT NHANH</div>
          <div className="quick-settings-list">
            <div className="qs-row"><span className="qs-label">Bật chế độ tối</span><button className={`toggle-switch ${quickToggles.darkMode ? "on" : ""}`} disabled><span className="toggle-knob" /></button></div>
            <div className="qs-row"><span className="qs-label">Tự động lưu ghi chép</span><button className={`toggle-switch ${quickToggles.autoSaveNotes ? "on" : ""}`} onClick={() => toggleQuick("autoSaveNotes")}><span className="toggle-knob" /></button></div>
            <div className="qs-row"><span className="qs-label">Hiển thị lưới trên bản đồ</span><button className={`toggle-switch ${quickToggles.mapGrid ? "on" : ""}`} onClick={() => toggleQuick("mapGrid")}><span className="toggle-knob" /></button></div>
            <div className="qs-row"><span className="qs-label">Âm thanh cảnh báo</span><button className={`toggle-switch ${quickToggles.alertSound ? "on" : ""}`} onClick={() => toggleQuick("alertSound")}><span className="toggle-knob" /></button></div>
            <div className="qs-row"><span className="qs-label">Xác nhận trước khi xoá</span><button className={`toggle-switch ${quickToggles.confirmDelete ? "on" : ""}`} onClick={() => toggleQuick("confirmDelete")}><span className="toggle-knob" /></button></div>
          </div>
        </div>
      </aside>
    </div>
  );
}

// --- UAV & Thiết bị: danh sách UAV thật, chỉnh nguồn video ---
function UavDeviceTab() {
  const [uavs, setUavs] = useState([]);
  const [savedId, setSavedId] = useState(null);

  async function reload() {
    setUavs(await listUAVs());
  }
  useEffect(() => { reload(); }, []);

  async function saveSource(uav, value) {
    await updateUAV(uav.id, { video_source: value });
    setSavedId(uav.id);
    setTimeout(() => setSavedId(null), 1500);
    reload();
  }

  return (
    <div className="settings-body">
      <div className="settings-center-content" style={{ gridColumn: "1 / 4" }}>
        <section className="settings-section">
          <h2 className="s-section-title">UAV &amp; THIẾT BỊ</h2>
          <p className="s-section-desc">Danh sách UAV thật (thêm/xoá/kích hoạt giám sát trực tiếp ở trang "UAV"). Ở đây chỉ chỉnh nguồn video từng UAV.</p>
          <table className="rpt-table full">
            <thead><tr><th>Tên</th><th>Loại</th><th>Trạng thái</th><th>Khu vực</th><th>Nguồn video</th></tr></thead>
            <tbody>
              {uavs.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.type || "-"}</td>
                  <td>{u.status}</td>
                  <td>{u.zone || "-"}</td>
                  <td>
                    <input
                      className="sf-input"
                      defaultValue={u.video_source}
                      onBlur={(e) => e.target.value !== u.video_source && saveSource(u, e.target.value)}
                      style={{ fontSize: "11px" }}
                    />
                    {savedId === u.id && <span className="green-text" style={{ fontSize: "10px", marginLeft: "6px" }}>Đã lưu</span>}
                  </td>
                </tr>
              ))}
              {uavs.length === 0 && <tr><td colSpan={5} className="muted" style={{ padding: "12px" }}>Chưa có UAV.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function UsersTab() {
  return (
    <div className="settings-body">
      <div className="settings-center-content" style={{ gridColumn: "1 / 4" }}>
        <section className="settings-section">
          <h2 className="s-section-title">NGƯỜI DÙNG &amp; PHÂN QUYỀN</h2>
          <p className="s-section-desc">
            <Users size={14} style={{ verticalAlign: "-2px", marginRight: "4px" }} />
            Hệ thống hiện thiết kế cho 1 người vận hành (admin), chưa có đăng nhập/phân quyền nhiều tài khoản.
            Tính năng này chưa được triển khai — xem README mục "Chưa làm (đợt sau)".
          </p>
        </section>
      </div>
    </div>
  );
}

// --- Nhật ký hệ thống: tái dùng alert_events như một activity log chung ---
function SystemLogTab() {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    getLogs().then((l) => setLogs(Array.isArray(l) ? l.slice(0, 100) : []));
  }, []);

  return (
    <div className="settings-body">
      <div className="settings-center-content" style={{ gridColumn: "1 / 4" }}>
        <section className="settings-section">
          <h2 className="s-section-title">NHẬT KÝ HỆ THỐNG</h2>
          <p className="s-section-desc">
            <ScrollText size={14} style={{ verticalAlign: "-2px", marginRight: "4px" }} />
            Chưa có nhật ký thao tác người dùng (login/CRUD) riêng — hiển thị log cảnh báo phát hiện thật (alert_events) làm nhật ký hoạt động chung.
          </p>
          <table className="rpt-table full">
            <thead><tr><th>Thời gian</th><th>Sự kiện</th><th>Mức độ</th><th>UAV</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="font-mono" style={{ fontSize: "10px" }}>{new Date(l.timestamp).toLocaleString("vi-VN")}</td>
                  <td>Phát hiện {l.class} ({l.distance_m}m)</td>
                  <td><span className={`badge-status ${l.severity === "red" ? "unhandled" : "processing"}`}>{SEVERITY_LABEL[l.severity] ?? l.severity}</span></td>
                  <td>UAV #{l.uav_id}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={4} className="muted" style={{ padding: "12px" }}>Chưa có bản ghi nào.</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

const NOT_BUILT_ICON = { "Thông báo": Bell, "Dữ liệu & Lưu trữ": Database, "Tích hợp": Plug };
const NOT_BUILT_DESC = {
  "Thông báo": "Chưa có kênh gửi thông báo thật (Telegram/email/SMS) — xem README mục \"Chưa làm (đợt sau)\".",
  "Dữ liệu & Lưu trữ": "Chưa có chính sách lưu trữ/dọn dữ liệu tự động — dữ liệu hiện lưu vô thời hạn trong SQLite.",
  "Tích hợp": "Chưa có tích hợp hệ thống bên ngoài (MAVLink/bản đồ thời tiết/ESB...) — xem README mục \"Chưa làm (đợt sau)\".",
};

function NotBuiltTab({ name }) {
  const Icon = NOT_BUILT_ICON[name] ?? Plane;
  return (
    <div className="settings-body">
      <div className="settings-center-content" style={{ gridColumn: "1 / 4" }}>
        <section className="settings-section">
          <h2 className="s-section-title">{name.toUpperCase()}</h2>
          <p className="s-section-desc"><Icon size={14} style={{ verticalAlign: "-2px", marginRight: "4px" }} /> {NOT_BUILT_DESC[name]}</p>
        </section>
      </div>
    </div>
  );
}
