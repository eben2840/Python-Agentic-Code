import logging
from datetime import datetime

from flask import Blueprint, render_template, request, flash, redirect, url_for, send_from_directory
from models import db, Task, TaskStatus
from llm_service import ClaudeLLMService
from services.patient_context_service import load_latest_patient_session
from utils.auth import require_bearer
from utils.helpers import OUTPUT_FOLDER

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
@require_bearer
def index():
    return _render_dashboard()


@web.route('/generate')
@require_bearer
def generate():
    return render_template('generate.html')


@web.route('/vibe-apps')
@require_bearer
def vibe_apps():
    return render_template('vibe_apps.html')


@web.route('/automation')
@require_bearer
def automation():
    return render_template('automation.html')


@web.route('/generate-idea', methods=['POST'])
def generate_idea_form():
    prompt = request.form.get('prompt', '').strip()
    if not prompt:
        return redirect(url_for('web.generate'))
    try:
        llm  = ClaudeLLMService()
        idea = llm.generate_idea(prompt)
        return render_template('generate.html', generated_idea=idea, idea_prompt=prompt)
    except Exception as e:
        logger.error(f"Error generating idea: {e}")
        return render_template('generate.html', error=str(e))


@web.route('/generated_apps/<path:filename>')
def serve_generated(filename):
    return send_from_directory(OUTPUT_FOLDER, filename)
