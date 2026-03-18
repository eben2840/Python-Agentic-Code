import os
import re
import json
import logging
import threading
import requests
from datetime import datetime
from urllib.parse import unquote

from flask import request
from models import db, Task, TaskLog, TaskStatus

WEBHOOK_URL = os.getenv('WEBHOOK_URL', '')

logger = logging.getLogger(__name__)

_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_FOLDER = os.path.join(_BASE_DIR, 'generated_apps')
os.makedirs(OUTPUT_FOLDER, exist_ok=True)


def time_ago(dt):
    """Convert datetime to human-readable time ago string"""
    if not dt:
        return 'Never'
    now = datetime.utcnow()
    diff = now - dt
    if diff.days > 365:
        return f"{diff.days // 365} year{'s' if diff.days // 365 > 1 else ''} ago"
    if diff.days > 30:
        return f"{diff.days // 30} month{'s' if diff.days // 30 > 1 else ''} ago"
    if diff.days > 0:
        return f"{diff.days} day{'s' if diff.days > 1 else ''} ago"
    if diff.seconds > 3600:
        return f"{diff.seconds // 3600} hour{'s' if diff.seconds // 3600 > 1 else ''} ago"
    if diff.seconds > 60:
        return f"{diff.seconds // 60} minute{'s' if diff.seconds // 60 > 1 else ''} ago"
    return 'Just now'


def get_fhir_context_from_cookies():
    """Extract FHIR context from cookies"""
    return {
        'fhir_base_url': request.cookies.get('fhir_base_url', ''),
        'patient_id':    request.cookies.get('patient_id', ''),
        'access_token':  request.cookies.get('fhir_token', ''),
        'patient_name':  request.cookies.get('patient_name', ''),
        'patient_data':  None,
    }


def get_patient_data_from_cookies():
    """Get patient data summary from cookies"""
    patient_data_str = request.cookies.get('patient_data', '')
    if patient_data_str:
        try:
            return json.loads(unquote(patient_data_str))
        except Exception:
            pass
    return None


def save_generated_files(task_id: str, html: str, css: str, js: str) -> dict:
    """Save generated files to output folder"""
    task_folder = os.path.join(OUTPUT_FOLDER, task_id)
    os.makedirs(task_folder, exist_ok=True)
    files = {}
    if html:
        html_path = os.path.join(task_folder, 'index.html')
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html)
        files['html'] = html_path
    if css:
        css_path = os.path.join(task_folder, 'styles.css')
        with open(css_path, 'w', encoding='utf-8') as f:
            f.write(css)
        files['css'] = css_path
    if js:
        js_path = os.path.join(task_folder, 'app.js')
        with open(js_path, 'w', encoding='utf-8') as f:
            f.write(js)
        files['js'] = js_path
    return files


def create_combined_html(html: str, css: str, js: str, patient_data: dict = None) -> str:
    """Inline all CSS and JS so the app is fully self-contained."""
    html = re.sub(r'<link[^>]+href=["\']styles\.css["\'][^>]*/?>',   '', html, flags=re.IGNORECASE)
    html = re.sub(r'<script[^>]+src=["\']app\.js["\'][^>]*></script>', '', html, flags=re.IGNORECASE)
    if css:
        html = html.replace('</head>', f'<style>\n{css}\n</style>\n</head>', 1)
    inject = ''
    if patient_data:
        inject += f'<script>window.PATIENT_DATA = {json.dumps(patient_data)};</script>\n'
    if js:
        inject += f'<script>\n{js}\n</script>\n'
    if inject:
        html = html.replace('</body>', f'{inject}</body>', 1)
    return html


def _fire_webhook(payload: dict):
    """Send a log payload to the configured webhook URL (background thread)."""
    if not WEBHOOK_URL:
        return
    try:
        requests.post(WEBHOOK_URL, json=payload, timeout=5)
    except Exception as e:
        logger.warning(f"Webhook delivery failed: {e}")


def add_task_log(task_id: str, message: str, level: str = 'info', details: dict = None):
    """Add a log entry for a task and forward it to the webhook."""
    log = TaskLog(task_id=task_id, level=level, message=message, details=details)
    db.session.add(log)
    db.session.commit()

    payload = {
        'task_id':    task_id,
        'level':      level,
        'message':    message,
        'details':    details,
        'timestamp':  log.created_at.isoformat() if log.created_at else datetime.utcnow().isoformat(),
    }
    threading.Thread(target=_fire_webhook, args=(payload,), daemon=True).start()


def check_cancellation(task_id: str) -> bool:
    """Check if a task has been requested to be cancelled"""
    task = Task.query.get(task_id)
    if task and task.cancel_requested:
        task.status = TaskStatus.failed
        task.error_message = 'Task was cancelled'
        task.completed_at = datetime.utcnow()
        db.session.commit()
        add_task_log(task_id, "Task cancelled", 'warning')
        return True
    return False
