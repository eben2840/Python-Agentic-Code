from string import Template
import uuid
import json
import logging
import threading

from flask import Blueprint, request, jsonify, url_for, current_app

from models import db, Task, TaskStatus, TaskComplexity, PatientSession, TaskLog
from services.patient_context_service import load_patient_context
from utils.helpers import add_task_log
from utils.auth import require_bearer, require_bearer_or_basic
from services.executor import run_generation
from llm_service import _PROMPTS_DIR, ClaudeLLMService

logger = logging.getLogger(__name__)

quick_generate = Blueprint('quick_generate', __name__, url_prefix='/api/quick')


def _load_prompt(filename: str, **kwargs) -> str:
    raw = (_PROMPTS_DIR / filename).read_text(encoding="utf-8")
    return Template(raw).safe_substitute(**kwargs)

def _build_extraction_system() -> str:
    prompt_files = [
        "extraction/extraction_base.md",
        "extraction/extraction_vitals.md",
        "extraction/extraction_medications.md",
        "extraction/extraction_interventions.md",
        "extraction/extraction_observations.md",
    ]
    return "\n\n".join(_load_prompt(filename).strip() for filename in prompt_files)


@quick_generate.route('/extract', methods=['POST'])
@require_bearer
def extract_transcript():
    data       = request.get_json()
    transcript = (data.get('transcript') or '').strip()

    if not transcript:
        return jsonify({'status': 'error', 'error': 'transcript is required'}), 400
    
    _EXTRACTION_SYSTEM = _build_extraction_system()

    llm      = ClaudeLLMService()
    response = llm.client.messages.create(
        model=llm.model,
        max_tokens=1024,
        system=_EXTRACTION_SYSTEM,
        messages=[{"role": "user", "content": transcript}]
    )
    extracted = json.loads(response.content[0].text.strip())
    print("Extracted data:===============================", extracted)
    print("Extracted data:", extracted)
    payload = {
    'status': 'ok',
    'extracted': extracted,
    'empty': not any(extracted.values()),
    'transcript': transcript
        }
    print("extract response payload:", payload)
    return jsonify(payload)

    # return jsonify({'status': 'ok', 'extracted': extracted, 'empty': not any(extracted.values()), 'transcript': transcript})





# cristian extraction model for backend testing, 
@quick_generate.route('/v1/extract/', methods=['POST'])
@require_bearer_or_basic
def extract_transcript_careit_voice():
    data       = request.get_json()
    transcript = (data.get('transcript') or '').strip()

    if not transcript:
        return jsonify({'status': 'error', 'error': 'transcript is required'}), 400
    
    _EXTRACTION_SYSTEM = _build_extraction_system()

    llm      = ClaudeLLMService()
    response = llm.client.messages.create(
        model=llm.model,
        max_tokens=1024,
        system=_EXTRACTION_SYSTEM,
        messages=[{"role": "user", "content": transcript}]
    )
    extracted = json.loads(response.content[0].text.strip())
    print("Extracted data:===============================", extracted)
    print("Extracted data:", extracted)
    payload = {
    'extracted': extracted,
    'empty': not any(extracted.values()),
    'transcript': transcript,
    'code': 200,
    'message': 'Data extracted'
        }
    print("extract response payload:", payload)
    return jsonify(payload)



@quick_generate.route('/generate', methods=['POST'])
@require_bearer
def generate_miniapp():
    """
    POST /api/quick/generate
    Body: { prompt, accessToken, fhirBaseUrl, patientId }
    Returns 202 immediately with task_id. Poll /status/{task_id} for progress.
    this generate the mini app from the old context, only from the old context
    this is done with all in the form
    """
    try:
        data          = request.get_json()
        prompt        = data.get('prompt')
        access_token  = data.get('accessToken')
        fhir_base_url = data.get('fhirBaseUrl')
        patient_id    = data.get('patientId')

        if not all([prompt, access_token, fhir_base_url, patient_id]):
            return jsonify({'status': 'error', 'error': 'Missing required fields'}), 400

        refresh = bool(data.get('refresh'))
        context = load_patient_context(
            patient_id=patient_id,
            fhir_base_url=fhir_base_url,
            access_token=access_token,
            refresh=refresh,
        )
        patient_session = context.session
        patient_data = context.patient_data
        patient_name = context.patient_name
        logger.info("[QUICK-GENERATE] Patient context loaded from %s session %s", "cache" if context.reused else "fresh", patient_session.id)

        task_id = str(uuid.uuid4())
        task = Task(
            id=task_id,
            title=prompt[:100],
            description=prompt,
            complexity=TaskComplexity.standard,
            status=TaskStatus.planning,
            patient_id=patient_id,
            fhir_base_url=fhir_base_url,
            patient_data=patient_data
        )
        db.session.add(task)
        db.session.commit()
        add_task_log(task_id, "Task created, starting generation...")

        app = current_app._get_current_object()
        threading.Thread(
            target=run_generation,
            args=(app, task_id, prompt, patient_data, patient_name)
        ).start()

        return jsonify({
            'status':       'processing',
            'task_id':      task_id,
            'status_url':   url_for('quick_generate.get_task_status', task_id=task_id, _external=True),
            'patient_name': patient_name,
            'message':      'Task started. Poll status_url for progress.',
        }), 202

    except Exception as e:
        logger.error(f"[QUICK-GENERATE] Error: {e}", exc_info=True)
        return jsonify({'status': 'error', 'error': str(e)}), 500


@quick_generate.route('/summary', methods=['POST'])
@require_bearer
def generate_summary():
    """POST /api/quick/summary — same as /generate, used for shift handover summaries."""
    return generate_miniapp()


@quick_generate.route('/status/<task_id>', methods=['GET'])
@require_bearer
def get_task_status(task_id):
    """GET /api/quick/status/{task_id}"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'status': 'error', 'error': 'Task not found'}), 404

    logs = TaskLog.query.filter_by(task_id=task_id).order_by(TaskLog.created_at.asc()).all()
    response = {
        'task_id':      task_id,
        'status':       task.status.value,
        'title':        task.title,
        'description':  task.description,
        'score':        task.final_score,
        'error':        task.error_message,
        'plan':         task.plan,
        'activity': [
            {
                'message':   log.message,
                'level':     log.level,
                'timestamp': log.created_at.isoformat() if log.created_at else None,
            }
            for log in logs
        ],
        'created_at':   task.created_at.isoformat() if task.created_at else None,
        'completed_at': task.completed_at.isoformat() if task.completed_at else None,
    }

    if task.status == TaskStatus.completed:
        response['app_url'] = url_for('mini_apps.mini_app_preview', task_id=task_id, _external=True)
        response['raw_url'] = url_for('mini_apps.mini_app_raw',     task_id=task_id, _external=True)

    return jsonify(response)
