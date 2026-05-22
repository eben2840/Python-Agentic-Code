from __future__ import annotations

import os

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import get_db
from .models import TaskLog
from .utils import fetch_fhir_options, log_to_dict, named_options

router = APIRouter(tags=["misc"])


@router.get("/api/health")
def health_check():
    return {"status": "healthy", "version": "1.0.0", "llm_info": llm_status()}


@router.get("/api/llm/status")
def llm_status():
    return {"available": bool(os.getenv("ANTHROPIC_API_KEY")), "model": "claude-sonnet-4-20250514"}


@router.get("/api/logs")
def get_logs(db: Session = Depends(get_db)):
    logs = db.scalars(select(TaskLog).order_by(TaskLog.created_at.desc()).limit(100)).all()
    return [log_to_dict(log) for log in logs]


@router.get("/api/departments")
def get_departments():
    return {"departments": named_options(fetch_fhir_options("Organization", {"type": "dept"}))}


@router.get("/api/locations")
def get_locations():
    return {"locations": named_options(fetch_fhir_options("Location"))}
