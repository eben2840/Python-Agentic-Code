from __future__ import annotations

import os
from typing import Optional

import requests
from fastapi import Cookie, Depends, Header, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import get_db
from .models import PatientSession


def bearer_token(authorization: str = Header(default="")):
    parts = authorization.split(None, 1)
    if len(parts) == 2 and parts[0].lower() == "bearer":
        return parts[1].strip()
    return ""


def request_scope(request: Request):
    return {
        "patient_id": request.headers.get("X-Patient-Id") or request.query_params.get("patient_id") or request.cookies.get("patient_id"),
        "fhir_base_url": request.headers.get("X-FHIR-Base") or request.query_params.get("fhir_base_url") or request.cookies.get("fhir_base_url"),
    }


def latest_patient_session(db: Session, scope: dict):
    if not scope.get("patient_id") or not scope.get("fhir_base_url"):
        return None
    query = select(PatientSession).where(
        PatientSession.patient_id == scope["patient_id"],
        PatientSession.fhir_base_url == scope["fhir_base_url"],
    ).order_by(PatientSession.last_accessed.desc())
    return db.scalar(query)


def cookie_session(db: Session, session_id: Optional[str], scope: dict):
    if not session_id:
        return None
    session = db.get(PatientSession, session_id)
    if not session:
        return None
    if session.patient_id != scope.get("patient_id"):
        return None
    return session if session.fhir_base_url == scope.get("fhir_base_url") else None


def require_bearer(
    request: Request,
    db: Session = Depends(get_db),
    token: str = Depends(bearer_token),
    careit_session_id: Optional[str] = Cookie(default=None),
):
    if token:
        return {"token": token}
    session = cookie_session(db, careit_session_id, request_scope(request))
    if session:
        return {"session": session}
    raise HTTPException(status_code=401, detail="Unauthorized")


def require_bearer_or_basic(
    request: Request,
    db: Session = Depends(get_db),
    token: str = Depends(bearer_token),
    careit_session_id: Optional[str] = Cookie(default=None),
    authorization: str = Header(default=""),
):
    if token or cookie_session(db, careit_session_id, request_scope(request)):
        return True
    if authorization.startswith("Basic ") and validate_basic(authorization):
        return True
    raise HTTPException(status_code=401, detail="Unauthorized")


def validate_basic(auth_header: str):
    try:
        base_url = os.getenv("CAREIT_BASE_URL", "").rstrip("/")
        response = requests.get(f"{base_url}/metadata", headers={"Authorization": auth_header}, timeout=5)
        return response.status_code == 200
    except requests.RequestException:
        return False
