import logging

from flask import Blueprint, render_template, request, jsonify, url_for

from models import Task, TaskStatus
from utils.helpers import create_combined_html

logger = logging.getLogger(__name__)
mini_apps = Blueprint('mini_apps', __name__)


@mini_apps.route('/mini-apps')
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
        print(f"[API][MINI-APPS] Processing task ID: {task.id}")
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
