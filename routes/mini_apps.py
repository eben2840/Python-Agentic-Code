import logging

from datetime import datetime

import requests as http_requests
from flask import Blueprint, render_template, request, jsonify, url_for

from models import db, Task, TaskStatus, CIWTransfer, Bookmark
from utils.helpers import create_combined_html
from utils.auth import require_bearer, require_bearer_or_basic
from routes.organization import fetch_departments
from routes.location import fetch_locations

logger = logging.getLogger(__name__)
mini_apps = Blueprint('mini_apps', __name__)


@mini_apps.route('/mini-apps')
@require_bearer
def mini_apps_page():
    """Mini apps gallery page"""
    print("[MINI-APPS] Loading mini apps gallery")
    tasks = Task.query.filter(
        Task.status == TaskStatus.completed,
        Task.html_content.isnot(None)
    ).order_by(Task.completed_at.desc()).all()
    print(f"[MINI-APPS] Found {len(tasks)} completed mini apps")
    return render_template('mini_apps.html', tasks=tasks)


@mini_apps.route('/mini-apps/<task_id>')
def mini_app_preview(task_id):
    """Preview a mini app"""
    print(f"[MINI-APP-PREVIEW] Loading preview for task {task_id}")
    task = Task.query.get(task_id)

    if not task:
        print(f"[MINI-APP-PREVIEW] Task {task_id} not found")
        return render_template('mini_app_preview.html', error='Task not found')

    if not task.html_content:
        print(f"[MINI-APP-PREVIEW] Task {task_id} has no HTML content")
        return render_template('mini_app_preview.html', task=task)

    print(f"[MINI-APP-PREVIEW] Rendering preview for task {task_id}")
    html_content = create_combined_html(
        task.html_content, task.css_content or '', task.js_content or '', task.patient_data
    )
    return render_template('mini_app_preview.html', html_content=html_content)


@mini_apps.route('/api/mini-apps', methods=['GET'])
@require_bearer
def get_mini_apps():
    """API endpoint to return completed mini-apps for a specific patient"""
    patient_id = request.args.get('patient_id')
    print(f"[API][MINI-APPS] Request received for patient_id: {patient_id}")

    if not patient_id:
        return jsonify({"error": "patient_id query parameter is required"}), 400

    tasks = Task.query.filter(
        Task.status == TaskStatus.completed,
        Task.html_content.isnot(None),
        Task.patient_id == patient_id
    ).all()
    print(f"[API][MINI-APPS] Found {len(tasks)} completed mini-apps for patient {patient_id}")

    results = []
    for task in tasks:
        # print(f"[API][MINI-APPS] Processing task ID: {task.id}")
        results.append({
            "id":          task.id,
            "patient_id":  task.patient_id,
            "url":         url_for('mini_apps.mini_app_preview', task_id=task.id, _external=True),
            "title":       task.title,
            "description": task.description,
            "final_score": task.final_score,
        })
    print(f"[API][MINI-APPS] Returning {len(results)} records")
    return jsonify({"count": len(results), "results": results})


@mini_apps.route('/careit-web/api/v1/options', methods=['GET'])
@require_bearer
def get_transfer_options():
    def to_options(field):
        return [{'value': v, 'label': l} for v, l in field]

    return jsonify({
        'status':  to_options(CIWTransfer.status),
        'roles':   to_options(CIWTransfer.roles),
        'show_at': to_options(CIWTransfer.show_at),
    })


@mini_apps.route('/careit-web/api/v1/transfer-options', methods=['GET'])
@require_bearer
def transfer_options():
    return jsonify({
        "departments": fetch_departments(),
        "wards":       fetch_locations(),
    })



@mini_apps.route('/careit-web/api/v1', methods=['GET'])
@require_bearer_or_basic
def get_careit_web():
    patient_id = request.args.get('patient_id')
    show_at    = request.args.get('show_at')
    roles      = request.args.get('roles')
    department = request.args.get('department')
    ward       = request.args.get('ward')
    bookmarked = request.args.get('bookmarked')

    query = Task.query.filter(
        Task.status == TaskStatus.completed,
        Task.html_content.isnot(None),
        Task.transferred == True,
        Task.transfer_status == 'active'
    )

    if patient_id:
        query = query.filter(Task.patient_id == patient_id)
    if show_at:
        query = query.filter(Task.transfer_show_at.contains(show_at))
    if roles:
        query = query.filter(Task.transfer_roles.contains(roles))
    if department:
        query = query.filter(Task.transfer_dept_name == department)
    if ward:
        query = query.filter(Task.transfer_ward == ward)
    if bookmarked:
        query = query.filter(Task.bookmarks.any())

    tasks = query.order_by(Task.transferred_at.desc()).all()

    results = [{
        "id":      t.id,
        "url":     url_for('mini_apps.mini_app_preview', task_id=t.id, _external=True),
        "title":   t.title,
        "patient_id":  t.patient_id,
        "description": t.description,
        "status":     t.transfer_status,
        "roles":      t.transfer_roles or [],
        "show_at":    t.transfer_show_at or [],
        "department": t.transfer_dept_name,
        "ward":       t.transfer_ward,
    } for t in tasks]

    return jsonify({"CareIT_web": results})


@mini_apps.route('/careit-web/api/v1/<task_id>/transfer', methods=['POST'])
@require_bearer
def transfer_to_careit_web(task_id):
    task = Task.query.get_or_404(task_id)

    if task.status != TaskStatus.completed or not task.html_content:
        print(f"[transfer_to_careit_web] FAILED for task {task_id}: status={task.status}, has_html={bool(task.html_content)}")
        return jsonify({"error": "Only completed mini apps can be transferred"}), 400

    data    = request.get_json(silent=True) or {}
    show_at = data.get('show_at', [])

    if any(v in {'medboard', 'curve'} for v in show_at) and task.patient_id == 'all':
        return jsonify({"error": "Context require a specific patient context"}), 422
    if 'main_dashboard' in show_at and task.patient_id != 'all':
        return jsonify({"error": "Context is for all-patient context only"}), 422

    task.transferred       = True
    task.transferred_at    = task.transferred_at or datetime.utcnow()
    task.transfer_status   = data.get('status')
    task.transfer_roles    = data.get('roles', [])
    task.transfer_show_at  = show_at
    task.transfer_dept_name = data.get('department')
    task.transfer_ward      = data.get('ward')
    db.session.commit()

    return jsonify({
        "id":         task.id,
        "url":        url_for('mini_apps.mini_app_preview', task_id=task.id, _external=True),
        "title":      task.title,
        "status":     task.transfer_status,
        "roles":      task.transfer_roles,
        "show_at":    task.transfer_show_at,
        "department": task.transfer_dept_name,
        "ward":       task.transfer_ward,
    })




@mini_apps.route('/mini-apps/<task_id>/raw')
def mini_app_raw(task_id):
    """Get raw HTML content for iframe embedding"""
    task = Task.query.get(task_id)
    if not task or not task.html_content:
        return '<html><body><p>No content available</p></body></html>'
    html_content = create_combined_html(
        task.html_content, task.css_content or '', task.js_content or '', task.patient_data
    )
    return html_content
