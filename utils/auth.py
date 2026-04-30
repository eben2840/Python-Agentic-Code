from functools import wraps
import os
from flask import make_response, request, render_template, jsonify
import requests as http_requests
from models import PatientSession
from services.patient_context_service import load_latest_patient_session
from services.patient_context_service import load_patient_context



SESSION_COOKIE_MAX_AGE = 8 * 60 * 60

def _bearer_token() -> str:
    auth_header = request.headers.get('Authorization', '')
    parts = auth_header.split(None, 1)
    print(f"[AUTH:_bearer_token] raw header={auth_header[:30]!r} parts_count={len(parts)}", flush=True)
    if len(parts) == 2 and parts[0].lower() == 'bearer':
        token = parts[1].strip()
        print(f"[AUTH:_bearer_token] extracted token present={bool(token)} len={len(token)}", flush=True)
        return token
    print(f"[AUTH:_bearer_token] no bearer token found", flush=True)
    return ''


def _request_access_token() -> str:
    bearer = _bearer_token()
    result = bearer
    source = 'bearer' if bearer else 'NONE'
    print(f"[AUTH:_request_access_token] bearer={bool(bearer)} cookie={bool(request.cookies.get('careit_session_id'))} using={source}", flush=True)
    return result


def _request_session_scope() -> dict:
    patient_id   = request.headers.get('X-Patient-Id')   or request.args.get('patient_id')   or request.cookies.get('patient_id')
    fhir_base    = request.headers.get('X-FHIR-Base')    or request.args.get('fhir_base_url') or request.cookies.get('fhir_base_url')
    access_token = _request_access_token()
    print(f"[AUTH:_request_session_scope] patient_id={patient_id!r} fhir_base={fhir_base!r} token_present={bool(access_token)}", flush=True)
    return {'patient_id': patient_id, 'fhir_base_url': fhir_base, 'access_token': access_token}


def get_request_patient_session():
    scope = _request_session_scope()
    print(f"[AUTH:get_request_patient_session] looking up DB session for patient_id={scope['patient_id']!r} fhir_base={scope['fhir_base_url']!r}", flush=True)
    if not (scope['patient_id'] and scope['fhir_base_url']):
        print(f"[AUTH:get_request_patient_session] DB result=NOT FOUND — missing patient_id or fhir_base", flush=True)
        return None
    session = load_latest_patient_session(
        patient_id=scope['patient_id'],
        fhir_base_url=scope['fhir_base_url'],
        access_token=scope['access_token'] or None,
    )
    print(f"[AUTH:get_request_patient_session] DB result={'FOUND patient=' + str(session.patient_id) if session else 'NOT FOUND'}", flush=True)
    return session


def _init_patient_session(access_token: str) -> None:
    scope = _request_session_scope()
    patient_id = scope['patient_id']
    fhir_base_url = scope['fhir_base_url']
    print(f"[AUTH:_init_patient_session] patient_id={patient_id!r} fhir_base={fhir_base_url!r} token_present={bool(access_token)}", flush=True)
    if not (patient_id and fhir_base_url and access_token):
        print(f"[AUTH:_init_patient_session] SKIPPED — missing patient_id={bool(patient_id)} fhir_base={bool(fhir_base_url)} token={bool(access_token)}", flush=True)
        return
    print(f"[AUTH:_init_patient_session] calling load_patient_context refresh=False", flush=True)
    result = load_patient_context(
        patient_id=patient_id,
        fhir_base_url=fhir_base_url,
        access_token=access_token,
    )
    print(f"[AUTH:_init_patient_session] done — reused={result.reused if result else 'N/A'} patient_name={result.patient_name if result else 'N/A'}", flush=True)
    return result.session if result else None


def _deny_access():
    if request.path.startswith('/api/') or request.path.startswith('/careit-web/'):
        return jsonify({'error': 'Unauthorized'}), 401
    return render_template('unauthorized.html'), 403


