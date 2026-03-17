"""
Backend Service - Handle frontend logic in Python instead of JavaScript
"""
import re
import json
import uuid
import logging
from datetime import datetime

import anthropic
from flask import Blueprint, request, jsonify, Response

from models import db, Task, TaskStatus, TaskComplexity, PatientSession, TaskLog
from llm_service import ClaudeLLMService
from utils.helpers import add_task_log

logger = logging.getLogger(__name__)

backend_service = Blueprint('backend_service', __name__, url_prefix='/api/backend')


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

def _inject_patient_data(html_content: str, patient_data: dict) -> str:
    """Inject window.PATIENT_DATA script into HTML."""
    if not patient_data:
        return html_content
    script = f"<script>window.PATIENT_DATA = {json.dumps(patient_data)};</script>"
    if '<script' in html_content:
        return html_content.replace('<script', f'{script}\n<script', 1)
    if '</head>' in html_content:
        return html_content.replace('</head>', f'{script}\n</head>')
    if '<body' in html_content:
        return re.sub(r'(<body[^>]*>)', r'\1\n' + script, html_content, count=1)
    return script + '\n' + html_content


def _status_page(status_label: str) -> str:
    """Return an HTML progress page while the task is still running."""
    return f'''<html>
<head><title>App Not Ready</title>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
         padding: 2rem; text-align: center; background: #f5f5f5; }}
  .container {{ max-width: 500px; margin: 50px auto; background: white;
               padding: 40px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
  h2 {{ color: #333; margin-bottom: 20px; }}
  .status {{ font-size: 18px; color: #0066cc; margin: 20px 0; }}
  .progress {{ width: 100%; height: 4px; background: #e0e0e0; border-radius: 2px; overflow: hidden; }}
  .progress-bar {{ height: 100%; background: #0066cc; animation: progress 2s ease-in-out infinite; }}
  @keyframes progress {{ 0% {{ width: 0%; }} 50% {{ width: 70%; }} 100% {{ width: 100%; }} }}
  button {{ background: #0066cc; color: white; border: none; padding: 12px 24px;
           border-radius: 6px; cursor: pointer; font-size: 14px; margin-top: 20px; }}
  button:hover {{ background: #0052a3; }}
</style>
<meta http-equiv="refresh" content="3">
</head>
<body>
  <div class="container">
    <h2>Mini App Generation in Progress</h2>
    <p class="status">Status: {status_label}</p>
    <div class="progress"><div class="progress-bar"></div></div>
    <p>Please wait while we create your healthcare mini-app...</p>
    <button onclick="window.location.reload()">Refresh Now</button>
  </div>
</body>
</html>'''


# -----------------------------------------------------------------------------
# Routes
# -----------------------------------------------------------------------------

@backend_service.route('/dashboard-data', methods=['GET'])
def get_dashboard_data():
    """Get all dashboard data for frontend"""
    try:
        patient_session = PatientSession.query.order_by(PatientSession.last_accessed.desc()).first()
        tasks = Task.query.all()
        task_data = {
            'pending':   [t.to_dict() for t in tasks if t.status == TaskStatus.pending],
            'running':   [t.to_dict() for t in tasks if t.status in [TaskStatus.planning, TaskStatus.executing, TaskStatus.fixing]],
            'reviewing': [t.to_dict() for t in tasks if t.status == TaskStatus.reviewing],
            'completed': [t.to_dict() for t in tasks if t.status == TaskStatus.completed],
            'failed':    [t.to_dict() for t in tasks if t.status == TaskStatus.failed],
        }
        return jsonify({
            'authenticated': bool(patient_session),
            'patient_data': {
                'patient_name':         patient_session.patient_name,
                'patient_id':           patient_session.patient_id,
                'patient_data_summary': patient_session.patient_data,
            } if patient_session else None,
            'tasks': task_data,
            'stats': {
                'total':     len(tasks),
                'completed': len(task_data['completed']),
                'failed':    len(task_data['failed']),
                'running':   len(task_data['running']),
            },
        })
    except Exception as e:
        logger.error(f"Error getting dashboard data: {e}")
        return jsonify({'error': str(e)}), 500


