from functools import wraps
from flask import request, render_template, jsonify


def _deny_access():
    if request.path.startswith('/api/'):
        return jsonify({'error': 'Unauthorized'}), 401
    return render_template('unauthorized.html'), 403


def require_bearer(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '')
        if token.startswith('Bearer '):
            return f(*args, **kwargs)
        return _deny_access()
    return decorated
