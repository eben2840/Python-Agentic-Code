from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth import require_bearer, require_bearer_or_basic
from .database import get_db
from .models import Bookmark, Task, TaskStatus
from .schemas import TransferPayload
from .utils import absolute_url, combined_html, fetch_fhir_options, named_options, task_or_404

router = APIRouter(tags=["mini-apps"])


@router.get("/api/mini-apps", dependencies=[Depends(require_bearer)])
def get_mini_apps(request: Request, patient_id: str, db: Session = Depends(get_db)):
    query = select(Task).where(Task.status == TaskStatus.completed, Task.html_content.is_not(None), Task.patient_id == patient_id)
    tasks = db.scalars(query).all()
    return {"count": len(tasks), "results": [mini_app_item(request, task) for task in tasks]}


def mini_app_item(request: Request, task: Task):
    return {
        "id": task.id, "patient_id": task.patient_id,
        "url": absolute_url(request, f"/mini-apps/{task.id}"),
        "title": task.title, "description": task.description,
        "final_score": task.final_score,
    }


@router.get("/mini-apps/{task_id}")
def mini_app_preview(task_id: str, db: Session = Depends(get_db)):
    return Response(combined_html(task_or_404(db, task_id)), media_type="text/html")


@router.get("/mini-apps/{task_id}/raw", dependencies=[Depends(require_bearer)])
def mini_app_raw(task_id: str, db: Session = Depends(get_db)):
    return Response(combined_html(task_or_404(db, task_id)), media_type="text/html")


@router.get("/careit-web/api/v1/options", dependencies=[Depends(require_bearer)])
def get_transfer_options():
    return {
        "status": [{"value": "active", "label": "Active"}, {"value": "not_active", "label": "Not Active"}],
        "roles": [{"value": "nurse", "label": "Pflege"}, {"value": "physician", "label": "Mediziner"}, {"value": "therapist", "label": "Therapeuten"}, {"value": "admin", "label": "Admin"}],
        "show_at": [{"value": "ward_overview", "label": "Stationsübersicht"}, {"value": "medboard", "label": "MedBoard"}, {"value": "curve", "label": "Kurve"}, {"value": "nursing_overview", "label": "Pflege-Übersicht"}],
    }


@router.get("/careit-web/api/v1/transfer-options", dependencies=[Depends(require_bearer)])
def transfer_options():
    return {"departments": departments(), "wards": locations()}


def departments():
    return named_options(fetch_fhir_options("Organization", {"type": "dept"}))


def locations():
    return named_options(fetch_fhir_options("Location"))


@router.get("/careit-web/api/v1", dependencies=[Depends(require_bearer_or_basic)])
def get_careit_web(request: Request, db: Session = Depends(get_db), patient_id: Optional[str] = None):
    query = select(Task).where(Task.status == TaskStatus.completed, Task.html_content.is_not(None), Task.transferred.is_(True), Task.transfer_status == "active")
    tasks = db.scalars(query.where(Task.patient_id == patient_id) if patient_id else query).all()
    return {"items": [careit_item(request, db, task) for task in tasks]}


def careit_item(request: Request, db: Session, task: Task):
    return {
        "id": task.id, "url": absolute_url(request, f"/mini-apps/{task.id}"),
        "title": task.title, "patient_id": task.patient_id,
        "description": task.description, "status": task.transfer_status,
        "roles": task.transfer_roles or [], "show_at": task.transfer_show_at or [],
        "department": task.transfer_dept_name, "ward": task.transfer_ward,
        "icon": task.transfer_icon, "bookmarked": has_bookmark(db, task.id),
    }


def has_bookmark(db: Session, task_id: str):
    return bool(db.scalar(select(Bookmark).where(Bookmark.task_id == task_id)))


@router.post("/careit-web/api/v1/{task_id}/transfer", dependencies=[Depends(require_bearer)])
def transfer_task(task_id: str, payload: TransferPayload, request: Request, db: Session = Depends(get_db)):
    task = task_or_404(db, task_id)
    validate_transfer(task, payload)
    apply_transfer(task, payload)
    db.commit()
    return careit_item(request, db, task)


def validate_transfer(task: Task, payload: TransferPayload):
    if task.status != TaskStatus.completed or not task.html_content:
        raise HTTPException(status_code=400, detail="Only completed mini apps can be transferred")
    if any(value in {"medboard", "curve"} for value in payload.show_at) and task.patient_id == "all":
        raise HTTPException(status_code=422, detail="Context requires a specific patient")


def apply_transfer(task: Task, payload: TransferPayload):
    task.transferred = True
    task.transferred_at = task.transferred_at or datetime.utcnow()
    task.transfer_status = payload.status
    task.transfer_roles = payload.roles
    task.transfer_show_at = payload.show_at
    task.transfer_dept_name = payload.department
    task.transfer_ward = payload.ward


@router.delete("/careit-web/api/v1/{task_id}", dependencies=[Depends(require_bearer)])
def remove_transfer(task_id: str, db: Session = Depends(get_db)):
    task = task_or_404(db, task_id)
    task.transferred = False
    db.commit()
    return {"message": "Removed from CareIT Web"}
