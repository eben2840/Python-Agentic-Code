import sys
import logging
from datetime import datetime

from flask import Blueprint, render_template, request, redirect, url_for, make_response

from models import db, Task, TaskStatus, TaskComplexity, PatientSession
from llm_service import ClaudeLLMService
from services.patient_context_service import load_latest_patient_session, load_patient_context
from utils.helpers import add_task_log
from utils.auth import require_bearer
from services.executor import execute_task

logger = logging.getLogger(__name__)
web = Blueprint('web', __name__)


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

def _load_tasks() -> dict:
    """Load all tasks grouped by status."""
    return {
        'pending':   Task.query.filter_by(status=TaskStatus.pending).order_by(Task.updated_at.desc()).all(),
        'running':   Task.query.filter(Task.status.in_([TaskStatus.planning, TaskStatus.executing, TaskStatus.fixing])).order_by(Task.updated_at.desc()).all(),
        'reviewing': Task.query.filter_by(status=TaskStatus.reviewing).order_by(Task.updated_at.desc()).all(),
        'completed': Task.query.filter_by(status=TaskStatus.completed).order_by(Task.completed_at.desc()).all(),
        'failed':    Task.query.filter_by(status=TaskStatus.failed).order_by(Task.updated_at.desc()).all(),
    }

  
    # """Handle POST / when Flutter headers are present."""
def _handle_flutter_init():
    print("[INDEX] POST request - checking Flutter headers", flush=True)
    auth_header   = request.headers.get('Authorization', '')
    patient_id    = request.headers.get('X-Patient-Id', '')
    fhir_base_url = request.headers.get('X-FHIR-Base', '')
    print(f"[INDEX] Headers: auth={bool(auth_header)}, patient_id={patient_id}, fhir_base={fhir_base_url}", flush=True)

    if not all([auth_header, patient_id, fhir_base_url]):
        return _render_dashboard()

    print("[INDEX] All headers present, processing Flutter integration", flush=True)
    access_token = auth_header.replace('Bearer ', '') if auth_header.startswith('Bearer ') else auth_header

    try:
        context = load_patient_context(
            patient_id=patient_id,
            fhir_base_url=fhir_base_url,
            access_token=access_token,
        )
        patient_session = context.session
        patient_data = context.patient_data
        patient_name = context.patient_name
        session_id = patient_session.id
        source = "cached" if context.reused else "fresh"
        print(f"[INDEX] Patient data ready from {source} session {session_id}", flush=True)

        tasks = _load_tasks()
        print(f"[INDEX] Tasks loaded: pending={len(tasks['pending'])}, running={len(tasks['running'])}, completed={len(tasks['completed'])}", flush=True)

        response = make_response(render_template('index.html',
            patient_data={'patient_data_summary': patient_data},
            patient_name=patient_name,
            pending_tasks=tasks['pending'],
            running_tasks=tasks['running'],
            reviewing_tasks=tasks['reviewing'],
            completed_tasks=tasks['completed'],
            failed_tasks=tasks['failed'],
            session_id=session_id,
            fhir_base_url=fhir_base_url,
            patient_id=patient_id,
            auth_token=access_token
        ))
        print(f"[INDEX] Response prepared", flush=True)
        print(f"{'='*60}\n", flush=True)
        return response

    except Exception as e:
        print(f"[INDEX] ERROR processing Flutter data: {e}", flush=True)
        import traceback
        traceback.print_exc()
        logger.error(f"Error processing Flutter data: {e}")
        return _render_dashboard()


    # """Render the main dashboard for GET requests."""
def _render_dashboard():
    print("[INDEX] GET request - loading dashboard", flush=True)
    patient_session = load_latest_patient_session()
    patient_data = session_id = fhir_base_url = patient_id = auth_token = None

    if patient_session:
        session_id    = patient_session.id
        patient_data  = {'patient_data_summary': patient_session.patient_data}
        fhir_base_url = patient_session.fhir_base_url
        patient_id    = patient_session.patient_id
        auth_token    = patient_session.auth_token
        patient_session.last_accessed = datetime.utcnow()
        db.session.commit()
        print(f"[INDEX] Loaded session from DB: {patient_session.patient_name}", flush=True)
    else:
        print("[INDEX] No patient sessions found in DB", flush=True)

    tasks = _load_tasks()
    print(f"[INDEX] Tasks: pending={len(tasks['pending'])}, running={len(tasks['running'])}, reviewing={len(tasks['reviewing'])}, completed={len(tasks['completed'])}, failed={len(tasks['failed'])}", flush=True)

    print("[INDEX] Rendering template...", flush=True)
    result = render_template('index.html',
        patient_data=patient_data,
        patient_name=patient_session.patient_name if patient_session else None,
        pending_tasks=tasks['pending'],
        running_tasks=tasks['running'],
        reviewing_tasks=tasks['reviewing'],
        completed_tasks=tasks['completed'],
        failed_tasks=tasks['failed'],
        session_id=session_id,
        fhir_base_url=fhir_base_url,
        patient_id=patient_id,
        auth_token=auth_token
    )
    print(f"[INDEX] Template rendered successfully ({len(result)} bytes)", flush=True)
    print(f"{'='*60}\n", flush=True)
    return result


# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------

@web.route('/test')
def test():
    print("[TEST] Test route accessed")
    return "<h1>Test Page Works!</h1>"


@web.route('/', methods=['GET', 'POST'])
# @require_bearer
def index():
    """Main dashboard page"""
    print(f"\n{'='*60}", flush=True)
    print(f"[INDEX] {request.method} request to / from {request.remote_addr}", flush=True)
    print(f"[INDEX] Cookies: {list(request.cookies.keys())}", flush=True)
    print(f"{'='*60}", flush=True)
    sys.stdout.flush()

    if request.method == 'POST':
        return _handle_flutter_init()
    return _render_dashboard()


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
@require_bearer
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
