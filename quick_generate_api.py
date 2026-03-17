from dotenv import load_dotenv
load_dotenv()
import os
import uuid
import logging
import threading
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, url_for, current_app
from models import db, Task, TaskStatus, TaskComplexity, PatientSession, TaskLog
from llm_service import ClaudeLLMService
from direct_fhir import get_patient_data_direct, get_all_patients_data_direct

logger = logging.getLogger(__name__)

quick_generate = Blueprint('quick_generate', __name__, url_prefix='/api/quick')

OUTPUT_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'generated_apps')
os.makedirs(OUTPUT_FOLDER, exist_ok=True)


def add_task_log(task_id: str, message: str, level: str = 'info'):
    """Add a log entry for a task"""
    log = TaskLog(task_id=task_id, level=level, message=message)
    db.session.add(log)
    db.session.commit()


def save_generated_files(task_id: str, html: str, css: str, js: str) -> dict:
    """Save generated files to output folder"""
    task_folder = os.path.join(OUTPUT_FOLDER, task_id)
    os.makedirs(task_folder, exist_ok=True)
    files = {}
    if html:
        with open(os.path.join(task_folder, 'index.html'), 'w', encoding='utf-8') as f:
            f.write(html)
        files['html'] = os.path.join(task_folder, 'index.html')
    if css:
        with open(os.path.join(task_folder, 'styles.css'), 'w', encoding='utf-8') as f:
            f.write(css)
        files['css'] = os.path.join(task_folder, 'styles.css')
    if js:
        with open(os.path.join(task_folder, 'app.js'), 'w', encoding='utf-8') as f:
            f.write(js)
        files['js'] = os.path.join(task_folder, 'app.js')
    return files


def run_generation(app, task_id: str, prompt: str, patient_data: dict, patient_name: str):
    """Background task to generate mini app"""
    with app.app_context():
        task = Task.query.get(task_id)
        if not task:
            return
        try:
            # Planning phase
            add_task_log(task_id, "Analyzing patient data and requirements...")
            task.plan = f"""## Generation Plan
**Prompt:** {prompt}
**Patient:** {patient_name}
**Steps:**
1. Analyze patient FHIR data
2. Design UI layout for healthcare app
3. Generate HTML structure
4. Create CSS styles
5. Write JavaScript logic
6. Integrate patient data
7. AI Review and scoring
"""
            db.session.commit()
            add_task_log(task_id, "Plan created")

            # Executing phase
            task.status = TaskStatus.executing
            db.session.commit()
            add_task_log(task_id, "Calling AI to generate code...")

            llm = ClaudeLLMService()
            html, css, js, _ = llm.generate_mini_app(prompt, patient_data)

            add_task_log(task_id, f"Code generated: HTML ({len(html)} chars), CSS ({len(css or '')} chars), JS ({len(js or '')} chars)")

            task.html_content = html
            task.css_content = css
            task.js_content = js
            db.session.commit()

            save_generated_files(task_id, html, css, js)
            add_task_log(task_id, "Files saved to disk")

            # Review phase
            task.status = TaskStatus.reviewing
            db.session.commit()
            add_task_log(task_id, "AI reviewing generated code...")

            score, feedback = llm.review_generated_code(html, css or '', js or '', prompt)
            add_task_log(task_id, f"Review complete. Score: {score}/10")

            task.final_score = score
            task.status = TaskStatus.completed
            task.completed_at = datetime.now(timezone.utc)
            task.plan += f"\n\n## Review Feedback\n{feedback}"
            db.session.commit()
            add_task_log(task_id, "Task completed successfully")

        except Exception as e:
            logger.error(f"[QUICK-GENERATE] Error: {e}", exc_info=True)
            task.status = TaskStatus.failed
            task.error_message = str(e)
            db.session.commit()
            add_task_log(task_id, f"Error: {str(e)}", 'error')


@quick_generate.route('/generate', methods=['POST'])
def generate_miniapp():
    """
    POST /api/quick/generate

    Body: { prompt, accessToken, fhirBaseUrl, patientId }

    Returns 202 immediately with task_id. Poll /status/{task_id} for progress.
    """
    try:
        data = request.get_json()
        prompt = data.get('prompt')
        access_token = data.get('accessToken')
        fhir_base_url = data.get('fhirBaseUrl')
        patient_id = data.get('patientId')

        if not all([prompt, access_token, fhir_base_url, patient_id]):
            return jsonify({'status': 'error', 'error': 'Missing required fields'}), 400

        # Fetch patient data
        session_data = {
            'fhir_base_url': fhir_base_url,
            'patient_id': patient_id,
            'auth_token': access_token
        }
        if patient_id == 'all':
            patient_data = get_all_patients_data_direct(session_data)
            count = patient_data.get('patient', {}).get('count', 0)
            patient_name = f"All Patients ({count} total)"
        else:
            patient_data = get_patient_data_direct(session_data)
            patient_name = patient_data.get('patient', {}).get('name') or f"Patient {patient_id}"

        # Save session
        session_id = str(uuid.uuid4())
        patient_session = PatientSession(
            id=session_id,
            patient_id=patient_id,
            patient_name=patient_name,
            fhir_base_url=fhir_base_url,
            auth_token=access_token,
            patient_data=patient_data
        )
        db.session.add(patient_session)
        db.session.commit()

        # Create task
        task_id = str(uuid.uuid4())
        task = Task(
            id=task_id,
            title=prompt[:100],
            description=prompt,
            complexity=TaskComplexity.standard,
            status=TaskStatus.planning,
            patient_id=patient_id,
            fhir_base_url=fhir_base_url,
            patient_data=patient_data
        )
        db.session.add(task)
        db.session.commit()

        add_task_log(task_id, "Task created, starting generation...")

        # Start background thread
        app = current_app._get_current_object()
        thread = threading.Thread(
            target=run_generation,
            args=(app, task_id, prompt, patient_data, patient_name)
        )
        thread.start()

        # Return immediately with 202
        return jsonify({
            'status': 'processing',
            'task_id': task_id,
            'status_url': url_for('quick_generate.get_task_status', task_id=task_id, _external=True),
            'patient_name': patient_name,
            'message': 'Task started. Poll status_url for progress.'
        }), 202

    except Exception as e:
        logger.error(f"[QUICK-GENERATE] Error: {e}", exc_info=True)
        return jsonify({'status': 'error', 'error': str(e)}), 500


@quick_generate.route('/status/<task_id>', methods=['GET'])
def get_task_status(task_id):
    """
    GET /api/quick/status/{task_id}
    """
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'status': 'error', 'error': 'Task not found'}), 404

    # Get activity logs
    logs = TaskLog.query.filter_by(task_id=task_id).order_by(TaskLog.created_at.asc()).all()

    response = {
        'task_id': task_id,
        'status': task.status.value,
        'title': task.title,
        'description': task.description,
        'score': task.final_score,
        'error': task.error_message,
        'plan': task.plan,
        'activity': [
            {
                'message': log.message,
                'level': log.level,
                'timestamp': log.created_at.isoformat() if log.created_at else None
            }
            for log in logs
        ],
        'created_at': task.created_at.isoformat() if task.created_at else None,
        'completed_at': task.completed_at.isoformat() if task.completed_at else None
    }

    if task.status == TaskStatus.completed:
        response['app_url'] = url_for('mini_app_preview', task_id=task_id, _external=True)
        response['raw_url'] = url_for('mini_app_raw', task_id=task_id, _external=True)

    return jsonify(response)
