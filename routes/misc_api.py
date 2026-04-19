import logging
import threading
import uuid

from flask import Blueprint, request, jsonify, make_response, current_app
from models import TaskLog
from llm_service import check_llm_available
from services.patient_context_service import load_patient_context
from utils.helpers import get_fhir_context_from_cookies
from utils.auth import require_bearer

logger = logging.getLogger(__name__)
misc_api = Blueprint('misc_api', __name__)
_refresh_jobs = {}
_refresh_lock = threading.Lock()


def _run_refresh_job(app, refresh_id, patient_id, fhir_base_url, access_token):
    with app.app_context():
        try:
            print(f"[REFRESH] Starting refresh job {refresh_id} for patient_id={patient_id}", flush=True)
            context = load_patient_context(
                patient_id=patient_id,
                fhir_base_url=fhir_base_url,
                access_token=access_token,
                refresh=True,
            )
            _refresh_jobs[refresh_id] = {
                'status': 'completed',
                'message': 'Patient context refresh completed',
                'session_id': context.session.id,
                'patient_name': context.patient_name,
            }
            print(f"[REFRESH] Completed refresh job {refresh_id}", flush=True)
        except Exception as e:
            logger.error(f"Patient context refresh failed: {e}", exc_info=True)
            _refresh_jobs[refresh_id] = {
                'status': 'failed',
                'message': 'Patient context refresh failed',
                'error': str(e),
            }

@misc_api.route('/api/options', methods=['OPTIONS'])
def cors_options():
    """Handle OPTIONS preflight requests"""
    response = make_response()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Patient-Id,X-FHIR-Base')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response


@misc_api.route('/api/health')
def health_check():
    """Health check endpoint"""
    print("[HEALTH] Health check requested")
    llm_info = check_llm_available()
    print(f"[HEALTH] LLM available: {llm_info['available']}")
    return jsonify({'status': 'healthy', 'version': '1.0.0', 'llm_info': llm_info})


@misc_api.route('/api/debug/session')
@require_bearer
def debug_session():
    """Debug endpoint to check session data"""
    from flutter_session import flutter_session
    session_id = request.cookies.get('flutter_session_id')

    if not session_id:
        return jsonify({'error': 'No session found'}), 404

    session_data = flutter_session.get_session(session_id)
    if not session_data:
        return jsonify({'error': 'Session expired or invalid'}), 404

    return jsonify({
        'session_id':       session_id,
        'patient_id':       session_data.get('patient_id'),
        'patient_name':     session_data.get('patient_name'),
        'fhir_base_url':    session_data.get('fhir_base_url'),
        'has_patient_data': 'patient_data' in session_data,
        'patient_data_keys': list(session_data.get('patient_data', {}).keys()) if session_data.get('patient_data') else [],
        'patient_info':     session_data.get('patient_data', {}).get('patient') if session_data.get('patient_data') else None,
    })


@misc_api.route('/api/status')
@require_bearer
def get_status():
    """Get application status"""
    print(f"[DEBUG] GET /api/status - checking status")
    llm_info     = check_llm_available()
    fhir_context = get_fhir_context_from_cookies()
    print(f"[DEBUG] GET /api/status - fhir_configured={bool(fhir_context.get('fhir_base_url'))}, patient_id={fhir_context.get('patient_id')}")
    return jsonify({
        'llm_available':  llm_info['available'],
        'llm_info':       llm_info,
        'fhir_configured': bool(fhir_context.get('fhir_base_url')),
        'patient_id':     fhir_context.get('patient_id'),
        'patient_name':   fhir_context.get('patient_name'),
    })


@misc_api.route('/api/logs', methods=['GET'])
@require_bearer
def get_all_logs():
    """Get all logs"""
    logs = TaskLog.query.order_by(TaskLog.created_at.desc()).limit(100).all()
    return jsonify([log.to_dict() for log in logs])



@misc_api.route('/api/clear-patient-data', methods=['POST'])
@require_bearer
def clear_patient_data():
    """Clear patient data from cookies"""
    response = make_response(jsonify({'message': 'Patient data cleared'}))
    response.delete_cookie('fhir_base_url')
    response.delete_cookie('patient_id')
    response.delete_cookie('fhir_token')
    response.delete_cookie('patient_name')
    response.delete_cookie('patient_data')
    return response


@misc_api.route('/api/refresh-patient-context', methods=['POST'])
@require_bearer
def refresh_patient_context():
    with _refresh_lock:
        for refresh_id, job in _refresh_jobs.items():
            if job.get('status') == 'running':
                print(f"[REFRESH] Refresh already running: {refresh_id}", flush=True)
                return jsonify({
                    'status': 'running',
                    'refresh_id': refresh_id,
                    'message': 'Patient context refresh already in progress',
                }), 202

    data = request.get_json(silent=True) or {}
    access_token = data.get('accessToken')
    fhir_base_url = data.get('fhirBaseUrl')
    patient_id = data.get('patientId')
    print(f"[REFRESH] Request received for patient_id={patient_id}, fhir_base_url={fhir_base_url}", flush=True)
    if not all([access_token, fhir_base_url, patient_id]):
        print("[REFRESH] Missing required fields", flush=True)
        return jsonify({'error': 'Missing required fields'}), 400

    with _refresh_lock:

        refresh_id = str(uuid.uuid4())
        _refresh_jobs[refresh_id] = {
            'status': 'running',
            'message': 'Patient context refresh in progress',
            'patient_id': patient_id,
            'fhir_base_url': fhir_base_url,
        }
    print(f"[REFRESH] Queued refresh job {refresh_id}", flush=True)
    app = current_app._get_current_object()
    threading.Thread(
        target=_run_refresh_job,
        args=(app, refresh_id, patient_id, fhir_base_url, access_token),
        daemon=True,
    ).start()
    return jsonify({'status': 'running', 'refresh_id': refresh_id, 'message': 'Patient context refresh started'}), 202


@misc_api.route('/api/refresh-patient-context/status/<refresh_id>', methods=['GET'])
@require_bearer
def refresh_patient_context_status(refresh_id):
    job = _refresh_jobs.get(refresh_id)
    if not job:
        print(f"[REFRESH] Status requested for unknown job {refresh_id}", flush=True)
        return jsonify({'error': 'Refresh job not found'}), 404
    print(f"[REFRESH] Status for job {refresh_id}: {job.get('status')}", flush=True)
    return jsonify(job)
