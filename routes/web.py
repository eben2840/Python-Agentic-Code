import logging
import threading
import uuid
from datetime import datetime

from flask import Blueprint, render_template, request, flash, redirect, url_for, send_from_directory, current_app
from llm.helpers import PROVIDER_MODELS, get_selected_llm
from models import db, Task, TaskStatus, TaskComplexity
from llm_service import ClaudeLLMService
from services.executor import execute_task
from utils.auth import require_bearer, get_request_patient_session
from utils.helpers import OUTPUT_FOLDER, add_task_log

logger = logging.getLogger(__name__)
web = Blueprint('web', __name__)


def _execute_task_in_context(app, task_id):
    with app.app_context():
        execute_task(task_id)


def _load_tasks() -> dict:
    return {
        'pending':   Task.query.filter_by(status=TaskStatus.pending).order_by(Task.updated_at.desc()).all(),
        'running':   Task.query.filter(Task.status.in_([TaskStatus.planning, TaskStatus.executing, TaskStatus.fixing])).order_by(Task.updated_at.desc()).all(),
        'reviewing': Task.query.filter_by(status=TaskStatus.reviewing).order_by(Task.updated_at.desc()).all(),
        'completed': Task.query.filter_by(status=TaskStatus.completed).order_by(Task.completed_at.desc()).all(),
        'failed':    Task.query.filter_by(status=TaskStatus.failed).order_by(Task.updated_at.desc()).all(),
    }


def _render_dashboard():
    session = get_request_patient_session()
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


@web.route('/generate-idea', methods=['POST'])
# @require_bearer
def generate_idea_form():
    prompt = request.form.get('prompt' or '').strip()
    if not prompt:
        flash('Please enter a prompt to generate an idea.', 'error')
        print("No prompt provided for idea generation.")    
        return redirect(url_for('web.generate'))
    try:
        llm  = ClaudeLLMService()
        idea = llm.generate_idea(prompt)
        return render_template('generate.html', generated_idea=idea, idea_prompt=prompt)
    except Exception as e:
        logger.error(f"Error generating idea: {e}")
        return render_template('generate.html', error=str(e))


@web.route('/create-miniapp', methods=['POST'])
# @require_bearer
def create_miniapp_form():
    title = (request.form.get('title') or request.form.get('prompt') or 'SMART on FHIR Mini App').strip()
    description = (request.form.get('description') or request.form.get('prompt') or '').strip()
    specification = (request.form.get('specification') or '').strip()
    complexity_str = request.form.get('complexity', 'standard')
    complexity = TaskComplexity[complexity_str] if complexity_str in TaskComplexity.__members__ else TaskComplexity.standard

    if not title:
        flash('Task title is required', 'error')
        return redirect(request.referrer or url_for('web.generate'))

    patient_session = get_request_patient_session()
    if not patient_session:
        flash('No patient session found. Please connect to FHIR server and load patient data first.', 'error')
        return redirect(request.referrer or url_for('web.generate'))

    task_id = str(uuid.uuid4())
    task = Task(
        id=task_id,
        title=title[:500],
        description=description,
        specification=specification,
        complexity=complexity,
        status=TaskStatus.pending,
        patient_id=patient_session.patient_id,
        fhir_base_url=patient_session.fhir_base_url,
        patient_data=patient_session.patient_data,
    )
    db.session.add(task)
    db.session.commit()
    add_task_log(task_id, f"Task created: {title}. Starting generation.", 'info')

    app = current_app._get_current_object()
    threading.Thread(target=lambda: _execute_task_in_context(app, task_id), daemon=True).start()
    return redirect(url_for('web.index'))


@web.route('/generated_apps/<path:filename>')
def serve_generated(filename):
    return send_from_directory(OUTPUT_FOLDER, filename)




@web.route('/settings', methods=['GET', 'POST'])
@require_bearer
def llm_settings():
    if request.method == 'POST':
        provider = request.form.get('provider', 'anthropic')
        current_app.config['LLM_PROVIDER'] = provider
        current_app.config['LLM_MODEL'] = PROVIDER_MODELS[provider]
        get_selected_llm()

    selected_provider = current_app.config.get('LLM_PROVIDER', 'anthropic')
    return render_template(
        'setting.html',
        providers=PROVIDER_MODELS,
        selected_provider=selected_provider,
    )