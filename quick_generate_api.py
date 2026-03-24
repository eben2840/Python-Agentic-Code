import uuid
import json
import logging
import threading

from flask import Blueprint, request, jsonify, url_for, current_app

from models import db, Task, TaskStatus, TaskComplexity, PatientSession, TaskLog
from direct_fhir import get_patient_data_direct, get_all_patients_data_direct
from utils.helpers import add_task_log
from services.executor import run_generation
from llm_service import ClaudeLLMService

logger = logging.getLogger(__name__)

quick_generate = Blueprint('quick_generate', __name__, url_prefix='/api/quick')

_EXTRACTION_SYSTEM = """You are a clinical data extractor. You output JSON only — no explanation, no markdown, no code fences.

Given a nurse's voice transcript, extract any of the following:
- Vitals: blood pressure, heart rate, temperature, oxygen saturation, pain level
- Medications: name, dose, route, status (given/refused/held)
- Interventions: mobility assist, repositioning, meal assist, hygiene, toileting
- Observations: patient feeling, orientation

Respond with this exact JSON structure and nothing else:
{"vitals": [], "medications": [], "interventions": [], "observations": []....}

Example output:
{"vitals": [{"label": "Blood Pressure", "value": "120/80", "unit": "mmHg"}], "medications": [{"name": "Paracetamol", "dose": "500mg", "status": "given"}], "interventions": [], "observations": [{"label": "Patient Feeling", "value": "confused, disoriented"}] " and the rest"...}

If nothing is found for a category, return an empty array for that key."""


@quick_generate.route('/extract', methods=['POST'])
def extract_transcript():
    data       = request.get_json()
    transcript = (data.get('transcript') or '').strip()

    if not transcript:
        return jsonify({'status': 'error', 'error': 'transcript is required'}), 400

    llm      = ClaudeLLMService()
    response = llm.client.messages.create(
        model=llm.model,
        max_tokens=1024,
        system=_EXTRACTION_SYSTEM,
        messages=[{"role": "user", "content": transcript}]
    )
    extracted = json.loads(response.content[0].text.strip())
    print(extracted)
    print(extracted)
    return jsonify({'status': 'ok', 'extracted': extracted, 'empty': not any(extracted.values()), 'transcript': transcript})


@quick_generate.route('/generate', methods=['POST'])
def generate_miniapp():
    """
    POST /api/quick/generate
    Body: { prompt, accessToken, fhirBaseUrl, patientId }
    Returns 202 immediately with task_id. Poll /status/{task_id} for progress.
    """
    try:
        data          = request.get_json()
        prompt        = data.get('prompt')
        access_token  = data.get('accessToken')
        fhir_base_url = data.get('fhirBaseUrl')
        patient_id    = data.get('patientId')

        if not all([prompt, access_token, fhir_base_url, patient_id]):
            return jsonify({'status': 'error', 'error': 'Missing required fields'}), 400

        session_data = {'fhir_base_url': fhir_base_url, 'patient_id': patient_id, 'auth_token': access_token}

        if patient_id == 'all':
            patient_data = get_all_patients_data_direct(session_data)
            count        = patient_data.get('patient', {}).get('count', 0)
            patient_name = f"All Patients ({count} total)"
        else:
            patient_data = get_patient_data_direct(session_data)
            patient_name = patient_data.get('patient', {}).get('name') or f"Patient {patient_id}"

        session_id = str(uuid.uuid4())
        patient_session = PatientSession(
            id=session_id,
            patient_id=patient_id,
            patient_name=patient_name,
            fhir_base_url=fhir_base_url,
            auth_token=access_token,
            patient_data=patient_data
        )
        db.session.add(patient_session)
        db.session.commit()

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
def generate_summary():
    """POST /api/quick/summary — same as /generate, used for shift handover summaries."""
    return generate_miniapp()


@quick_generate.route('/status/<task_id>', methods=['GET'])
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

