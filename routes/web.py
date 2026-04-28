import logging
from datetime import datetime

from flask import Blueprint, render_template, request, redirect, url_for

from models import db, Task, TaskStatus, PatientSession
from llm_service import ClaudeLLMService
from services.patient_context_service import load_latest_patient_session
from utils.auth import require_bearer
from services.executor import execute_task

logger = logging.getLogger(__name__)
web = Blueprint('web', __name__)


def _load_tasks() -> dict:
    return {
        'pending':   Task.query.filter_by(status=TaskStatus.pending).order_by(Task.updated_at.desc()).all(),
        'running':   Task.query.filter(Task.status.in_([TaskStatus.planning, TaskStatus.executing, TaskStatus.fixing])).order_by(Task.updated_at.desc()).all(),
        'reviewing': Task.query.filter_by(status=TaskStatus.reviewing).order_by(Task.updated_at.desc()).all(),
        'completed': Task.query.filter_by(status=TaskStatus.completed).order_by(Task.completed_at.desc()).all(),
        'failed':    Task.query.filter_by(status=TaskStatus.failed).order_by(Task.updated_at.desc()).all(),
    }


def _render_dashboard():
    session = load_latest_patient_session()
    if session:
        session.last_accessed = datetime.utcnow()
        db.session.commit()

    tasks = _load_tasks()
    return render_template('index.html',
        pending_tasks=tasks['pending'],
        running_tasks=tasks['running'],
        reviewing_tasks=tasks['reviewing'],
        completed_tasks=tasks['completed'],
        failed_tasks=tasks['failed'],
    )


# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------

@web.route('/', methods=['GET', 'POST'])
# @require_bearer
def index():
    return _render_dashboard()


@web.route('/generate')
# @require_bearer
def generate():
    return render_template('generate.html')


@web.route('/vibe-apps')
# @require_bearer
def vibe_apps():
    return render_template('vibe_apps.html')


@web.route('/automation')
# @require_bearer
def automation():
    return render_template('automation.html')


@web.route('/task-action', methods=['POST'])
@require_bearer
def handle_task_action():
    """Handle task actions (restart, delete, stop)"""
    action  = request.form.get('action')
    task_id = request.form.get('task_id')
    print(f"[TASK-ACTION] action={action}, task_id={task_id}")

    if action == 'restart' and task_id:
        print(f"[TASK-ACTION] Restarting task {task_id}")
        task = Task.query.get(task_id)
        if task:
            task.status = TaskStatus.pending
            task.current_iteration = 0
            task.error_message = None
            db.session.commit()
            print(f"[TASK-ACTION] Task {task_id} reset to pending")
            execute_task(task_id)
        else:
            print(f"[TASK-ACTION] Task {task_id} not found")

    elif action == 'stop' and task_id:
        print(f"[TASK-ACTION] Stopping task {task_id}")
        task = Task.query.get(task_id)
        if task:
            task.status = TaskStatus.pending
            task.cancel_requested = True
            task.error_message = 'Execution stopped by user'
            db.session.commit()
            print(f"[TASK-ACTION] Task {task_id} stopped")
        else:
            print(f"[TASK-ACTION] Task {task_id} not found")

    elif action == 'delete' and task_id:
        print(f"[TASK-ACTION] Deleting task {task_id}")
        task = Task.query.get(task_id)
        if task:
            db.session.delete(task)
            db.session.commit()
            print(f"[TASK-ACTION] Task {task_id} deleted")
        else:
            print(f"[TASK-ACTION] Task {task_id} not found")

    print("[TASK-ACTION] Redirecting to index")
    return redirect(url_for('web.index'))


@web.route('/generate-idea', methods=['POST'])
# @require_bearer
def generate_idea_form():
    """Generate idea from form"""
    print("[GENERATE-IDEA] Form submitted", flush=True)
    prompt = request.form.get('prompt', '')
    print(f"[GENERATE-IDEA] prompt={prompt[:50]}...", flush=True)

    if not prompt:
        print("[GENERATE-IDEA] No prompt provided, redirecting", flush=True)
        return redirect(url_for('web.index'))

    try:
        print("[GENERATE-IDEA] Calling LLM service", flush=True)
        llm  = ClaudeLLMService()
        idea = llm.generate_idea(prompt)
        print(f"[GENERATE-IDEA] Idea generated: {len(idea)} chars", flush=True)

        patient_session = PatientSession.query.order_by(PatientSession.last_accessed.desc()).first()
        patient_data = {'patient_data_summary': patient_session.patient_data} if patient_session else None
        tasks = _load_tasks()

        return render_template('index.html',
            patient_data=patient_data,
            pending_tasks=tasks['pending'],
            running_tasks=tasks['running'],
            reviewing_tasks=tasks['reviewing'],
            completed_tasks=tasks['completed'],
            failed_tasks=tasks['failed'],
            generated_idea=idea,
            idea_prompt=prompt,
            show_idea_view=True
        )

    except Exception as e:
        print(f"[GENERATE-IDEA] ERROR: {e}", flush=True)
        logger.error(f"Error generating idea: {e}")
        return redirect(url_for('web.index'))


@web.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    from flask import send_from_directory
    return send_from_directory('static', filename)


@web.route('/generated_apps/<path:filename>')
def serve_generated(filename):
    """Serve generated app files"""
    from flask import send_from_directory
    from utils.helpers import OUTPUT_FOLDER
    return send_from_directory(OUTPUT_FOLDER, filename)
