"""
SQLAlchemy table models for Secure Stego Chat.

Existing tables: users, sessions, messages, detection_logs
New tables:      images, steg_analysis_logs, security_alerts
"""

from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from database import Base


# ── Existing tables ──

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    created_at = Column(String, nullable=False, server_default=func.now())


class Session(Base):
    __tablename__ = "sessions"

    token = Column(String, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(String, nullable=False, server_default=func.now())


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message_type = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    is_suspicious = Column(Integer, nullable=False, default=0)
    warning = Column(Text, nullable=True)
    created_at = Column(String, nullable=False, server_default=func.now())


class DetectionLog(Base):
    __tablename__ = "detection_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    message_id = Column(Integer, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    image_name = Column(String, nullable=False)
    extracted_text = Column(Text, nullable=True)
    detected_language = Column(String, nullable=True)
    reason = Column(Text, nullable=False)
    created_at = Column(String, nullable=False, server_default=func.now())


# ── New tables requested by user ──

class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String, nullable=False)
    filepath = Column(Text, nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    message_id = Column(Integer, ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(String, nullable=False, server_default=func.now())


class StegAnalysisLog(Base):
    __tablename__ = "steg_analysis_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    image_id = Column(Integer, ForeignKey("images.id", ondelete="CASCADE"), nullable=True)
    analysis_type = Column(String, nullable=True)
    result = Column(Text, nullable=True)
    confidence = Column(Integer, nullable=True)
    created_at = Column(String, nullable=False, server_default=func.now())


class SecurityAlert(Base):
    __tablename__ = "security_alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    alert_type = Column(String, nullable=False)
    severity = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved = Column(Integer, nullable=False, default=0)
    created_at = Column(String, nullable=False, server_default=func.now())
