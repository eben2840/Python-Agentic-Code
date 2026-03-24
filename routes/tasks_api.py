import uuid
import logging
import threading

from flask import Blueprint, request, jsonify, redirect, url_for, current_app

from models import db, Task, TaskStatus, TaskComplexity, PatientSession
from utils.helpers import add_task_log
from services.executor import execute_task, execute_continuation_task

logger = logging.getLogger(__name__)
tasks_api = Blueprint('tasks_api', __name__)


def execute_task_in_context(app, task_id):
    with app.app_context():
        execute_task(task_id)

def _run_in_context(app, fn, *args):
    with app.app_context():
        fn(*args)


@tasks_api.route('/api/tasks', methods=['GET'])
def get_tasks():
    # """Get all tasks"""
    print(f"[DEBUG] GET /api/tasks - fetching all tasks")
    tasks = Task.query.order_by(Task.updated_at.desc()).all()
    print(f"[DEBUG] GET /api/tasks - found {len(tasks)} tasks")
    return jsonify([t.to_dict() for t in tasks])


@tasks_api.route('/api/tasks/<task_id>', methods=['GET'])
def get_task(task_id):
    # """Get a specific task"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    return jsonify(task.to_dict())


@tasks_api.route('/api/tasks/<task_id>', methods=['PATCH', 'PUT'])
def update_task(task_id):
    # """Update a task"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    data = request.get_json()
    if 'title' in data:
        task.title = data['title']
    if 'description' in data:
        task.description = data['description']
    if 'specification' in data:
        task.specification = data['specification']
    if 'status' in data:
        try:
            task.status = TaskStatus[data['status']]
        except KeyError:
            pass

    db.session.commit()
    return jsonify(task.to_dict())


@tasks_api.route('/api/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    # """Delete a task"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Task deleted'})


@tasks_api.route('/api/tasks/<task_id>/run', methods=['POST'])
def run_task(task_id):
    # """Run/restart a task"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    task.status = TaskStatus.pending
    task.current_iteration = 0
    task.error_message = None
    task.cancel_requested = False
    db.session.commit()

    app = current_app._get_current_object()
    threading.Thread(target=lambda: execute_task_in_context(app, task_id), daemon=True).start()
    return jsonify(task.to_dict())


@tasks_api.route('/api/tasks/<task_id>/cancel', methods=['POST'])
def cancel_task(task_id):
    # """Cancel a running task — move to pending"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    if task.status not in [TaskStatus.planning, TaskStatus.executing, TaskStatus.reviewing, TaskStatus.fixing]:
        return jsonify({'error': 'Task is not running'}), 400

    task.status = TaskStatus.pending
    task.cancel_requested = True
    task.error_message = 'Execution stopped by user'
    db.session.commit()

    logger.info(f"Task {task_id} stopped and moved to pending")
    return jsonify({'message': 'Task stopped and moved to pending', 'task': task.to_dict()})


@tasks_api.route('/api/tasks/<task_id>/continue', methods=['POST'])
def continue_task(task_id):
    # """Continue a completed task with incremental changes"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    if not task.html_content:
        return jsonify({'error': 'Task has no generated content to continue from'}), 400

    if not task.html_content:
        return jsonify({'error': 'No existing content to modify'}), 400

    data    = request.get_json()
    changes = data.get('changes', '')

    if not changes:
        return jsonify({'error': 'Changes description required'}), 400

    original_spec      = task.specification or ''
    task.specification = f"{original_spec}\n\n--- INCREMENTAL CHANGES ---\n{changes}"
    task.status        = TaskStatus.pending
    task.current_iteration = 0
    task.error_message = None
    task.cancel_requested = False
    db.session.commit()

    add_task_log(task_id, f"Continuing task with changes: {changes[:100]}...", 'info')
    app = current_app._get_current_object()
    threading.Thread(target=lambda: _run_in_context(app, execute_continuation_task, task_id, changes), daemon=True).start()
    return jsonify({'message': 'Applying changes...', 'task': task.to_dict()})


@tasks_api.route('/create-task', methods=['POST'])
def create_task_form():
    """Create task from form submission"""
    print("[CREATE-TASK] Form submitted", flush=True)
    title         = request.form.get('title')
    description   = request.form.get('description', '')
    specification = request.form.get('specification', '')
    complexity    = request.form.get('complexity', 'standard')
    print(f"[CREATE-TASK] title={title}", flush=True)

    if not title:
        print("[CREATE-TASK] No title provided, redirecting", flush=True)
        return redirect(url_for('web.index'))

    patient_session = PatientSession.query.order_by(PatientSession.last_accessed.desc()).first()
    print(f"[CREATE-TASK] Patient session: {patient_session.patient_name if patient_session else 'None'}", flush=True)

    task_id = str(uuid.uuid4())
    print(f"[CREATE-TASK] Creating task {task_id}", flush=True)
    task = Task(
        id=task_id,
        title=title,
        description=description,
        specification=specification,
        complexity=TaskComplexity[complexity] if complexity in TaskComplexity.__members__ else TaskComplexity.standard,
        status=TaskStatus.pending,
        patient_id=patient_session.patient_id if patient_session else None,
        fhir_base_url=patient_session.fhir_base_url if patient_session else None,
        patient_data=patient_session.patient_data if patient_session else None
    )
    db.session.add(task)
    db.session.commit()
    print(f"[CREATE-TASK] Task {task_id} saved to database", flush=True)
    add_task_log(task_id, f"Task created: {title}", 'info')

    print(f"[CREATE-TASK] Starting execution for task {task_id}", flush=True)
    app = current_app._get_current_object()
    threading.Thread(target=lambda: execute_task_in_context(app, task_id), daemon=True).start()

    print("[CREATE-TASK] Redirecting to index", flush=True)
    return redirect(url_for('web.index'))


@tasks_api.route('/api/tasks/<task_id>/logs', methods=['GET'])
def get_task_logs(task_id):
    """Get logs for a task"""
    from models import TaskLog
    logs = TaskLog.query.filter_by(task_id=task_id).order_by(TaskLog.created_at.desc()).all()
    return jsonify([log.to_dict() for log in logs])
