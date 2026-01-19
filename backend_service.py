"""
Backend Service - Handle frontend logic in Python instead of JavaScript
"""
import os
import uuid
import json
from flask import Blueprint, request, jsonify
from models import db, Task, TaskStatus, TaskComplexity, PatientSession, TaskLog, Generation
from llm_service import ClaudeLLMService
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

backend_service = Blueprint('backend_service', __name__, url_prefix='/api/backend')

# Output folder for generated mini apps
OUTPUT_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'generated_apps')
os.makedirs(OUTPUT_FOLDER, exist_ok=True)


def add_task_log(task_id: str, message: str, level: str = 'info', details: dict = None):
    """Add a log entry for a task"""
    log = TaskLog(
        task_id=task_id,
        level=level,
        message=message,
        details=details
    )
    db.session.add(log)
    db.session.commit()


def save_generated_files(task_id: str, html: str, css: str, js: str) -> dict:
    """Save generated files to output folder"""
    task_folder = os.path.join(OUTPUT_FOLDER, task_id)
    os.makedirs(task_folder, exist_ok=True)

    files = {}

    # Save HTML
    if html:
        html_path = os.path.join(task_folder, 'index.html')
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html)
        files['html'] = html_path

    # Save CSS
    if css:
        css_path = os.path.join(task_folder, 'styles.css')
        with open(css_path, 'w', encoding='utf-8') as f:
            f.write(css)
        files['css'] = css_path

    # Save JS
    if js:
        js_path = os.path.join(task_folder, 'app.js')
        with open(js_path, 'w', encoding='utf-8') as f:
            f.write(js)
        files['js'] = js_path

    return files


@backend_service.route('/dashboard-data', methods=['GET'])
def get_dashboard_data():
    """Get all dashboard data for frontend"""
    try:
        # Get latest patient session
        patient_session = PatientSession.query.order_by(PatientSession.last_accessed.desc()).first()

        # Get all tasks
        tasks = Task.query.all()

        # Categorize tasks
        task_data = {
            'pending': [t.to_dict() for t in tasks if t.status == TaskStatus.pending],
            'running': [t.to_dict() for t in tasks if t.status in [TaskStatus.planning, TaskStatus.executing, TaskStatus.fixing]],
            'reviewing': [t.to_dict() for t in tasks if t.status == TaskStatus.reviewing],
            'completed': [t.to_dict() for t in tasks if t.status == TaskStatus.completed],
            'failed': [t.to_dict() for t in tasks if t.status == TaskStatus.failed]
        }

        return jsonify({
            'authenticated': bool(patient_session),
            'patient_data': {
                'patient_name': patient_session.patient_name if patient_session else None,
                'patient_id': patient_session.patient_id if patient_session else None,
                'patient_data_summary': patient_session.patient_data if patient_session else None
            } if patient_session else None,
            'tasks': task_data,
            'stats': {
                'total': len(tasks),
                'completed': len(task_data['completed']),
                'failed': len(task_data['failed']),
                'running': len(task_data['running'])
            }
        })

    except Exception as e:
        logger.error(f"Error getting dashboard data: {e}")
        return jsonify({'error': str(e)}), 500


