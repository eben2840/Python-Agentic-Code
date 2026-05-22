from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth import require_bearer
from .database import get_db
from .models import Task, TaskLog, TaskStatus
from .schemas import ContinueTask, TaskUpdate
from .utils import add_log, log_to_dict, task_or_404, task_to_dict
from .worker import continue_generation, run_task_generation

router = APIRouter(prefix="/api/tasks", tags=["tasks"], dependencies=[Depends(require_bearer)])


@router.get("")
def list_tasks(db: Session = Depends(get_db)):
    tasks = db.scalars(select(Task).order_by(Task.updated_at.desc())).all()
    return [task_to_dict(task) for task in tasks]


@router.get("/{task_id}")
def get_task(task_id: str, db: Session = Depends(get_db)):
    return task_to_dict(task_or_404(db, task_id))


@router.put("/{task_id}")
@router.patch("/{task_id}")
def update_task(task_id: str, payload: TaskUpdate, db: Session = Depends(get_db)):
    task = task_or_404(db, task_id)
    update_task_fields(task, payload)
    db.commit()
    return task_to_dict(task)


def update_task_fields(task: Task, payload: TaskUpdate):
    for field in ("title", "description", "specification"):
        value = getattr(payload, field)
        if value is not None:
            setattr(task, field, value)
    if payload.status in TaskStatus.__members__:
        task.status = TaskStatus[payload.status]


@router.delete("/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db)):
    db.delete(task_or_404(db, task_id))
    db.commit()
    return {"message": "Task deleted"}


@router.post("/{task_id}/run")
def run_task(task_id: str, background: BackgroundTasks, db: Session = Depends(get_db)):
    task = task_or_404(db, task_id)
    task.status = TaskStatus.pending
    task.current_iteration = 0
    task.error_message = None
    task.cancel_requested = False
    db.commit()
    background.add_task(run_task_generation, task_id)
    return task_to_dict(task)


@router.post("/{task_id}/cancel")
def cancel_task(task_id: str, db: Session = Depends(get_db)):
    task = task_or_404(db, task_id)
    if task.status not in running_statuses():
        raise HTTPException(status_code=400, detail="Task is not running")
    task.status = TaskStatus.pending
    task.cancel_requested = True
    task.error_message = "Execution stopped by user"
    db.commit()
    return {"message": "Task stopped and moved to pending", "task": task_to_dict(task)}


def running_statuses():
    return {TaskStatus.planning, TaskStatus.executing, TaskStatus.reviewing, TaskStatus.fixing}


@router.post("/{task_id}/continue")
def continue_task(task_id: str, payload: ContinueTask, background: BackgroundTasks, db: Session = Depends(get_db)):
    task = task_or_404(db, task_id)
    if not task.html_content:
        raise HTTPException(status_code=400, detail="Task has no generated content")
    if not payload.changes.strip():
        raise HTTPException(status_code=400, detail="Changes description required")
    add_log(db, task_id, f"Continuing task with changes: {payload.changes[:100]}...", "info")
    background.add_task(continue_generation, task_id, payload.changes)
    return {"message": "Applying changes...", "task": task_to_dict(task)}


@router.get("/{task_id}/logs")
def get_task_logs(task_id: str, db: Session = Depends(get_db)):
    query = select(TaskLog).where(TaskLog.task_id == task_id).order_by(TaskLog.created_at.desc())
    return [log_to_dict(log) for log in db.scalars(query).all()]