def require_bearer(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        access_token = _request_access_token()
        token = request.headers.get('Authorization', '')
        headers = dict(request.headers)
        if 'Authorization' in headers:
            headers['Authorization'] = 'Bearer ***' if _bearer_token() else '***'
        print(f"[AUTH] {request.method} {request.path} — headers: {headers}", flush=True)
        print(f"[AUTH] cookies present: {list(request.cookies.keys())}", flush=True)
        print(f"[AUTH] access_token_present={bool(access_token)} bearer_present={bool(_bearer_token())}", flush=True)
        if _bearer_token():
            print(f"[AUTH] path=BEARER — calling _init_patient_session", flush=True)
            session = _init_patient_session(access_token)
            response = make_response(f(*args, **kwargs))
            patient_id = request.headers.get('X-Patient-Id', '')
            fhir_base_url = request.headers.get('X-FHIR-Base', '')
            if session:
                response.set_cookie('careit_session_id', session.id, httponly=True, secure=request.is_secure, samesite='Lax', max_age=SESSION_COOKIE_MAX_AGE,)  # 8 hours
            if patient_id:
                response.set_cookie('patient_id', patient_id, httponly=True, secure=request.is_secure, samesite='Lax',max_age=SESSION_COOKIE_MAX_AGE,)
            if fhir_base_url:
                response.set_cookie('fhir_base_url', fhir_base_url, httponly=True, secure=request.is_secure, samesite='Lax', max_age=SESSION_COOKIE_MAX_AGE,)
            print(f"[AUTH] cookies SET on response: careit_session_id={bool(session)} patient_id={bool(patient_id)} fhir_base_url={bool(fhir_base_url)}", flush=True)
            return response
        session_id = request.cookies.get('careit_session_id')
        if session_id:
            scope = _request_session_scope()
            existing_session = PatientSession.query.get(session_id)
            if existing_session and existing_session.patient_id == scope['patient_id'] and existing_session.fhir_base_url == scope['fhir_base_url']:
                print(f"[AUTH] path=COOKIE — matching session found for patient_id={existing_session.patient_id}, skipping init", flush=True)
                return f(*args, **kwargs)
            print(f"[AUTH] DENIED {request.path} — careit_session_id cookie did not match a scoped session", flush=True)
            return _deny_access()
        reason = "Authorization header is Bearer with no token" if token.lower().startswith('bearer') else "no Bearer token and no careit_session_id cookie"
        print(f"[AUTH] DENIED {request.path} — {reason}", flush=True)
        return _deny_access()
    return decorated



def _validate_basic_with_cdr(auth_header: str) -> bool:
    """Forward the Basic Auth header to Smile CDR /metadata to validate credentials."""
    try:
        cdr_url = (os.getenv('CAREIT_BASE_URL') or '').rstrip('/')
        resp = http_requests.get(
            f"{cdr_url}/metadata",
            headers={'Authorization': auth_header},
            timeout=5
        )
        return resp.status_code == 200
    except Exception:
        return False


def validate_careit_admin_login(username: str, password: str) -> bool:
    return username == os.getenv('CAREIT_USERNAME') and password == os.getenv('CAREIT_PASSWORD')


def require_bearer_or_basic(f):
    """Accept Bearer token, fhir_token cookie, OR Smile CDR basic auth."""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get('Authorization', '')
        if _bearer_token():
            _init_patient_session(_bearer_token())
            return f(*args, **kwargs)
        session_id = request.cookies.get('careit_session_id')
        session = PatientSession.query.get(session_id) if session_id else None
        scope = _request_session_scope()
        if session and session.patient_id == scope['patient_id'] and session.fhir_base_url == scope['fhir_base_url']:
            return f(*args, **kwargs)
        if auth.startswith('Basic ') and _validate_basic_with_cdr(auth):
            return f(*args, **kwargs)
        return _deny_access()
    return decorated