@backend_service.route('/generate-idea', methods=['POST'])
def generate_idea():
    """Generate idea using LLM with patient data context"""
    try:
        data = request.get_json()
        prompt = data.get('prompt')

        if not prompt:
            return jsonify({'error': 'Prompt required'}), 400

        logger.info(f"[GENERATE-IDEA] Prompt: {prompt}")

        # Get patient data from latest session
        patient_session = PatientSession.query.order_by(PatientSession.last_accessed.desc()).first()
        patient_data = patient_session.patient_data if patient_session else None

        # Build patient context for the idea generation
        patient_context = ""
        if patient_data:
            patient_info = patient_data.get('patient', {})
            patient_context = f"""
Patient Context:
- Name: {patient_info.get('name', 'Unknown')}
- Gender: {patient_info.get('gender', 'Unknown')}
- Birth Date: {patient_info.get('birthDate', 'Unknown')}
- Available Data: Observations, Conditions, Medications, Allergies, Encounters
"""

        # Use LLM to generate the idea
        logger.info(f"[GENERATE-IDEA] Calling LLM for idea generation...")
        llm = ClaudeLLMService()

        # Create a prompt specifically for idea generation
        idea_prompt = f"""Based on the request: "{prompt}"

{patient_context}

Generate a healthcare SMART on FHIR mini-app UI idea. Provide:
1. **Title** - A clear, descriptive title for the application
2. **Description** - 2-3 sentences explaining what the app does and how it helps the patient/provider
3. **Key Features** - 3-5 key UI features and what users can see/interact with
4. **Technical Approach** - Brief description of UI components, visualizations, and data displays

Focus on creating a useful healthcare application that leverages the patient's FHIR data.

Format your response as a clear, readable document with sections for each item above."""

        # Call LLM for idea
        import anthropic
        client = anthropic.Anthropic(api_key=llm.api_key)

        response = client.messages.create(
            model=llm.model,
            max_tokens=1500,
            messages=[{"role": "user", "content": idea_prompt}]
        )

        idea_text = response.content[0].text
        logger.info(f"[GENERATE-IDEA] LLM response received ({len(idea_text)} chars)")

        return jsonify({
            'idea': idea_text,
            'prompt': prompt,
            'has_patient_context': bool(patient_data)
        })

    except Exception as e:
        logger.error(f"[GENERATE-IDEA] Error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@backend_service.route('/create-miniapp', methods=['POST'])
def create_miniapp():
    """Create mini app from prompt with full execution workflow"""
    try:
        data = request.get_json()

        # Get fields from frontend
        title = data.get('title') or data.get('prompt', 'SMART on FHIR Mini App')
        description = data.get('description') or data.get('prompt', '')
        specification = data.get('specification', '')
        complexity_str = data.get('complexity', 'standard')

        # Map complexity
        complexity = TaskComplexity.standard
        if complexity_str in TaskComplexity.__members__:
            complexity = TaskComplexity[complexity_str]

        if not description:
            return jsonify({'error': 'Description/prompt required'}), 400

        logger.info(f"[CREATE-MINIAPP] Title: {title}")
        logger.info(f"[CREATE-MINIAPP] Description: {description[:100]}...")

        # Get the latest patient session
        patient_session = PatientSession.query.order_by(PatientSession.last_accessed.desc()).first()

        patient_data = None
        patient_id = None
        fhir_base_url = None

        if patient_session:
            patient_data = patient_session.patient_data
            patient_id = patient_session.patient_id
            fhir_base_url = patient_session.fhir_base_url
            logger.info(f"[CREATE-MINIAPP] Using patient session: {patient_session.patient_name}")
        else:
            logger.warning("[CREATE-MINIAPP] No patient session found, using demo data")
            patient_data = {
                'patient': {'id': 'demo', 'name': 'Demo Patient', 'gender': 'unknown', 'birthDate': 'Unknown'},
                'observations': {'count': 0, 'summary': []},
                'conditions': {'count': 0, 'summary': []},
                'medications': {'count': 0, 'summary': []},
                'allergies': {'count': 0, 'summary': []}
            }

        # Create task
        task_id = str(uuid.uuid4())
        task = Task(
            id=task_id,
            title=title[:500] if len(title) > 500 else title,
            description=description,
            specification=specification,
            complexity=complexity,
            status=TaskStatus.pending,
            patient_id=patient_id,
            fhir_base_url=fhir_base_url,
            patient_data=patient_data
        )
        db.session.add(task)
        db.session.commit()

        add_task_log(task_id, f"Task created: {title}. Click 'Start Task' to begin generation.", 'info')
        logger.info(f"[CREATE-MINIAPP] Created task {task_id} (pending - waiting for user to start)")

        # DO NOT auto-execute - wait for user to click "Start Task"
        return jsonify({
            'status': 'success',
            'task_id': task_id,
            'message': 'Task created and added to pending. Click on the task to start it.'
        })

    except Exception as e:
        logger.error(f"[CREATE-MINIAPP] Error: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


def execute_miniapp_task(task_id: str):
    """Execute the mini app generation task with status tracking"""
    task = Task.query.get(task_id)
    if not task:
        logger.error(f"[EXECUTE] Task {task_id} not found")
        return

    try:
        # ========== PHASE 1: PLANNING ==========
        logger.info(f"[EXECUTE] Task {task_id} -> planning")
        task.status = TaskStatus.planning
        task.current_iteration += 1
        db.session.commit()
        add_task_log(task_id, "Starting mini app planning...", 'info')

        # Check for cancellation
        if task.cancel_requested:
            task.status = TaskStatus.cancelled
            task.error_message = 'Task was cancelled'
            db.session.commit()
            add_task_log(task_id, "Task cancelled", 'warning')
            return

        # Get patient data
        patient_data = task.patient_data
        if not patient_data:
            patient_data = {
                'patient': {'id': 'demo', 'name': 'Demo Patient', 'gender': 'unknown', 'birthDate': 'Unknown'},
                'observations': {'count': 0, 'summary': []},
                'conditions': {'count': 0, 'summary': []},
                'medications': {'count': 0, 'summary': []},
                'allergies': {'count': 0, 'summary': []}
            }

        add_task_log(task_id, f"Patient data ready: {patient_data.get('patient', {}).get('name', 'Unknown')}", 'info')

        # ========== PHASE 2: EXECUTING ==========
        logger.info(f"[EXECUTE] Task {task_id} -> executing")
        task.status = TaskStatus.executing
        db.session.commit()
        add_task_log(task_id, "Generating code with Claude AI...", 'info')

        # Check for cancellation
        task = Task.query.get(task_id)
        if task.cancel_requested:
            task.status = TaskStatus.cancelled
            task.error_message = 'Task was cancelled'
            db.session.commit()
            add_task_log(task_id, "Task cancelled", 'warning')
            return

        # Generate mini app
        llm = ClaudeLLMService()
        user_prompt = f"{task.title}\n\n{task.description or ''}\n\n{task.specification or ''}"

        html_content, css_content, js_content, llm_response = llm.generate_mini_app(
            user_prompt,
            patient_data,
            task.complexity.value if task.complexity else 'standard'
        )

        logger.info(f"[EXECUTE] Generated: html={len(html_content)} chars, css={len(css_content or '')} chars, js={len(js_content or '')} chars")

        # Save generated content
        task.html_content = html_content
        task.css_content = css_content
        task.js_content = js_content
        db.session.commit()

        # Save to files
        saved_files = save_generated_files(task_id, html_content, css_content, js_content)
        task.generated_files = list(saved_files.values())
        db.session.commit()

        add_task_log(task_id, f"Code generated successfully. Files saved: {list(saved_files.keys())}", 'info')

        # Store generation record
        generation = Generation(
            task_id=task_id,
            iteration=task.current_iteration,
            user_prompt=user_prompt,
            patient_context=patient_data,
            html_content=html_content,
            css_content=css_content,
            js_content=js_content,
            llm_response=llm_response,
            output_folder=os.path.join(OUTPUT_FOLDER, task_id)
        )
        db.session.add(generation)
        db.session.commit()

        # ========== PHASE 3: AI REVIEW ==========
        logger.info(f"[EXECUTE] Task {task_id} -> reviewing")
        task.status = TaskStatus.reviewing
        db.session.commit()
        add_task_log(task_id, "AI reviewing generated code...", 'info')

        # Check for cancellation
        task = Task.query.get(task_id)
        if task.cancel_requested:
            task.status = TaskStatus.cancelled
            task.error_message = 'Task was cancelled'
            db.session.commit()
            add_task_log(task_id, "Task cancelled", 'warning')
            return

        # Review the code
        score, feedback = llm.review_generated_code(
            html_content,
            css_content or '',
            js_content or '',
            user_prompt
        )

        logger.info(f"[EXECUTE] Review complete: score={score}/10")

        # Update generation with review
        generation.score = score
        generation.feedback = feedback

        # ========== PHASE 4: COMPLETED ==========
        task.final_score = score
        task.status = TaskStatus.completed
        task.completed_at = datetime.utcnow()
        db.session.commit()

        add_task_log(task_id, f"Task completed with score: {score}/10", 'info', {'score': score, 'feedback': feedback})
        logger.info(f"[EXECUTE] Task {task_id} completed successfully with score {score}")

    except Exception as e:
        logger.error(f"[EXECUTE] Error executing task {task_id}: {e}", exc_info=True)
        task.status = TaskStatus.failed
        task.error_message = str(e)
        db.session.commit()
        add_task_log(task_id, f"Task failed: {str(e)}", 'error')


@backend_service.route('/session-status', methods=['GET'])
def session_status():
    """Check session status using PatientSession model"""
    patient_session = PatientSession.query.order_by(PatientSession.last_accessed.desc()).first()

    if patient_session:
        # Update last accessed time
        patient_session.last_accessed = datetime.utcnow()
        db.session.commit()

        return jsonify({
            'authenticated': True,
            'session_data': {
                'patient_id': patient_session.patient_id,
                'patient_name': patient_session.patient_name,
                'fhir_base_url': patient_session.fhir_base_url,
                'patient_data': patient_session.patient_data
            }
        })

    return jsonify({
        'authenticated': False,
        'session_data': None
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
                TaskStatus.pending: 'Pending',
                TaskStatus.planning: 'Planning...',
                TaskStatus.executing: 'Executing...',
                TaskStatus.reviewing: 'AI Reviewing...',
                TaskStatus.fixing: 'Fixing Issues...',
                TaskStatus.failed: 'Failed',
                TaskStatus.cancelled: 'Cancelled'
            }.get(task.status, task.status.value)

            return f'''
            <html>
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
            </html>
            ''', 202

        if not task.html_content:
            return '<h1>No content generated</h1>', 404

        # Return the generated HTML directly
        from flask import Response
        return Response(task.html_content, mimetype='text/html')

    except Exception as e:
        return f'<h1>Error: {str(e)}</h1>', 500


@backend_service.route('/task/<task_id>/status', methods=['GET'])
def get_task_status(task_id):
    """Get detailed task status for polling"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    # Get latest logs
    logs = TaskLog.query.filter_by(task_id=task_id).order_by(TaskLog.created_at.desc()).limit(10).all()

    return jsonify({
        'id': task.id,
        'status': task.status.value,
        'title': task.title,
        'current_iteration': task.current_iteration,
        'final_score': task.final_score,
        'error_message': task.error_message,
        'has_content': bool(task.html_content),
        'logs': [log.to_dict() for log in logs],
        'updated_at': task.updated_at.isoformat() if task.updated_at else None
    })
