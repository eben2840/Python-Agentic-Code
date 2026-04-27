from string import Template
import uuid
import json
import logging
import threading

from flask import Blueprint, request, jsonify, url_for, current_app

from models import db, Task, TaskStatus, TaskComplexity, TaskLog
from direct_fhir import get_patient_data_direct
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
    manifest = json.loads((_PROMPTS_DIR / "extraction" / "index.json").read_text(encoding="utf-8"))
    prompt_files = [f"extraction/{name}" for name in manifest.get("files", [])]
    return "\n\n".join(_load_prompt(filename).strip() for filename in prompt_files)


def _parse_json_response(raw: str):
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.rstrip("`").strip()

    if text:
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

    start = min([idx for idx in (text.find('{'), text.find('[')) if idx != -1], default=-1)
    if start == -1:
        raise ValueError("Model did not return JSON content")

    decoder = json.JSONDecoder()
    payload, _ = decoder.raw_decode(text[start:])
    return payload


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
    extracted = _parse_json_response(response.content[0].text)
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





# cristian extraction model for backend testing,
@quick_generate.route('/questionnaire/v1', methods=['POST'])
@require_bearer_or_basic
def extract_questionnaire():
    data          = request.get_json()
    transcript    = (data.get('transcript') or '').strip()
    questionnaire = (data.get('questionnaire') or '').strip()

    if not transcript:
        return jsonify({'status': 'error', 'error': 'transcript is required'}), 400
    if not questionnaire:
        return jsonify({'status': 'error', 'error': 'questionnaire is required'}), 400

    system = _load_prompt(
        'extraction/extraction_questionnaire.md',
        transcription=transcript,
        itemsDescription=questionnaire,
    )
  
    llm      = ClaudeLLMService()
    response = llm.client.messages.create(
        model=llm.model,
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": transcript}]
    )

    raw = response.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```", 2)[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.rstrip("`").strip()
    questionnaire = json.loads(raw)
    return jsonify({'status': 'ok', 'questionnaire': questionnaire, 'transcript': transcript,'code': 200, 'message': 'Questionnaire extracted'})



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
    extracted = _parse_json_response(response.content[0].text)
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
    try:
        data          = request.get_json()
        prompt        = data.get('prompt')
        access_token  = data.get('accessToken')
        fhir_base_url = data.get('fhirBaseUrl')
        patient_id    = data.get('patientId')

        print(
            "[QUICK-GENERATE][REQUEST] "
            f"patient_id={patient_id!r} "
            f"type={type(patient_id).__name__} "
            f"fhir_base_url={fhir_base_url!r} "
            f"access_token={access_token}",
            flush=True,
        )

        if not all([prompt, access_token, fhir_base_url, patient_id]):
            return jsonify({'status': 'error', 'error': 'Missing required fields'}), 400

        patient_data = None
        patient_name = 'All Patients' if patient_id == 'all' else f"Patient {patient_id}"
        if patient_id != 'all':
            patient_data = get_patient_data_direct({
                'fhir_base_url': fhir_base_url,
                'patient_id': patient_id,
                'auth_token': access_token,
            })
            patient_name = patient_data.get('patient', {}).get('name') or patient_name
            logger.info("[QUICK-GENERATE] Patient context loaded directly for patient %s", patient_id)

        task_id = str(uuid.uuid4())
        task = Task(
            id=task_id,
            title=prompt[:100],
            description=prompt,
            complexity=TaskComplexity.standard,
            status=TaskStatus.planning,
            patient_id=patient_id,
            fhir_base_url=fhir_base_url,
            patient_data=patient_data,
        )
        db.session.add(task)
        db.session.commit()
        add_task_log(task_id, "Task created, starting generation...")

        threading.Thread(
            target=run_generation,
            args=(
                current_app._get_current_object(),
                task_id,
                prompt,
                patient_id,
                fhir_base_url,
                access_token,
            ),
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
