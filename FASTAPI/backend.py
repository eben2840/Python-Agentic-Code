from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth import latest_patient_session, request_scope, require_bearer
from .database import get_db
from .llm_safe import generate_idea_text
from .models import Task, TaskComplexity, TaskLog, TaskStatus
from .schemas import BackendCreate, IdeaRequest
from .utils import add_log, combined_html, iso, log_to_dict, task_or_404, task_to_dict

router = APIRouter(prefix="/api/backend", tags=["backend"], dependencies=[Depends(require_bearer)])


@router.get("/dashboard-data")
def dashboard_data(request: Request, db: Session = Depends(get_db)):
    session = latest_patient_session(db, request_scope(request))
    tasks = db.scalars(select(Task).order_by(Task.updated_at.desc())).all()
    grouped = group_tasks(tasks)
    return {"authenticated": bool(session), "patient_data": session_data(session), "tasks": grouped, "stats": stats(grouped)}


def group_tasks(tasks):
    groups = {name: [] for name in ("pending", "running", "reviewing", "completed", "failed", "cancelled")}
    for task in tasks:
        groups[bucket(task.status)].append(task_to_dict(task))
    return groups


def bucket(status):
    if status in {TaskStatus.planning, TaskStatus.executing, TaskStatus.fixing}:
        return "running"
    return "reviewing" if status == TaskStatus.reviewing else status.value


def session_data(session):
    if not session:
        return None
    return {"patient_name": session.patient_name, "patient_id": session.patient_id, "patient_data_summary": session.patient_data}


def stats(groups):
    return {"total": sum(len(items) for items in groups.values()), "completed": len(groups["completed"]), "failed": len(groups["failed"]), "running": len(groups["running"])}


@router.post("/generate-idea")
def generate_idea(payload: IdeaRequest, request: Request, db: Session = Depends(get_db)):
    if not payload.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt required")
    session = latest_patient_session(db, request_scope(request))
    return {"idea": generate_idea_text(payload.prompt, session.patient_data if session else None), "prompt": payload.prompt, "has_patient_context": bool(session)}


@router.post("/create-miniapp")
def create_miniapp(payload: BackendCreate, request: Request, db: Session = Depends(get_db)):
    description = payload.description or payload.prompt or ""
    if not description.strip():
        raise HTTPException(status_code=400, detail="Description/prompt required")
    session = latest_patient_session(db, request_scope(request))
    if not session:
        raise HTTPException(status_code=400, detail="No patient session found")
    task = build_task(payload, description, session)
    db.add(task)
    db.commit()
    add_log(db, task.id, f"Task created: {task.title}. Click 'Start Task' to begin generation.")
    return {"status": "success", "task_id": task.id, "message": "Task created and added to pending"}


def build_task(payload: BackendCreate, description: str, session):
    complexity = TaskComplexity[payload.complexity] if payload.complexity in TaskComplexity.__members__ else TaskComplexity.standard
    return Task(id=str(uuid.uuid4()), title=(payload.title or payload.prompt or "SMART on FHIR Mini App")[:500], description=description, specification=payload.specification, complexity=complexity, status=TaskStatus.pending, patient_id=session.patient_id, fhir_base_url=session.fhir_base_url, patient_data=session.patient_data)


@router.get("/session-status")
def session_status(request: Request, db: Session = Depends(get_db)):
    session = latest_patient_session(db, request_scope(request))
    return {"authenticated": bool(session), "session_data": session_data(session)}


@router.get("/view-app/{task_id}")
def view_app(task_id: str, db: Session = Depends(get_db)):
    task = task_or_404(db, task_id)
    if task.status != TaskStatus.completed:
        return Response(status_page(task.status.value), media_type="text/html")
    return Response(combined_html(task), media_type="text/html")


def status_page(status: str):
    return f"<html><body><h2>Mini App Generation in Progress</h2><p>Status: {status}</p></body></html>"


@router.get("/task/{task_id}/status")
def task_status(task_id: str, db: Session = Depends(get_db)):
    task = task_or_404(db, task_id)
    logs = db.scalars(select(TaskLog).where(TaskLog.task_id == task_id).order_by(TaskLog.created_at.asc())).all()
    return {"task_id": task.id, "status": task.status.value, "title": task.title, "description": task.description, "score": task.final_score, "error": task.error_message, "plan": task.plan, "activity": [log_to_dict(log) for log in logs], "created_at": iso(task.created_at), "completed_at": iso(task.completed_at)}
