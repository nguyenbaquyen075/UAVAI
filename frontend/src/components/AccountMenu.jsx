import { useEffect, useRef, useState } from "react";
import { User, LogOut, KeyRound, ChevronDown, X } from "lucide-react";
import { authChangePassword } from "../api";

// Nút tài khoản góc phải trên: tên + vai trò, menu Đổi mật khẩu / Đăng xuất
export default function AccountMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const [changing, setChanging] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="account-menu" ref={ref}>
      <button className="user-profile-badge account-trigger" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <div className="avatar-circle">
          <User size={16} color="#e2e8f0" />
        </div>
        <div className="user-details">
          <span className="username">{user.full_name && user.full_name !== user.role_label ? user.full_name : user.username}</span>
          <span className={`user-role ${user.role === "admin" ? "role-admin" : "role-supervisor"}`}>{user.role_label}</span>
        </div>
        <ChevronDown size={14} color="#94a3b8" />
      </button>

      {open && (
        <div className="account-dropdown">
          <div className="account-dropdown-head">
            <strong>{user.username}</strong>
            <span>{user.role_label}</span>
          </div>
          <button
            onClick={() => {
              setOpen(false);
              setChanging(true);
            }}
          >
            <KeyRound size={14} /> Đổi mật khẩu
          </button>
          <button className="danger" onClick={onLogout}>
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>
      )}

      {changing && <ChangePasswordModal onClose={() => setChanging(false)} />}
    </div>
  );
}

function ChangePasswordModal({ onClose }) {
  const [f, setF] = useState({ old: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (f.next.length < 6) return setError("Mật khẩu mới phải có ít nhất 6 ký tự");
    if (f.next !== f.confirm) return setError("Nhập lại mật khẩu mới không khớp");
    setSaving(true);
    setError("");
    try {
      await authChangePassword(f.old, f.next);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mm-modal-backdrop" onClick={onClose}>
      <form className="mm-modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="mm-modal-head">
          <h3>Đổi mật khẩu</h3>
          <button type="button" onClick={onClose} title="Đóng">
            <X size={16} />
          </button>
        </div>
        {done ? (
          <>
            <p className="account-success">Đã đổi mật khẩu. Các máy khác đang đăng nhập tài khoản này đã bị đăng xuất.</p>
            <div className="mm-modal-foot">
              <button type="button" className="mm-btn" onClick={onClose}>
                Xong
              </button>
            </div>
          </>
        ) : (
          <>
            <label>
              Mật khẩu hiện tại
              <input type="password" autoComplete="current-password" value={f.old} onChange={(e) => setF({ ...f, old: e.target.value })} />
            </label>
            <label>
              Mật khẩu mới (ít nhất 6 ký tự)
              <input type="password" autoComplete="new-password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} />
            </label>
            <label>
              Nhập lại mật khẩu mới
              <input type="password" autoComplete="new-password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} />
            </label>
            {error && <div className="login-error">{error}</div>}
            <div className="mm-modal-foot">
              <button type="button" className="mm-btn ghost" onClick={onClose}>
                Huỷ
              </button>
              <button type="submit" className="mm-btn" disabled={saving}>
                {saving ? "Đang lưu…" : "Đổi mật khẩu"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
