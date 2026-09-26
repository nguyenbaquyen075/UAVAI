import tempfile
from pathlib import Path

import auth


def _fresh_db():
    auth.DB_PATH = Path(tempfile.mkdtemp()) / "t.db"  # không đụng DB thật
    auth.init()


def test_default_accounts_and_login():
    _fresh_db()
    token, user = auth.login("giamsat", "giamsat@123")
    assert user["role"] == "supervisor" and auth.user_for_token(token)["username"] == "giamsat"
    assert auth.login("giamsat", "sai") is None
    assert auth.login("khongton", "x") is None
    assert auth.user_for_token("token-bia") is None


def test_password_is_hashed_not_stored_plain():
    stored = auth.hash_password("giamsat@123")
    assert "giamsat@123" not in stored and auth.verify_password("giamsat@123", stored)
    assert auth.hash_password("giamsat@123") != stored  # salt ngẫu nhiên


def test_change_password_keeps_current_session_only():
    _fresh_db()
    t1, user = auth.login("admin", "admin@123")
    t2, _ = auth.login("admin", "admin@123")
    assert not auth.change_password(user["id"], "sai", "moi-123456", keep_token=t1)
    assert auth.change_password(user["id"], "admin@123", "moi-123456", keep_token=t1)
    assert auth.user_for_token(t1) and auth.user_for_token(t2) is None
    assert auth.login("admin", "admin@123") is None and auth.login("admin", "moi-123456")


def test_logout():
    _fresh_db()
    token, _ = auth.login("admin", "admin@123")
    auth.logout(token)
    assert auth.user_for_token(token) is None
