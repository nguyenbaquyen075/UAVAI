import React, { useState } from "react";
import {
  Shield,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  CheckCircle2,
  Trash2,
  User,
  Monitor,
  RotateCcw,
  Lightbulb,
  Check,
  LogOut,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function SecuritySettingsView() {
  const [currentPassword, setCurrentPassword] = useState("••••••••");
  const [newPassword, setNewPassword] = useState("••••••••");
  const [confirmPassword, setConfirmPassword] = useState("••••••••");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const [sessions, setSessions] = useState([
    {
      id: 1,
      device: "macOS • Chrome",
      location: "Hà Nội, Việt Nam • 192.168.1.10",
      status: "active",
      time: "Thiết bị hiện tại",
      isCurrent: true,
      Icon: Monitor,
    },
    {
      id: 2,
      device: "iPhone 14 • Safari",
      location: "Hà Nội, Việt Nam • 192.168.1.25",
      status: "idle",
      time: "2 giờ trước",
      isCurrent: false,
      Icon: Smartphone,
    },
  ]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    showToast("Cập nhật mật khẩu thành công!");
  };

  const handleLogoutDevice = (id) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
    showToast("Đã đăng xuất thiết bị!");
  };

  const handleLogoutAllOtherDevices = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    showToast("Đã đăng xuất tất cả thiết bị khác!");
  };

  return (
    <div className="sec-settings-layout font-sans">
      {/* PAGE HEADER */}
      <div className="sec-page-header">
        <div className="sec-title-row">
          <Shield size={24} className="sec-header-icon" />
          <h1 className="sec-page-title">Bảo mật</h1>
        </div>
        <p className="sec-page-subtitle">
          Quản lý mật khẩu, xác thực và các cài đặt bảo mật của hệ thống.
        </p>
      </div>

      {toastMessage && (
        <div className="sys-toast-alert">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP GRID: 2 COLUMNS (ĐỔI MẬT KHẨU & 2FA) */}
      <div className="sec-top-grid">
        {/* CARD 1: ĐỔI MẬT KHẨU */}
        <div className="sec-card">
          <div className="sec-card-header">
            <div className="sec-card-title-group">
              <Lock size={18} className="sec-card-icon" />
              <h2 className="sec-card-title">Đổi mật khẩu</h2>
            </div>
            <p className="sec-card-subtitle">
              Cập nhật mật khẩu của bạn để bảo vệ tài khoản.
            </p>
          </div>

          <form onSubmit={handleUpdatePassword} className="sec-password-form">
            {/* Input 1: Mật khẩu hiện tại */}
            <div className="sec-input-group">
              <label className="sec-label">Mật khẩu hiện tại</label>
              <div className="sec-input-wrapper">
                <input
                  type={showCurrent ? "text" : "password"}
                  className="sec-input font-mono"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="sec-eye-btn"
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Input 2: Mật khẩu mới */}
            <div className="sec-input-group">
              <label className="sec-label">Mật khẩu mới</label>
              <div className="sec-input-wrapper">
                <input
                  type={showNew ? "text" : "password"}
                  className="sec-input font-mono"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="sec-eye-btn"
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Input 3: Xác nhận mật khẩu mới */}
            <div className="sec-input-group">
              <label className="sec-label">Xác nhận mật khẩu mới</label>
              <div className="sec-input-wrapper">
                <input
                  type={showConfirm ? "text" : "password"}
                  className="sec-input font-mono"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="sec-eye-btn"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* PASSWORD STRENGTH BAR */}
            <div className="sec-strength-group">
              <div className="strength-header font-sans">
                <span className="lbl">Độ mạnh mật khẩu:</span>
                <span className="val green">Mạnh</span>
              </div>
              <div className="strength-bar-track">
                <div className="strength-segment filled" />
                <div className="strength-segment filled" />
                <div className="strength-segment filled" />
                <div className="strength-segment filled" />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button type="submit" className="sec-btn-primary">
              <Lock size={15} />
              <span>Cập nhật mật khẩu</span>
            </button>
          </form>
        </div>

        {/* CARD 2: XÁC THỰC HAI YẾU TỐ (2FA) */}
        <div className="sec-card">
          <div className="sec-card-header-flex">
            <div className="sec-card-title-group">
              <Shield size={18} className="sec-card-icon" />
              <h2 className="sec-card-title">Xác thực hai yếu tố (2FA)</h2>
            </div>
            <button
              type="button"
              className={`ui-switch ${twoFactorEnabled ? "on" : ""}`}
              onClick={() => {
                setTwoFactorEnabled(!twoFactorEnabled);
                showToast(
                  !twoFactorEnabled ? "Đã bật xác thực 2FA!" : "Đã tắt 2FA!"
                );
              }}
            >
              <span className="ui-switch-knob" />
            </button>
          </div>
          <p className="sec-card-subtitle">
            Thêm một lớp bảo mật để bảo vệ tài khoản của bạn.
          </p>

          <div className="sec-2fa-status-row">
            <span className="lbl">Trạng thái</span>
            <span
              className={`sec-pill-badge ${twoFactorEnabled ? "green" : "gray"}`}
            >
              {twoFactorEnabled ? "Đã bật" : "Đã tắt"}
            </span>
          </div>

          <div className="sec-method-section">
            <span className="method-section-title">Phương thức xác thực</span>

            <div className="sec-method-inner-card">
              <div className="method-left">
                <div className="method-icon-box">
                  <Smartphone size={22} color="#94a3b8" />
                </div>
                <div className="method-info">
                  <span className="title">Ứng dụng xác thực (TOTP)</span>
                  <span className="sub font-mono">Google Authenticator</span>
                </div>
              </div>
              <button className="sec-btn-outline-sm">Quản lý</button>
            </div>
          </div>

          <button
            type="button"
            className="sec-btn-danger-outline"
            onClick={() => {
              setTwoFactorEnabled(false);
              showToast("Đã tắt xác thực 2FA");
            }}
          >
            <Trash2 size={15} />
            <span>Tắt xác thực 2FA</span>
          </button>
        </div>
      </div>

      {/* BOTTOM GRID: 3 COLUMNS */}
      <div className="sec-bottom-grid">
        {/* COLUMN 1: PHIÊN ĐĂNG NHẬP ĐANG HOẠT ĐỘNG */}
        <div className="sec-card flex-col-between">
          <div>
            <div className="sec-card-header">
              <div className="sec-card-title-group">
                <User size={18} className="sec-card-icon" />
                <h2 className="sec-card-title">Phiên đăng nhập đang hoạt động</h2>
              </div>
              <p className="sec-card-subtitle">
                Quản lý các thiết bị đang đăng nhập vào tài khoản của bạn.
              </p>
            </div>

            <div className="sec-sessions-list">
              {sessions.map((sess) => {
                const SessIcon = sess.Icon;
                return (
                  <div key={sess.id} className="sec-session-item">
                    <div className="sess-icon-box">
                      <SessIcon size={20} color="#cbd5e1" />
                    </div>
                    <div className="sess-info-stack">
                      <div className="sess-title-row">
                        <span className="device-name font-mono">{sess.device}</span>
                        {sess.isCurrent && (
                          <span className="badge-current">Thiết bị hiện tại</span>
                        )}
                      </div>
                      <span className="location-text font-mono">{sess.location}</span>
                    </div>
                    <div className="sess-action-side">
                      {sess.isCurrent ? (
                        <span className="status-text green">Đang hoạt động</span>
                      ) : (
                        <div className="logout-stack">
                          <span className="time-text font-mono">{sess.time}</span>
                          <button
                            className="btn-logout-red"
                            onClick={() => handleLogoutDevice(sess.id)}
                          >
                            Đăng xuất
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            className="sec-btn-full-dark margin-top-14"
            onClick={handleLogoutAllOtherDevices}
          >
            <LogOut size={15} />
            <span>Đăng xuất tất cả các thiết bị khác</span>
          </button>
        </div>

        {/* COLUMN 2: LỊCH SỬ ĐĂNG NHẬP */}
        <div className="sec-card flex-col-between">
          <div>
            <div className="sec-card-header">
              <div className="sec-card-title-group">
                <RotateCcw size={18} className="sec-card-icon" />
                <h2 className="sec-card-title">Lịch sử đăng nhập</h2>
              </div>
              <p className="sec-card-subtitle">
                Xem các hoạt động đăng nhập gần đây.
              </p>
            </div>

            <div className="sec-history-list">
              <div className="history-item">
                <div className="history-dot green" />
                <div className="history-info">
                  <span className="title">Đăng nhập thành công</span>
                  <span className="sub font-mono">Hà Nội, Việt Nam • 192.168.1.10</span>
                </div>
                <div className="history-time font-mono">
                  <span>Hôm nay</span>
                  <span className="time font-mono">09:15</span>
                </div>
              </div>

              <div className="history-item">
                <div className="history-dot green" />
                <div className="history-info">
                  <span className="title">Đăng nhập thành công</span>
                  <span className="sub font-mono">Hà Nội, Việt Nam • 192.168.1.25</span>
                </div>
                <div className="history-time font-mono">
                  <span>Hôm qua</span>
                  <span className="time font-mono">21:47</span>
                </div>
              </div>

              <div className="history-item">
                <div className="history-dot red" />
                <div className="history-info">
                  <span className="title">Đăng nhập thất bại</span>
                  <span className="sub font-mono">Hồ Chí Minh, Việt Nam • 113.161.45.23</span>
                </div>
                <div className="history-time font-mono">
                  <span>2 ngày trước</span>
                  <span className="time font-mono">22:10</span>
                </div>
              </div>
            </div>
          </div>

          <button className="sec-btn-full-dark margin-top-14">
            <span>Xem tất cả lịch sử</span>
            <ArrowRight size={15} />
          </button>
        </div>

        {/* COLUMN 3: MẸO BẢO MẬT */}
        <div className="sec-card flex-col-between">
          <div>
            <div className="sec-card-header">
              <div className="sec-card-title-group">
                <Lightbulb size={18} className="sec-card-icon" />
                <h2 className="sec-card-title">Mẹo bảo mật</h2>
              </div>
              <p className="sec-card-subtitle">
                Một số khuyến nghị giúp bảo vệ tài khoản của bạn.
              </p>
            </div>

            <div className="sec-tips-list">
              <div className="tip-row">
                <Check size={16} className="tip-check" />
                <div className="tip-content">
                  <span className="title font-bold">Sử dụng mật khẩu mạnh</span>
                  <span className="desc">
                    Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt.
                  </span>
                </div>
              </div>

              <div className="tip-row">
                <Check size={16} className="tip-check" />
                <div className="tip-content">
                  <span className="title font-bold">Không chia sẻ tài khoản</span>
                  <span className="desc">
                    Không chia sẻ thông tin đăng nhập với người khác.
                  </span>
                </div>
              </div>

              <div className="tip-row">
                <Check size={16} className="tip-check" />
                <div className="tip-content">
                  <span className="title font-bold">Bật xác thực 2FA</span>
                  <span className="desc">
                    Đã bật xác thực 2 lớp để tăng cường bảo mật.
                  </span>
                </div>
              </div>

              <div className="tip-row">
                <Check size={16} className="tip-check" />
                <div className="tip-content">
                  <span className="title font-bold">Đăng xuất khi không sử dụng</span>
                  <span className="desc">
                    Đăng xuất khỏi các thiết bị lạ hoặc không sử dụng.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="sec-protected-box">
            <ShieldCheck size={24} color="#22c55e" className="flex-shrink-0" />
            <div className="protected-text-stack">
              <span className="title font-bold green-text">
                Tài khoản của bạn được bảo vệ tốt!
              </span>
              <span className="desc">
                Cảm ơn bạn đã tuân thủ các nguyên tắc bảo mật.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="sec-footer-text">
        © 2024 UAV Control System. All rights reserved.
      </footer>
    </div>
  );
}
