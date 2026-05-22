from __future__ import annotations

from datetime import datetime

from llm_service import ClaudeLLMService

from .database import SessionLocal
from .models import Generation, TaskStatus
from .utils import add_log, save_files, task_or_404


def generation_prompt(task):
    return f"{task.title}\n\n{task.description or ''}\n\n{task.specification or ''}"


def set_status(db, task, status):
    task.status = status
    task.updated_at = datetime.utcnow()
    db.commit()


def fail_task(db, task, error: Exception):
    task.status = TaskStatus.failed
    task.error_message = str(error)
    task.updated_at = datetime.utcnow()
    db.commit()
    add_log(db, task.id, f"Task failed: {error}", "error")


def save_generation(db, task, prompt, html, css, js, raw):
    paths = save_files(task.id, html, css, js)
    task.html_content = html
    task.css_content = css
    task.js_content = js
    task.generated_files = list(paths.values())
    db.add(Generation(task_id=task.id, iteration=task.current_iteration,
                      user_prompt=prompt, patient_context=task.patient_data,
                      html_content=html, css_content=css, js_content=js,
                      llm_response=raw, output_folder=paths.get("html")))
    db.commit()


def run_task_generation(task_id: str):
    db = SessionLocal()
    try:
        task = task_or_404(db, task_id)
        prepare_task(db, task)
        llm = ClaudeLLMService()
        prompt = generation_prompt(task)
        html, css, js, raw = llm.generate_mini_app(prompt, task.patient_data)
        save_generation(db, task, prompt, html, css, js, raw)
        review_task(db, task, llm, prompt)
    except Exception as error:
        fail_task(db, task, error)
    finally:
        db.close()


def prepare_task(db, task):
    if not task.patient_data:
        raise ValueError("No patient data available")
    task.status = TaskStatus.executing
    task.current_iteration += 1
    task.cancel_requested = False
    task.error_message = None
    db.commit()
    add_log(db, task.id, "Generating mini app...", "info")


def review_task(db, task, llm, prompt):
    set_status(db, task, TaskStatus.reviewing)
    score, feedback = llm.review_generated_code(task.html_content, task.css_content or "", task.js_content or "", prompt)
    task.final_score = score
    task.status = TaskStatus.completed
    task.completed_at = datetime.utcnow()
    db.commit()
    add_log(db, task.id, f"Task completed with score: {score}/10", "info", {"feedback": feedback})


def continue_generation(task_id: str, changes: str):
    db = SessionLocal()
    try:
        task = task_or_404(db, task_id)
        llm = ClaudeLLMService()
        html, css, js, raw = llm.continue_mini_app(task.html_content or "", task.css_content or "", task.js_content or "", changes, task.patient_data)
        task.current_iteration += 1
        save_generation(db, task, changes, html, css, js, raw)
        review_task(db, task, llm, f"{task.title}\n{changes}")
    except Exception as error:
        fail_task(db, task, error)
    finally:
        db.close()
