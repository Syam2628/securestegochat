"""
Database configuration – Supabase PostgreSQL via SQLAlchemy.
"""

from contextlib import contextmanager

import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


# ── Helpers (backward-compatible with existing main.py) ──

def init_db() -> None:
    """Create all tables that are registered on Base.metadata."""
    import db_models  # noqa: F401  – ensures models are registered
    Base.metadata.create_all(bind=engine)


class _RowProxy:
    """Row wrapper that supports dict-style row['col'] and dict(row)."""

    def __init__(self, mapping):
        self._data = dict(mapping)

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


class _CursorResult:
    """Wraps a SQLAlchemy CursorResult to expose fetchone/fetchall with dict rows."""

    def __init__(self, result):
        self._result = result
        self.lastrowid = None

    def fetchone(self):
        row = self._result.fetchone()
        if row is None:
            return None
        return _RowProxy(row._mapping)

    def fetchall(self):
        rows = self._result.fetchall()
        return [_RowProxy(r._mapping) for r in rows]


class _SessionWrapper:
    """Thin wrapper around a SQLAlchemy Session so that existing code using
    conn.execute('SQL', (params,)) / conn.commit() keeps working."""

    def __init__(self, session):
        self._session = session

    def execute(self, sql, params=None):
        # Convert ?-style placeholders to :pN named params for SQLAlchemy text()
        if params:
            converted_sql, bound = _convert_qmark(sql, params)
            result = self._session.execute(text(converted_sql), bound)
        else:
            result = self._session.execute(text(sql))

        wrapper = _CursorResult(result)

        # Attempt to capture lastrowid for INSERT statements
        if sql.strip().upper().startswith("INSERT"):
            try:
                pk = result.inserted_primary_key
                wrapper.lastrowid = pk[0] if pk else None
            except Exception:
                wrapper.lastrowid = None

        return wrapper

    def commit(self):
        self._session.commit()

    def close(self):
        self._session.close()


def _convert_qmark(sql: str, params: tuple) -> tuple[str, dict]:
    """Replace ? placeholders with :p0, :p1, … and return (sql, bound_dict)."""
    parts = sql.split("?")
    new_parts = [parts[0]]
    bound = {}
    for i, part in enumerate(parts[1:]):
        key = f"p{i}"
        new_parts.append(f":{key}")
        new_parts.append(part)
        bound[key] = params[i]
    return "".join(new_parts), bound


@contextmanager
def get_conn():
    """Yield a _SessionWrapper; auto-close the session on exit."""
    session = SessionLocal()
    try:
        yield _SessionWrapper(session)
    finally:
        session.close()
