import { useState, useEffect } from "react";

const TOP_TABS = [
  "Cài đặt chung",
  "UAV & Thiết bị",
  "Người dùng & Phân quyền",
  "Thông báo",
  "Dữ liệu & Lưu trữ",
  "Tích hợp",
  "Nhật ký hệ thống",
];

const LEFT_MENU = [
  { key: "system", icon: "🖥️", label: "Thông tin hệ thống" },
  { key: "ui", icon: "🎨", label: "Giao diện" },
  { key: "map", icon: "🗺️", label: "Bản đồ" },
  { key: "units", icon: "📏", label: "Đơn vị đo lường" },
  { key: "time", icon: "⏰", label: "Thời gian" },
  { key: "lang", icon: "🌐", label: "Ngôn ngữ" },
  { key: "security", icon: "🔒", label: "Bảo mật" },
  { key: "backup", icon: "💾", label: "Sao lưu & Khôi phục" },
];

function Toggle({ defaultOn = false, id }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button id={id} className={`toggle-switch ${on ? "on" : ""}`} onClick={() => setOn(!on)} aria-checked={on}>
      <span className="toggle-knob" />
    </button>
  );
}

function StorageBar({ used, total, pct }) {
  return (
    <div className="storage-bar-wrap">
      <div className="storage-bar-track">
        <div className="storage-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="storage-bar-label">{used} / {total} ({pct}%)</span>
    </div>
  );
}

