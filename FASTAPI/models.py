from __future__ import annotations

import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class TaskStatus(enum.Enum):
    pending = "pending"
    planning = "planning"
    executing = "executing"
    reviewing = "reviewing"
    fixing = "fixing"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class TaskComplexity(enum.Enum):
    simple = "simple"
    standard = "standard"
    complex = "complex"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    specification: Mapped[Optional[str]] = mapped_column(Text)
    complexity: Mapped[TaskComplexity] = mapped_column(Enum(TaskComplexity), default=TaskComplexity.standard)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.pending)
    patient_id: Mapped[Optional[str]] = mapped_column(String(100))
    fhir_base_url: Mapped[Optional[str]] = mapped_column(String(500))
    patient_data: Mapped[Optional[dict]] = mapped_column(JSON)
    plan: Mapped[Optional[str]] = mapped_column(Text)
    generated_files: Mapped[Optional[list]] = mapped_column(JSON)
    html_content: Mapped[Optional[str]] = mapped_column(Text)
    css_content: Mapped[Optional[str]] = mapped_column(Text)
    js_content: Mapped[Optional[str]] = mapped_column(Text)
    current_iteration: Mapped[int] = mapped_column(Integer, default=0)
    max_iterations: Mapped[int] = mapped_column(Integer, default=5)
    final_score: Mapped[Optional[float]] = mapped_column(Float)
    error_message: Mapped[Optional[str]] = mapped_column(Text)
    cancel_requested: Mapped[bool] = mapped_column(Boolean, default=False)
    transferred: Mapped[bool] = mapped_column(Boolean, default=False)
    transferred_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    transfer_status: Mapped[Optional[str]] = mapped_column(String(20))
    transfer_roles: Mapped[Optional[list]] = mapped_column(JSON)
    transfer_show_at: Mapped[Optional[list]] = mapped_column(JSON)
    transfer_dept_name: Mapped[Optional[str]] = mapped_column(String(300))
    transfer_ward: Mapped[Optional[str]] = mapped_column(String(300))
    transfer_icon: Mapped[Optional[str]] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    logs = relationship("TaskLog", back_populates="task", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="task", cascade="all, delete-orphan")


class TaskLog(Base):
    __tablename__ = "task_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("tasks.id"), nullable=False)
    level: Mapped[str] = mapped_column(String(20), default="info")
    message: Mapped[str] = mapped_column(Text, nullable=False)
    details: Mapped[Optional[dict]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    task = relationship("Task", back_populates="logs")


class Generation(Base):
    __tablename__ = "generations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("tasks.id"), nullable=False)
    iteration: Mapped[int] = mapped_column(Integer, default=1)
    user_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    patient_context: Mapped[Optional[dict]] = mapped_column(JSON)
    html_content: Mapped[Optional[str]] = mapped_column(Text)
    css_content: Mapped[Optional[str]] = mapped_column(Text)
    js_content: Mapped[Optional[str]] = mapped_column(Text)
    llm_prompt: Mapped[Optional[str]] = mapped_column(Text)
    llm_response: Mapped[Optional[str]] = mapped_column(Text)
    output_folder: Mapped[Optional[str]] = mapped_column(String(500))
    html_file_path: Mapped[Optional[str]] = mapped_column(String(500))
    css_file_path: Mapped[Optional[str]] = mapped_column(String(500))
    js_file_path: Mapped[Optional[str]] = mapped_column(String(500))
    score: Mapped[Optional[float]] = mapped_column(Float)
    feedback: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PatientSession(Base):
    __tablename__ = "patient_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    patient_id: Mapped[str] = mapped_column(String(100), nullable=False)
    patient_name: Mapped[Optional[str]] = mapped_column(String(200))
    fhir_base_url: Mapped[str] = mapped_column(String(500), nullable=False)
    auth_token: Mapped[str] = mapped_column(Text, nullable=False)
    patient_data: Mapped[Optional[dict]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_accessed: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Bookmark(Base):
    __tablename__ = "bookmarks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    added_by: Mapped[Optional[str]] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    task = relationship("Task", back_populates="bookmarks")
