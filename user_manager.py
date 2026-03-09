"""
用户管理模块 - SQLite + werkzeug 密码哈希
"""
import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "users.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            api_key TEXT DEFAULT '',
            api_provider TEXT DEFAULT 'groq',
            created_at TEXT DEFAULT (datetime('now', 'localtime'))
        );
    """)
    conn.close()


def register_user(username: str, password: str, display_name: str = "") -> dict:
    if not username or not password:
        return {"error": "用户名和密码不能为空"}
    if len(username) < 2:
        return {"error": "用户名至少2个字符"}
    if len(password) < 4:
        return {"error": "密码至少4个字符"}

    display_name = display_name.strip() or username

    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO users (username, display_name, password_hash) VALUES (?, ?, ?)",
            (username.strip().lower(), display_name, generate_password_hash(password))
        )
        conn.commit()
        user = conn.execute(
            "SELECT id, username, display_name FROM users WHERE username = ?",
            (username.strip().lower(),)
        ).fetchone()
        return {"ok": True, "user": dict(user)}
    except sqlite3.IntegrityError:
        return {"error": "用户名已存在"}
    finally:
        conn.close()


def login_user(username: str, password: str) -> dict:
    if not username or not password:
        return {"error": "请输入用户名和密码"}

    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE username = ?",
        (username.strip().lower(),)
    ).fetchone()
    conn.close()

    if not user or not check_password_hash(user["password_hash"], password):
        return {"error": "用户名或密码错误"}

    return {
        "ok": True,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "display_name": user["display_name"],
            "has_api_key": bool(user["api_key"]),
            "api_provider": user["api_provider"],
        }
    }


def get_user_by_id(user_id: int) -> dict | None:
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if not user:
        return None
    return dict(user)


def save_api_key(user_id: int, api_key: str, provider: str = "groq") -> dict:
    conn = get_db()
    conn.execute(
        "UPDATE users SET api_key = ?, api_provider = ? WHERE id = ?",
        (api_key.strip(), provider, user_id)
    )
    conn.commit()
    conn.close()
    return {"ok": True}


def get_api_key(user_id: int) -> str:
    conn = get_db()
    row = conn.execute("SELECT api_key FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return row["api_key"] if row else ""


def get_masked_key(user_id: int) -> str:
    key = get_api_key(user_id)
    if not key or len(key) < 8:
        return ""
    return key[:6] + "***" + key[-4:]


# Initialize database on import
init_db()
