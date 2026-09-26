"""Tài khoản + phiên đăng nhập. Mật khẩu băm PBKDF2-SHA256 (stdlib), phiên lưu trong DB nên
khởi động lại backend không bị đăng xuất."""

import hashlib
import hmac
import secrets
import sqlite3
import time

from db import DB_PATH

ROLES = {"admin": "Quản trị viên", "supervisor": "Người giám sát"}
SESSION_TTL_S = 12 * 3600  # 1 ca trực
PBKDF2_ROUNDS = 200_000

# Tài khoản tạo sẵn lần chạy đầu — đổi mật khẩu sau khi đăng nhập (nút tài khoản góc phải trên).
DEFAULT_USERS = [
    ("admin", "admin@123", "Quản trị hệ thống", "admin"),
    ("giamsat", "giamsat@123", "Người giám sát", "supervisor"),
]


def _conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def hash_password(password, salt=None):
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), PBKDF2_ROUNDS).hex()
    return f"{salt}${digest}"


def verify_password(password, stored):
    salt, _ = stored.split("$", 1)
    return hmac.compare_digest(hash_password(password, salt), stored)


def init():
    conn = _conn()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL DEFAULT '',
            role TEXT NOT NULL CHECK (role IN ('admin', 'supervisor')),
            created_at TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            expires_at REAL NOT NULL
        )
    """)
    if conn.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
        now = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        for username, password, full_name, role in DEFAULT_USERS:
            conn.execute(
                "INSERT INTO users (username, password_hash, full_name, role, created_at) VALUES (?, ?, ?, ?, ?)",
                (username, hash_password(password), full_name, role, now),
            )
    conn.commit()
    conn.close()


def public_user(row):
    return {"id": row["id"], "username": row["username"], "full_name": row["full_name"],
            "role": row["role"], "role_label": ROLES[row["role"]]}


def login(username, password):
    """-> (token, user) nếu đúng, None nếu sai."""
    conn = _conn()
    row = conn.execute("SELECT * FROM users WHERE username = ?", (username.strip(),)).fetchone()
    if row is None or not verify_password(password, row["password_hash"]):
        conn.close()
        return None
    token = secrets.token_urlsafe(32)
    conn.execute("DELETE FROM sessions WHERE expires_at < ?", (time.time(),))
    conn.execute("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)", (token, row["id"], time.time() + SESSION_TTL_S))
    conn.commit()
    conn.close()
    return token, public_user(row)


def user_for_token(token):
    if not token:
        return None
    conn = _conn()
    row = conn.execute(
        "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ?",
        (token, time.time()),
    ).fetchone()
    conn.close()
    return public_user(row) if row else None


def logout(token):
    conn = _conn()
    conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
    conn.commit()
    conn.close()


def change_password(user_id, old_password, new_password, keep_token=None):
    conn = _conn()
    row = conn.execute("SELECT password_hash FROM users WHERE id = ?", (user_id,)).fetchone()
    if row is None or not verify_password(old_password, row["password_hash"]):
        conn.close()
        return False
    conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (hash_password(new_password), user_id))
    # đăng xuất mọi phiên khác (máy khác đang dùng mật khẩu cũ), giữ phiên hiện tại
    conn.execute("DELETE FROM sessions WHERE user_id = ? AND token != ?", (user_id, keep_token or ""))
    conn.commit()
    conn.close()
    return True
