from functools import wraps
from flask import request, render_template, jsonify
import requests as http_requests


def _deny_access():
    if request.path.startswith('/api/') or request.path.startswith('/careit-web/'):
        return jsonify({'error': 'Unauthorized'}), 401
    return render_template('unauthorized.html'), 403


def require_bearer(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '')
        if token.startswith('Bearer '):
            return f(*args, **kwargs)
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
