import { useState } from "react";
import { Lock, User, LogIn, AlertCircle } from "lucide-react";
import { authLogin } from "../api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!username.trim() || !password) return setError("Nhập tên đăng nhập và mật khẩu");
    setLoading(true);
    setError("");
    try {
      onLogin(await authLogin(username.trim(), password));
    } catch (err) {
      setError(err.message);
      setPassword("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <circle cx="12" cy="11" r="3" fill="#4ade80" fillOpacity="0.3" />
            <path d="m9 11 2 2 4-4" />
          </svg>
          <div>
            <h1>UAV CONTROL</h1>
            <span>HỆ THỐNG QUẢN LÝ UAV</span>
          </div>
        </div>

        <h2>Đăng nhập</h2>

        <label className="login-field">
          <span>Tên đăng nhập</span>
          <div className="login-input">
            <User size={16} />
            <input autoFocus autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
        </label>

        <label className="login-field">
          <span>Mật khẩu</span>
          <div className="login-input">
            <Lock size={16} />
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </label>

        {error && (
          <div className="login-error" role="alert">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        <button type="submit" className="login-submit" disabled={loading}>
          <LogIn size={16} /> {loading ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