export default function SettingsPage() {
  const [topTab, setTopTab] = useState("Cài đặt chung");
  const [leftMenu, setLeftMenu] = useState("system");
  const [currentTime, setCurrentTime] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const t = now.toTimeString().slice(0, 8);
      const d = `${String(now.getDate()).padStart(2,"0")}/${String(now.getMonth()+1).padStart(2,"0")}/${now.getFullYear()}`;
      setCurrentTime(`${t} ${d}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="settings-page-layout">

      {/* ── Sub Header ── */}
      <div className="live-sub-header">
        <div className="header-left">
          <div className="uav-selector-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14"/>
            </svg>
            <span className="sub-title-label">CÀI ĐẶT</span>
            <span className="dot-divider">/</span>
            <span className="breadcrumb-sub">Trang chủ &gt; Cài đặt</span>
          </div>
        </div>
        <div className="header-right-telemetry">
          <div className="telemetry-pill"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></svg><span>GPS <strong>12</strong></span></div>
          <div className="telemetry-pill green"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg><span>Liên kết <strong>Strong</strong></span></div>
          <div className="telemetry-pill green"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="11" x2="23" y2="13"/></svg><span>Pin <strong>78%</strong></span></div>
          <div className="telemetry-pill clock-pill">{currentTime || "18:42:10 13/05/2024"}</div>
          <div className="user-profile-badge">
            <div className="avatar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e6e8ec" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
            <div className="user-info"><span className="username">admin</span><span className="user-role">Quản trị viên</span></div>
          </div>
        </div>
      </div>

      {/* ── Top Tab Navigation ── */}
      <div className="settings-top-tabs">
        {TOP_TABS.map(t => (
          <button key={t} className={`stab ${topTab === t ? "active" : ""}`} onClick={() => setTopTab(t)}>{t}</button>
        ))}
      </div>

      {/* ── Main 3-column body ── */}
      <div className="settings-body">

        {/* Left sub-menu */}
        <aside className="settings-left-menu">
          {LEFT_MENU.map(m => (
            <button key={m.key} className={`sleft-item ${leftMenu === m.key ? "active" : ""}`} onClick={() => setLeftMenu(m.key)}>
              <span className="sleft-icon">{m.icon}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </aside>

        {/* Centre content */}
        <div className="settings-center-content">

          {/* System info form */}
          <section className="settings-section">
            <h2 className="s-section-title">THÔNG TIN HỆ THỐNG</h2>
            <p className="s-section-desc">Cấu hình các thông tin cơ bản của hệ thống.</p>

            <div className="settings-form">

              <div className="sf-row">
                <label className="sf-label">Tên hệ thống</label>
                <input className="sf-input" defaultValue="UAV Control - Hệ thống quản lý UAV" />
              </div>

              <div className="sf-row">
                <label className="sf-label">Mô tả</label>
                <textarea className="sf-textarea" rows={3} defaultValue="Hệ thống giám sát và quản lý UAV phục vụ cho các nhiệm vụ giám sát, tuần tra, khảo sát." />
              </div>

              <div className="sf-row">
                <label className="sf-label">Logo hệ thống</label>
                <div className="logo-upload-area">
                  <div className="logo-preview">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="1.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div className="logo-actions">
                    <button className="btn-upload-logo">📤 Thay đổi logo</button>
                    <span className="logo-hint">Định dạng: PNG, JPG (không quá 2MB)</span>
                  </div>
                </div>
              </div>

              <div className="sf-row">
                <label className="sf-label">Múi giờ</label>
                <select className="sf-select">
                  <option>(UTC+07:00) Bangkok, Hanoi, Jakarta</option>
                  <option>(UTC+00:00) UTC</option>
                  <option>(UTC+08:00) Singapore</option>
                </select>
              </div>

              <div className="sf-row-double">
                <div className="sf-half">
                  <label className="sf-label">Định dạng ngày</label>
                  <select className="sf-select">
                    <option>DD/MM/YYYY</option>
                    <option>MM/DD/YYYY</option>
                    <option>YYYY-MM-DD</option>
                  </select>
                </div>
                <div className="sf-half">
                  <label className="sf-label">Định dạng giờ</label>
                  <select className="sf-select">
                    <option>24 giờ</option>
                    <option>12 giờ (AM/PM)</option>
                  </select>
                </div>
              </div>

              <div className="sf-row-double">
                <div className="sf-half">
                  <label className="sf-label">Đơn vị khoảng cách</label>
                  <select className="sf-select"><option>Mét (m)</option><option>Kilomét (km)</option><option>Feet (ft)</option></select>
                </div>
                <div className="sf-half">
                  <label className="sf-label">Đơn vị tốc độ</label>
                  <select className="sf-select"><option>km/h</option><option>m/s</option><option>knots</option></select>
                </div>
              </div>

              <div className="sf-row-double">
                <div className="sf-half">
                  <label className="sf-label">Đơn vị diện tích</label>
                  <select className="sf-select"><option>Kilômét vuông (km²)</option><option>Héc-ta (ha)</option></select>
                </div>
                <div className="sf-half">
                  <label className="sf-label">Đơn vị độ cao</label>
                  <select className="sf-select"><option>Mét (m)</option><option>Feet (ft)</option></select>
                </div>
              </div>

              <div className="sf-row">
                <label className="sf-label">Độ chính xác vị trí mặc định</label>
                <select className="sf-select"><option>Cao (± 1.5 m)</option><option>Trung bình (± 5 m)</option><option>Thấp (± 10 m)</option></select>
              </div>

              <div className="sf-save-row">
                <button className={`btn-save-settings ${saved ? "saved" : ""}`} onClick={handleSave}>
                  {saved ? "✅ Đã lưu!" : "Lưu thay đổi"}
                </button>
              </div>
            </div>
          </section>

          {/* Backup section */}
          <section className="settings-section">
            <h2 className="s-section-title">SAO LƯU DỮ LIỆU</h2>
            <p className="s-section-desc">Sao lưu dữ liệu hệ thống định kỳ hoặc theo yêu cầu.</p>

            <div className="backup-cards-row">
              <div className="backup-card">
                <div className="bc-label">Sao lưu gần nhất</div>
                <div className="bc-date">📅 13/05/2024 02:30 PM</div>
                <div className="bc-by">Bởi : admin</div>
              </div>
              <div className="backup-card auto">
                <div className="bc-label">Tự động sao lưu</div>
                <div className="bc-auto-row">
                  <span className="auto-text">Hàng ngày vào 02:00 AM<br />(Giữ 30 bản sao gần nhất)</span>
                  <span className="auto-check">✅</span>
                </div>
              </div>
              <div className="backup-card actions">
                <button className="btn-backup-action primary">📤 Sao lưu ngay</button>
                <button className="btn-backup-action">⚙️ Cài đặt sao lưu</button>
              </div>
            </div>
          </section>

        </div>

        {/* Right sidebar */}
        <aside className="settings-right-sidebar">

          {/* Admin account */}
          <div className="srb-card">
            <div className="srb-card-title">TÀI KHOẢN QUẢN TRỊ</div>
            <div className="admin-account-row">
              <div className="admin-info-grid">
                <div className="ai-row"><span className="ai-key">Tên đăng nhập</span><span className="ai-val">admin</span></div>
                <div className="ai-row"><span className="ai-key">Họ và tên</span><span className="ai-val">Quản trị viên</span></div>
                <div className="ai-row"><span className="ai-key">Email</span><span className="ai-val">admin@uavcontrol.vn</span></div>
                <div className="ai-row"><span className="ai-key">Số điện thoại</span><span className="ai-val">0987 654 321</span></div>
                <div className="ai-row"><span className="ai-key">Đổi mật khẩu</span><span className="ai-val link">🔑 Đổi mật khẩu</span></div>
              </div>
              <div className="admin-avatar-box">
                <div className="admin-avatar-circle">
                  <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <button className="btn-avatar-edit">✏️</button>
              </div>
            </div>
          </div>

          {/* System info */}
          <div className="srb-card">
            <div className="srb-card-title">THÔNG TIN HỆ THỐNG</div>
            <div className="sys-info-grid">
              <div className="si-row"><span className="si-key">Phiên bản hệ thống</span><span className="si-val green">v2.4.1</span></div>
              <div className="si-row"><span className="si-key">Phiên bản cơ sở dữ liệu</span><span className="si-val">2.4.1_20240510</span></div>
              <div className="si-row"><span className="si-key">Máy chủ</span><span className="si-val">UAV-SERVER-01</span></div>
              <div className="si-row"><span className="si-key">Địa chỉ IP</span><span className="si-val font-mono">192.168.1.10</span></div>
              <div className="si-row col">
                <span className="si-key">Dung lượng lưu trữ</span>
                <StorageBar used="256 GB" total="1 TB" pct={25.6} />
              </div>
              <div className="si-row"><span className="si-key">Thời gian hoạt động</span><span className="si-val">15 ngày 8 giờ 32 phút</span></div>
            </div>
            <button className="btn-check-update">🔄 Kiểm tra cập nhật</button>
          </div>

          {/* Quick settings */}
          <div className="srb-card">
            <div className="srb-card-title">CÀI ĐẶT NHANH</div>
            <div className="quick-settings-list">
              {[
                { label: "Bật chế độ tối", on: true, id: "toggle-dark" },
                { label: "Tự động lưu ghi chép", on: true, id: "toggle-autosave" },
                { label: "Hiển thị lưới trên bản đồ", on: false, id: "toggle-grid" },
                { label: "Âm thanh cảnh báo", on: true, id: "toggle-sound" },
                { label: "Xác nhận trước khi xóa", on: true, id: "toggle-confirm" },
              ].map(q => (
                <div key={q.id} className="qs-row">
                  <span className="qs-label">{q.label}</span>
                  <Toggle defaultOn={q.on} id={q.id} />
                </div>
              ))}
            </div>
          </div>

          {/* Restore data */}
          <div className="srb-card">
            <div className="srb-card-title">KHÔI PHỤC DỮ LIỆU</div>
            <p className="srb-hint">Khôi phục dữ liệu hệ thống từ các bản sao lưu.</p>
            <div className="restore-upload-row">
              <button className="btn-restore-upload">📥 Chọn file sao lưu</button>
              <span className="restore-hint">Định dạng: .zip (không quá 2GB)</span>
            </div>
          </div>

        </aside>

      </div>
    </div>
  );
}
