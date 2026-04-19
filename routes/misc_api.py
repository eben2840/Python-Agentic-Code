import logging

from flask import Blueprint, request, jsonify, make_response
from models import TaskLog
from llm_service import check_llm_available
from utils.debug_console import DEBUG_LOG_PATH, read_debug_tail
from utils.helpers import get_fhir_context_from_cookies
from utils.auth import require_bearer

logger = logging.getLogger(__name__)
misc_api = Blueprint('misc_api', __name__)

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


@misc_api.route('/api/debug/console-logs', methods=['GET'])
# @require_bearer
def get_console_logs():
    limit = request.args.get('limit', default=1000, type=int)
    lines = read_debug_tail(limit)
    return jsonify({
        'path': DEBUG_LOG_PATH,
        'count': len(lines),
        'lines': lines,
    })


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
