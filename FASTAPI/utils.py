from __future__ import annotations

import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Optional

import requests
from fastapi import HTTPException, Request
from sqlalchemy.orm import Session

from .database import ROOT_DIR
from .models import Task, TaskLog

OUTPUT_DIR = ROOT_DIR / "generated_apps"
OUTPUT_DIR.mkdir(exist_ok=True)


def iso(value):
    return value.isoformat() if value else None


def task_to_dict(task: Task):
    return {
        "id": task.id, "title": task.title, "description": task.description,
        "specification": task.specification, "complexity": task.complexity.value,
        "status": task.status.value, "patient_id": task.patient_id,
        "fhir_base_url": task.fhir_base_url, "patient_data": task.patient_data,
        "plan": task.plan, "generated_files": task.generated_files or [],
        "html_content": task.html_content, "css_content": task.css_content,
        "js_content": task.js_content, "current_iteration": task.current_iteration,
        "max_iterations": task.max_iterations, "final_score": task.final_score,
        "error_message": task.error_message, "created_at": iso(task.created_at),
        "updated_at": iso(task.updated_at), "completed_at": iso(task.completed_at),
    }


def log_to_dict(log: TaskLog):
    return {
        "id": log.id, "task_id": log.task_id, "level": log.level,
        "message": log.message, "details": log.details, "created_at": iso(log.created_at),
    }


def task_or_404(db: Session, task_id: str):
    task = db.get(Task, task_id)
    if task:
        return task
    raise HTTPException(status_code=404, detail="Task not found")


def add_log(db: Session, task_id: str, message: str, level: str = "info", details=None):
    log = TaskLog(task_id=task_id, message=message, level=level, details=details)
    db.add(log)
    db.commit()
    return log


def save_files(task_id: str, html: str, css: str, js: str):
    folder = OUTPUT_DIR / task_id
    folder.mkdir(exist_ok=True)
    paths = _write_app_files(folder, html, css, js)
    return {name: str(path) for name, path in paths.items()}


def _write_app_files(folder: Path, html: str, css: str, js: str):
    files = {}
    for name, content in {"index.html": html, "styles.css": css, "app.js": js}.items():
        if content:
            path = folder / name
            path.write_text(content, encoding="utf-8")
            files[name.split(".")[0]] = path
    return files


def combined_html(task: Task):
    html = task.html_content or "<html><body><p>No content available</p></body></html>"
    html = re.sub(r"<link[^>]+href=['\"]styles\.css['\"][^>]*/?>", "", html, flags=re.I)
    html = re.sub(r"<script[^>]+src=['\"]app\.js['\"][^>]*></script>", "", html, flags=re.I)
    html = _inject_style(html, task.css_content or "")
    return _inject_script(html, task.js_content or "", task.patient_data)


def _inject_style(html: str, css: str):
    return html.replace("</head>", f"<style>{css}</style></head>", 1) if css else html


def _inject_script(html: str, js: str, patient_data: Optional[dict]):
    patient = f"<script>window.PATIENT_DATA={json.dumps(patient_data)};</script>" if patient_data else ""
    script = f"{patient}<script>{js}</script>" if js else patient
    return html.replace("</body>", f"{script}</body>", 1) if script else html


def absolute_url(request: Request, path: str):
    return str(request.base_url).rstrip("/") + path


def fetch_fhir_options(resource: str, params=None):
    base_url = os.getenv("CAREIT_BASE_URL", "").rstrip("/")
    auth = (os.getenv("CAREIT_USERNAME"), os.getenv("CAREIT_PASSWORD"))
    response = requests.get(f"{base_url}/{resource}", params=params, auth=auth, timeout=10)
    response.raise_for_status()
    return response.json().get("entry", [])


def named_options(entries):
    return [
        {"id": item["resource"]["id"], "name": item["resource"]["name"]}
        for item in entries
        if item.get("resource", {}).get("name")
    ]
