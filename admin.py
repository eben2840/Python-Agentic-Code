from functools import wraps

from flask import Blueprint, redirect, render_template, request, session, url_for
from utils.auth import validate_careit_admin_login

admin = Blueprint('admin', __name__)


def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if session.get('admin_authenticated'):
            return f(*args, **kwargs)
        return redirect(url_for('admin.login'))
    return decorated


@admin.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        if validate_careit_admin_login(request.form.get('username', ''), request.form.get('password', '')):
            session.clear()
            session['admin_authenticated'] = True
            return redirect(url_for('extraction.skills_page'))
        return render_template('login.html', error='Invalid login'), 401
    return render_template('login.html')


@admin.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('admin.login'))