@backend_service.route('/generate-idea', methods=['POST'])
def generate_idea():
    """Generate idea using LLM with patient data context"""
    try:
        data   = request.get_json()
        prompt = data.get('prompt')
        if not prompt:
            return jsonify({'error': 'Prompt required'}), 400

        logger.info(f"[GENERATE-IDEA] Prompt: {prompt}")
        patient_session = PatientSession.query.order_by(PatientSession.last_accessed.desc()).first()
        patient_data    = patient_session.patient_data if patient_session else None

        patient_context = ''
        if patient_data:
            p = patient_data.get('patient', {})
            patient_context = f"""
Patient Context:
- Name: {p.get('name', 'Unknown')}
- Gender: {p.get('gender', 'Unknown')}
- Birth Date: {p.get('birthDate', 'Unknown')}
- Available Data: Observations, Conditions, Medications, Allergies, Encounters
"""

        idea_prompt = f"""Based on the request: "{prompt}"

{patient_context}
You are a clinical HTML app generator. If the request is not related to healthcare or patient
  care, return exactly this HTML: <html><body><p>Only clinical requests are
  supported.</p></body></html>

Generate a healthcare SMART on FHIR mini-app UI idea. Provide:
1. **Title** - A clear, descriptive title for the application
2. **Description** - 2-3 sentences explaining what the app does and how it helps the patient/provider
3. **Key Features** - 3-5 key UI features and what users can see/interact with
4. **Technical Approach** - Brief description of UI components, visualizations, and data displays

Focus on creating a useful healthcare application that leverages the patient's FHIR data.

Format your response as a clear, readable document with sections for each item above."""

        logger.info(f"[GENERATE-IDEA] Calling LLM for idea generation...")
        llm    = ClaudeLLMService()
        client = anthropic.Anthropic(api_key=llm.api_key)
        response = client.messages.create(
            model=llm.model,
            max_tokens=1500,
            messages=[{"role": "user", "content": idea_prompt}]
        )
        idea_text = response.content[0].text
        logger.info(f"[GENERATE-IDEA] LLM response received ({len(idea_text)} chars)")

        return jsonify({'idea': idea_text, 'prompt': prompt, 'has_patient_context': bool(patient_data)})

    except Exception as e:
        logger.error(f"[GENERATE-IDEA] Error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@backend_service.route('/create-miniapp', methods=['POST'])
def create_miniapp():
    """Create mini app from prompt — task is created pending, user starts it manually"""
    try:
        data           = request.get_json()
        title          = data.get('title') or data.get('prompt', 'SMART on FHIR Mini App')
        description    = data.get('description') or data.get('prompt', '')
        specification  = data.get('specification', '')
        complexity_str = data.get('complexity', 'standard')
        complexity     = TaskComplexity[complexity_str] if complexity_str in TaskComplexity.__members__ else TaskComplexity.standard

        if not description:
            return jsonify({'error': 'Description/prompt required'}), 400

        logger.info(f"[CREATE-MINIAPP] Title: {title}")
        logger.info(f"[CREATE-MINIAPP] Description: {description[:100]}...")

        patient_session = PatientSession.query.order_by(PatientSession.last_accessed.desc()).first()
        if not patient_session:
            logger.error("[CREATE-MINIAPP] No patient session found")
            return jsonify({'error': 'No patient session found. Please connect to FHIR server and load patient data first.'}), 400

        task_id = str(uuid.uuid4())
        task = Task(
            id=task_id,
            title=title[:500],
            description=description,
            specification=specification,
            complexity=complexity,
            status=TaskStatus.pending,
            patient_id=patient_session.patient_id,
            fhir_base_url=patient_session.fhir_base_url,
            patient_data=patient_session.patient_data
        )
        db.session.add(task)
        db.session.commit()
        add_task_log(task_id, f"Task created: {title}. Click 'Start Task' to begin generation.", 'info')
        logger.info(f"[CREATE-MINIAPP] Created task {task_id} (pending - waiting for user to start)")

        return jsonify({'status': 'success', 'task_id': task_id, 'message': 'Task created and added to pending. Click on the task to start it.'})

    except Exception as e:
        logger.error(f"[CREATE-MINIAPP] Error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@backend_service.route('/session-status', methods=['GET'])
def session_status():
    """Check session status using PatientSession model"""
    patient_session = PatientSession.query.order_by(PatientSession.last_accessed.desc()).first()
    if not patient_session:
        return jsonify({'authenticated': False, 'session_data': None})

    patient_session.last_accessed = datetime.utcnow()
    db.session.commit()
    return jsonify({
        'authenticated': True,
        'session_data': {
            'patient_id':   patient_session.patient_id,
            'patient_name': patient_session.patient_name,
            'fhir_base_url': patient_session.fhir_base_url,
            'patient_data': patient_session.patient_data,
        },
    })


@backend_service.route('/view-app/<task_id>', methods=['GET'])
def view_generated_app(task_id):
    """View generated mini app UI"""
    try:
        task = Task.query.get(task_id)
        if not task:
            return '<h1>Task not found</h1>', 404

        if task.status != TaskStatus.completed:
            status_label = {
                TaskStatus.pending:   'Pending',
                TaskStatus.planning:  'Planning...',
                TaskStatus.executing: 'Executing...',
                TaskStatus.reviewing: 'AI Reviewing...',
                TaskStatus.fixing:    'Fixing Issues...',
                TaskStatus.failed:    'Failed',
                TaskStatus.cancelled: 'Cancelled',
            }.get(task.status, task.status.value)
            return _status_page(status_label), 202

        if not task.html_content:
            return '<h1>No content generated</h1>', 404

        html_content = _inject_patient_data(task.html_content, task.patient_data)
        return Response(html_content, mimetype='text/html')

    except Exception as e:
        return f'<h1>Error: {str(e)}</h1>', 500


@backend_service.route('/task/<task_id>/status', methods=['GET'])
def get_task_status(task_id):
    """Get detailed task status for polling"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    logs = TaskLog.query.filter_by(task_id=task_id).order_by(TaskLog.created_at.desc()).limit(10).all()
    return jsonify({
        'id':                task.id,
        'status':            task.status.value,
        'title':             task.title,
        'current_iteration': task.current_iteration,
        'final_score':       task.final_score,
        'error_message':     task.error_message,
        'has_content':       bool(task.html_content),
        'logs':              [log.to_dict() for log in logs],
        'updated_at':        task.updated_at.isoformat() if task.updated_at else None,
    })
