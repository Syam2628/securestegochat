import os
import sqlite3
from pathlib import Path
from contextlib import contextmanager

BASE_DIR = Path(__file__).resolve().parent

# ── Determine which database to use ──
DATABASE_URL = os.environ.get("DATABASE_URL")
USE_POSTGRES = bool(DATABASE_URL)

# SQLite path (local development)
DB_PATH = BASE_DIR / "secure_stego_chat.db"

_CREATE_TABLES_SQLITE = """
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        message_type TEXT NOT NULL,
        content TEXT NOT NULL,
        is_suspicious INTEGER NOT NULL DEFAULT 0,
        warning TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(sender_id) REFERENCES users(id),
        FOREIGN KEY(receiver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS detection_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id INTEGER NOT NULL,
        image_name TEXT NOT NULL,
        extracted_text TEXT,
        detected_language TEXT,
        reason TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(message_id) REFERENCES messages(id) ON DELETE CASCADE
    );
"""

_CREATE_TABLES_PG = [
    """
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (NOW()::TEXT)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TEXT NOT NULL DEFAULT (NOW()::TEXT)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL REFERENCES users(id),
        receiver_id INTEGER NOT NULL REFERENCES users(id),
        message_type TEXT NOT NULL,
        content TEXT NOT NULL,
        is_suspicious INTEGER NOT NULL DEFAULT 0,
        warning TEXT,
        created_at TEXT NOT NULL DEFAULT (NOW()::TEXT)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS detection_logs (
        id SERIAL PRIMARY KEY,
        message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        image_name TEXT NOT NULL,
        extracted_text TEXT,
        detected_language TEXT,
        reason TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (NOW()::TEXT)
    )
    """,
]


def init_db() -> None:
    if USE_POSTGRES:
        import psycopg2

        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cur = conn.cursor()
        for stmt in _CREATE_TABLES_PG:
            cur.execute(stmt)
        cur.close()
        conn.close()
    else:
        with sqlite3.connect(DB_PATH) as conn:
            conn.executescript(_CREATE_TABLES_SQLITE)
            conn.commit()


@contextmanager
def get_conn():
    if USE_POSTGRES:
        import psycopg2
        import psycopg2.extras

        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = False
        try:
            yield _PgConnWrapper(conn)
        finally:
            conn.close()
    else:
        conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()


class _PgConnWrapper:
    """Thin wrapper so PostgreSQL cursor results behave like sqlite3.Row."""

    def __init__(self, conn):
        self._conn = conn

    def execute(self, sql, params=None):
        # Convert SQLite ?-style placeholders to PostgreSQL %s
        sql = sql.replace("?", "%s")
        cur = self._conn.cursor(cursor_factory=_DictCursorFactory)
        cur.execute(sql, params or ())
        return _PgCursorWrapper(cur)

    def executescript(self, sql):
        cur = self._conn.cursor()
        cur.execute(sql)
        self._conn.commit()
        cur.close()

    def commit(self):
        self._conn.commit()

    def close(self):
        self._conn.close()


class _DictCursorFactory:
    """Not used directly — see _PgCursorWrapper."""
    pass


class _PgCursorWrapper:
    """Makes psycopg2 cursor results support dict-like row[\"col\"] access."""

    def __init__(self, cur):
        self._cur = cur
        self.lastrowid = None
        # For INSERT ... RETURNING or lastrowid simulation
        if cur.description is None:
            # DML without RETURNING — try to get lastrowid for INSERTs
            try:
                cur.execute("SELECT lastval()")
                row = cur.fetchone()
                self.lastrowid = row[0] if row else None
            except Exception:
                self.lastrowid = None

    def fetchone(self):
        row = self._cur.fetchone()
        if row is None:
            return None
        cols = [desc[0] for desc in self._cur.description]
        return _DictRow(dict(zip(cols, row)))

    def fetchall(self):
        rows = self._cur.fetchall()
        if not rows:
            return []
        cols = [desc[0] for desc in self._cur.description]
        return [_DictRow(dict(zip(cols, r))) for r in rows]


class _DictRow:
    """Row object that supports both row[\"col\"] and dict(row)."""

    def __init__(self, data: dict):
        self._data = data

    def __getitem__(self, key):
        return self._data[key]

    def keys(self):
        return self._data.keys()

    def values(self):
        return self._data.values()

    def items(self):
        return self._data.items()

    def __iter__(self):
        return iter(self._data)

    def __len__(self):
        return len(self._data)
