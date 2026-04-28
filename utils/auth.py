import logging
from functools import wraps
from flask import make_response, request, render_template, jsonify
import requests as http_requests

logger = logging.getLogger(__name__)


def _deny_access():
    if request.path.startswith('/api/') or request.path.startswith('/careit-web/'):
        return jsonify({'error': 'Unauthorized'}), 401
    return render_template('unauthorized.html'), 403


def _init_patient_session(access_token):
    patient_id    = request.headers.get('X-Patient-Id', '')
    fhir_base_url = request.headers.get('X-FHIR-Base', '')
    if not (patient_id and fhir_base_url):
        return
    try:
        from services.patient_context_service import load_patient_context
        load_patient_context(patient_id=patient_id, fhir_base_url=fhir_base_url, access_token=access_token, refresh=True)
    except Exception as e:
        logger.error(f"Flutter init error: {e}")


def require_bearer(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '')
        if token.startswith('Bearer '):
            access_token = token[7:]
            _init_patient_session(access_token)
            response = make_response(f(*args, **kwargs))
            response.set_cookie('fhir_token', access_token, samesite='Lax')
            return response
        if request.cookies.get('fhir_token'):
            return f(*args, **kwargs)
        return _deny_access()
    return decorated


def _validate_basic_with_cdr(auth_header: str) -> bool:
    """Forward the Basic Auth header to Smile CDR /metadata to validate credentials."""
    try:
        from models import PatientSession
        session = PatientSession.query.order_by(
            PatientSession.last_accessed.desc()
        ).first()
        if not session or not session.fhir_base_url:
            return False
        cdr_url = session.fhir_base_url.rstrip('/')
        resp = http_requests.get(
            f"{cdr_url}/metadata",
            headers={'Authorization': auth_header},
            timeout=5
        )
        return resp.status_code == 200
    except Exception:
        return False


def require_bearer_or_basic(f):
    """Accept Bearer token, fhir_token cookie, OR Smile CDR basic auth."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        if auth.startswith('Bearer '):
            return f(*args, **kwargs)
        if request.cookies.get('fhir_token'):
            return f(*args, **kwargs)
        if auth.startswith('Basic ') and _validate_basic_with_cdr(auth):
            return f(*args, **kwargs)
        return _deny_access()
    return decorated
