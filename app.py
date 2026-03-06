"""
CareIT Vibe Mini App Generator
Flask application for generating SMART on FHIR mini applications using Claude AI
"""

import os
import uuid

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()
import json
import logging
from datetime import datetime, timedelta
from functools import wraps
from urllib.parse import unquote

from flask import (
    Flask, request, jsonify, render_template, redirect, 
    url_for, make_response, send_from_directory
)

from models import db, init_db, Task, TaskLog, Generation, TaskStatus, TaskComplexity, PatientSession
from fhir_service import FHIRService, get_patient_data_for_llm
from llm_service import ClaudeLLMService, check_llm_available
# from voice_service import get_voice_service, check_voice_available
import os
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///careit_vibe.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-1.5-pro")
# Output folder for generated mini apps
OUTPUT_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'generated_apps')
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

# Initialize database
init_db(app)

# Register backend service blueprint
from backend_service import backend_service
app.register_blueprint(backend_service)

# Register quick generate API blueprint
from quick_generate_api import quick_generate
app.register_blueprint(quick_generate)


# =============================================================================
# CORS SUPPORT FOR WEBVIEWS
# =============================================================================

@app.after_request
def add_cors_headers(response):
    """Add CORS headers for webview compatibility"""
    origin = request.headers.get('Origin')
    if origin:
        response.headers.add('Access-Control-Allow-Origin', origin)
    else:
        response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Patient-Id,X-FHIR-Base')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH')
    return response


@app.route('/api/options', methods=['OPTIONS'])
def cors_options():
    """Handle OPTIONS preflight requests"""
    response = make_response()
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Patient-Id,X-FHIR-Base')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    return response


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

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

app.jinja_env.globals['time_ago'] = time_ago


def get_fhir_context_from_cookies():
    """Extract FHIR context from cookies"""
    return {
        'fhir_base_url': request.cookies.get('fhir_base_url', ''),
        'patient_id': request.cookies.get('patient_id', ''),
        'access_token': request.cookies.get('fhir_token', ''),
        'patient_name': request.cookies.get('patient_name', ''),
        'patient_data': None
    }


def get_patient_data_from_cookies():
    """Get patient data summary from cookies"""
    patient_data_str = request.cookies.get('patient_data', '')
    if patient_data_str:
        try:
            return json.loads(unquote(patient_data_str))
        except:
            pass
    return None


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


def create_combined_html(html: str, css: str, js: str, patient_data: dict = None) -> str:
    """Inline all CSS and JS so the app is fully self-contained — no external file requests."""
    import re as _re
    # Remove external file references the LLM may have added
    html = _re.sub(r'<link[^>]+href=["\']styles\.css["\'][^>]*/?>',  '', html, flags=_re.IGNORECASE)
    html = _re.sub(r'<script[^>]+src=["\']app\.js["\'][^>]*></script>', '', html, flags=_re.IGNORECASE)

    # Inline CSS
    if css:
        html = html.replace('</head>', f'<style>\n{css}\n</style>\n</head>', 1)

    # Inject patient data + inline JS before </body>
    inject = ''
    if patient_data:
        inject += f'<script>window.PATIENT_DATA = {json.dumps(patient_data)};</script>\n'
    if js:
        inject += f'<script>\n{js}\n</script>\n'
    if inject:
        html = html.replace('</body>', f'{inject}</body>', 1)

    return html


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


# Remove duplicate routes - keep only the new ones


# Remove the custom Flutter init endpoint - use original templates only


# =============================================================================
# WEB ROUTES
# =============================================================================


@app.route('/test')
def test():
    """Test route"""
    print("[TEST] Test route accessed")
    return "<h1>Test Page Works!</h1>"


@app.route('/', methods=['GET', 'POST'])
def index():
    """Main dashboard page"""
    import sys
    print(f"\n{'='*60}", flush=True)
    print(f"[INDEX] {request.method} request to / from {request.remote_addr}", flush=True)
    print(f"[INDEX] Cookies: {list(request.cookies.keys())}", flush=True)
    print(f"{'='*60}", flush=True)
    sys.stdout.flush()
    
    if request.method == 'POST':
        print("[INDEX] POST request - checking Flutter headers", flush=True)
        auth_header = request.headers.get('Authorization', '')
        patient_id = request.headers.get('X-Patient-Id', '')
        fhir_base_url = request.headers.get('X-FHIR-Base', '')
        print(f"[INDEX] Headers: auth={bool(auth_header)}, patient_id={patient_id}, fhir_base={fhir_base_url}", flush=True)
        
        if all([auth_header, patient_id, fhir_base_url]):
            print("[INDEX] All headers present, processing Flutter integration", flush=True)
            access_token = auth_header.replace('Bearer ', '') if auth_header.startswith('Bearer ') else auth_header
            
            try:
                print("[INDEX] Fetching patient data from FHIR", flush=True)
                from direct_fhir import get_patient_data_direct
                session_data_temp = {
                    'fhir_base_url': fhir_base_url,
                    'patient_id': patient_id,
                    'auth_token': access_token
                }
                patient_data = get_patient_data_direct(session_data_temp)
                patient_name = patient_data.get('patient', {}).get('name', 'Unknown Patient')
                print(f"[INDEX] Patient data fetched: {patient_name}", flush=True)
                
                # Save to database
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
                print(f"[INDEX] Session saved to DB: {session_id}", flush=True)
                
                # Store session ID in task for later retrieval
                print("[INDEX] Rendering template with session data", flush=True)
                
                # Fetch tasks
                pending_tasks = Task.query.filter_by(status=TaskStatus.pending).order_by(Task.updated_at.desc()).all()
                running_tasks = Task.query.filter(Task.status.in_([TaskStatus.planning, TaskStatus.executing, TaskStatus.fixing])).order_by(Task.updated_at.desc()).all()
                reviewing_tasks = Task.query.filter_by(status=TaskStatus.reviewing).order_by(Task.updated_at.desc()).all()
                completed_tasks = Task.query.filter_by(status=TaskStatus.completed).order_by(Task.completed_at.desc()).all()
                failed_tasks = Task.query.filter_by(status=TaskStatus.failed).order_by(Task.updated_at.desc()).all()
                print(f"[INDEX] Tasks loaded: pending={len(pending_tasks)}, running={len(running_tasks)}, completed={len(completed_tasks)}", flush=True)
                
                # Return HTML with session data
                response = make_response(render_template('index.html',
                    patient_data={'patient_data_summary': patient_data},
                    patient_name=patient_name,
                    pending_tasks=pending_tasks,
                    running_tasks=running_tasks,
                    reviewing_tasks=reviewing_tasks,
                    completed_tasks=completed_tasks,
                    failed_tasks=failed_tasks,
                    session_id=session_id,
                    fhir_base_url=fhir_base_url,
                    patient_id=patient_id,
                    auth_token=access_token
                ))
                print(f"[INDEX] Response prepared", flush=True)
                print(f"{'='*60}\n", flush=True)
                return response
                
            except Exception as e:
                print(f"[INDEX] ERROR processing Flutter data: {e}", flush=True)
                import traceback
                traceback.print_exc()
                logger.error(f"Error processing Flutter data: {e}")
    
    print("[INDEX] GET request - loading dashboard", flush=True)
    
    # Get the most recent patient session from database
    patient_session = PatientSession.query.order_by(PatientSession.last_accessed.desc()).first()
    
    patient_data = None
    fhir_base_url = None
    patient_id = None
    auth_token = None
    session_id = None
    
    if patient_session:
        session_id = patient_session.id
        patient_data = {'patient_data_summary': patient_session.patient_data}
        fhir_base_url = patient_session.fhir_base_url
        patient_id = patient_session.patient_id
        auth_token = patient_session.auth_token
        patient_session.last_accessed = datetime.utcnow()
        db.session.commit()
        print(f"[INDEX] Loaded session from DB: {patient_session.patient_name}", flush=True)
    else:
        print("[INDEX] No patient sessions found in DB", flush=True)
    
    print("[INDEX] Fetching tasks by status...", flush=True)
    pending_tasks = Task.query.filter_by(status=TaskStatus.pending).order_by(Task.updated_at.desc()).all()
    running_tasks = Task.query.filter(Task.status.in_([TaskStatus.planning, TaskStatus.executing, TaskStatus.fixing])).order_by(Task.updated_at.desc()).all()
    reviewing_tasks = Task.query.filter_by(status=TaskStatus.reviewing).order_by(Task.updated_at.desc()).all()
    completed_tasks = Task.query.filter_by(status=TaskStatus.completed).order_by(Task.completed_at.desc()).all()
    failed_tasks = Task.query.filter_by(status=TaskStatus.failed).order_by(Task.updated_at.desc()).all()
    print(f"[INDEX] Tasks: pending={len(pending_tasks)}, running={len(running_tasks)}, reviewing={len(reviewing_tasks)}, completed={len(completed_tasks)}, failed={len(failed_tasks)}", flush=True)
    
    print("[INDEX] Rendering template...", flush=True)
    result = render_template('index.html',
        patient_data=patient_data,
        patient_name=patient_session.patient_name if patient_session else None,
        pending_tasks=pending_tasks,
        running_tasks=running_tasks,
        reviewing_tasks=reviewing_tasks,
        completed_tasks=completed_tasks,
        failed_tasks=failed_tasks,
        session_id=session_id,
        fhir_base_url=fhir_base_url,
        patient_id=patient_id,
        auth_token=auth_token
    )
    print(f"[INDEX] Template rendered successfully ({len(result)} bytes)", flush=True)
    print(f"{'='*60}\n", flush=True)
    return result


@app.route('/task-action', methods=['POST'])
def handle_task_action():
    """Handle task actions (restart, delete, stop)"""
    action = request.form.get('action')
    task_id = request.form.get('task_id')
    print(f"[TASK-ACTION] action={action}, task_id={task_id}")
    
    if action == 'restart' and task_id:
        print(f"[TASK-ACTION] Restarting task {task_id}")
        task = Task.query.get(task_id)
        if task:
            task.status = TaskStatus.pending
            task.current_iteration = 0
            task.error_message = None
            db.session.commit()
            print(f"[TASK-ACTION] Task {task_id} reset to pending")
            execute_task(task_id)
        else:
            print(f"[TASK-ACTION] Task {task_id} not found")
    
    elif action == 'stop' and task_id:
        print(f"[TASK-ACTION] Stopping task {task_id}")
        task = Task.query.get(task_id)
        if task:
            task.status = TaskStatus.pending
            task.cancel_requested = True
            task.error_message = 'Execution stopped by user'
            db.session.commit()
            print(f"[TASK-ACTION] Task {task_id} stopped")
        else:
            print(f"[TASK-ACTION] Task {task_id} not found")
    
    elif action == 'delete' and task_id:
        print(f"[TASK-ACTION] Deleting task {task_id}")
        task = Task.query.get(task_id)
        if task:
            db.session.delete(task)
            db.session.commit()
            print(f"[TASK-ACTION] Task {task_id} deleted")
        else:
            print(f"[TASK-ACTION] Task {task_id} not found")
    
    print("[TASK-ACTION] Redirecting to index")
    return redirect(url_for('index'))


@app.route('/mini-apps')
def mini_apps_page():
    """Mini apps gallery page"""
    print("[MINI-APPS] Loading mini apps gallery")
    tasks = Task.query.filter(
        Task.status == TaskStatus.completed,
        Task.html_content.isnot(None)
    ).order_by(Task.completed_at.desc()).all()
    print(f"[MINI-APPS] Found {len(tasks)} completed mini apps")
    return render_template('mini_apps.html', tasks=tasks)


@app.route('/mini-apps/<task_id>')
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
    # Get patient data from the task itself (stored in database)
    patient_data = task.patient_data
    html_content = create_combined_html(
        task.html_content,
        task.css_content or '',
        task.js_content or '',
        patient_data
    )

    return render_template('mini_app_preview.html', html_content=html_content)


@app.route('/api/mini-apps', methods=['GET'])
def get_mini_apps():
    """
    API endpoint to return completed mini-apps for a specific patient
    """
    patient_id = request.args.get('patient_id')
    print(f"[API][MINI-APPS] Request received for patient_id: {patient_id}")

    if not patient_id:
        return jsonify({"error": "patient_id query parameter is required"}), 400

    tasks = (
        Task.query
        .filter(
            Task.status == TaskStatus.completed,
            Task.html_content.isnot(None),
            Task.patient_id == patient_id  
        )
        .all()
    )

    print(f"[API][MINI-APPS] Found {len(tasks)} completed mini-apps for patient {patient_id}")

    mini_apps = []
    for task in tasks:
        print(f"[API][MINI-APPS] Processing task ID: {task.id}")

        mini_app_data = {
            "id": task.id,
            "patient_id": task.patient_id, 
            "url": url_for(
                'mini_app_preview',
                task_id=task.id,
                _external=True
            ),
            "title": task.title,
            "description": task.description,
            "final_score": task.final_score
        }

        mini_apps.append(mini_app_data)

    print("[API][MINI-APPS] Response payload prepared")
    print(f"[API][MINI-APPS] Returning {len(mini_apps)} records")

    return jsonify({ 
        "count": len(mini_apps),
        "results": mini_apps
    })


@app.route('/mini-apps/<task_id>/raw')
def mini_app_raw(task_id):
    """Get raw HTML content for iframe embedding"""
    task = Task.query.get(task_id)

    if not task or not task.html_content:
        return '<html><body><p>No content available</p></body></html>'

    # Get patient data from the task itself (stored in database)
    patient_data = task.patient_data

    html_content = create_combined_html(
        task.html_content,
        task.css_content or '',
        task.js_content or '',
        patient_data
    )

    return html_content


# =============================================================================
# API ROUTES
# =============================================================================

@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    print("[HEALTH] Health check requested")
    llm_info = check_llm_available()
    print(f"[HEALTH] LLM available: {llm_info['available']}")
    return jsonify({
        'status': 'healthy',
        'version': '1.0.0',
        'llm_info': llm_info
    })


@app.route('/api/debug/session')
def debug_session():
    """Debug endpoint to check session data"""
    from flutter_session import flutter_session
    session_id = request.cookies.get('flutter_session_id')
    
    if not session_id:
        return jsonify({'error': 'No session found'}), 404
    
    session_data = flutter_session.get_session(session_id)
    if not session_data:
        return jsonify({'error': 'Session expired or invalid'}), 404
    
    # Return sanitized session data
    return jsonify({
        'session_id': session_id,
        'patient_id': session_data.get('patient_id'),
        'patient_name': session_data.get('patient_name'),
        'fhir_base_url': session_data.get('fhir_base_url'),
        'has_patient_data': 'patient_data' in session_data,
        'patient_data_keys': list(session_data.get('patient_data', {}).keys()) if session_data.get('patient_data') else [],
        'patient_info': session_data.get('patient_data', {}).get('patient') if session_data.get('patient_data') else None
    })


@app.route('/api/status')
def get_status():
    """Get application status"""
    print(f"[DEBUG] GET /api/status - checking status")
    llm_info = check_llm_available()
    fhir_context = get_fhir_context_from_cookies()
    print(f"[DEBUG] GET /api/status - fhir_configured={bool(fhir_context.get('fhir_base_url'))}, patient_id={fhir_context.get('patient_id')}")
    
    return jsonify({
        'llm_available': llm_info['available'],
        'llm_info': llm_info,
        'fhir_configured': bool(fhir_context.get('fhir_base_url')),
        'patient_id': fhir_context.get('patient_id'),
        'patient_name': fhir_context.get('patient_name')
    })


@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Get all tasks"""
    print(f"[DEBUG] GET /api/tasks - fetching all tasks")
    tasks = Task.query.order_by(Task.updated_at.desc()).all()
    print(f"[DEBUG] GET /api/tasks - found {len(tasks)} tasks")
    return jsonify([t.to_dict() for t in tasks])


@app.route('/api/tasks/<task_id>', methods=['GET'])
def get_task(task_id):
    """Get a specific task"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    return jsonify(task.to_dict())


@app.route('/create-task', methods=['POST'])
def create_task_form():
    """Create task from form submission"""
    print("[CREATE-TASK] Form submitted", flush=True)
    title = request.form.get('title')
    description = request.form.get('description', '')
    specification = request.form.get('specification', '')
    complexity = request.form.get('complexity', 'standard')
    print(f"[CREATE-TASK] title={title}", flush=True)
    
    if not title:
        print("[CREATE-TASK] No title provided, redirecting", flush=True)
        return redirect(url_for('index'))
    
    # Get latest patient session from DB
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
    execute_task(task_id)
    
    print("[CREATE-TASK] Redirecting to index", flush=True)
    return redirect(url_for('index'))


# Receive audio chunks and transcribe
@app.route("/api/speech-to-text", methods=["POST"])
def speech_to_text():
    if "audio" not in request.files:
        return jsonify({"error": "audio missing"}), 400

    audio_file = request.files["audio"]
    audio_bytes = audio_file.read()

    try:
        response = model.generate_content([
            {"mime_type": audio_file.mimetype, "data": audio_bytes},
            "Transcribe this audio accurately."
        ])
        return jsonify({"text": response.text.strip()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500



@app.route('/generate-idea', methods=['POST'])
def generate_idea_form():
    """Generate idea from form"""
    print("[GENERATE-IDEA] Form submitted", flush=True)
    prompt = request.form.get('prompt', '')
    print(f"[GENERATE-IDEA] prompt={prompt[:50]}...", flush=True)
    
    if not prompt:
        print("[GENERATE-IDEA] No prompt provided, redirecting", flush=True)
        return redirect(url_for('index'))
    
    try:
        print("[GENERATE-IDEA] Calling LLM service", flush=True)
        llm = ClaudeLLMService()
        idea = llm.generate_idea(prompt)
        print(f"[GENERATE-IDEA] Idea generated: {len(idea)} chars", flush=True)
        
        # Render index with the generated idea
        patient_session = PatientSession.query.order_by(PatientSession.last_accessed.desc()).first()
        patient_data = None
        if patient_session:
            patient_data = {'patient_data_summary': patient_session.patient_data}
        
        pending_tasks = Task.query.filter_by(status=TaskStatus.pending).order_by(Task.updated_at.desc()).all()
        running_tasks = Task.query.filter(Task.status.in_([TaskStatus.planning, TaskStatus.executing, TaskStatus.fixing])).order_by(Task.updated_at.desc()).all()
        reviewing_tasks = Task.query.filter_by(status=TaskStatus.reviewing).order_by(Task.updated_at.desc()).all()
        completed_tasks = Task.query.filter_by(status=TaskStatus.completed).order_by(Task.completed_at.desc()).all()
        failed_tasks = Task.query.filter_by(status=TaskStatus.failed).order_by(Task.updated_at.desc()).all()
        
        return render_template('index.html',
            patient_data=patient_data,
            pending_tasks=pending_tasks,
            running_tasks=running_tasks,
            reviewing_tasks=reviewing_tasks,
            completed_tasks=completed_tasks,
            failed_tasks=failed_tasks,
            generated_idea=idea,
            idea_prompt=prompt,
            show_idea_view=True
        )
    except Exception as e:
        print(f"[GENERATE-IDEA] ERROR: {e}", flush=True)
        logger.error(f"Error generating idea: {e}")
        return redirect(url_for('index'))


@app.route('/api/tasks/<task_id>', methods=['PATCH', 'PUT'])
def update_task(task_id):
    """Update a task"""
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


@app.route('/api/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    db.session.delete(task)
    db.session.commit()
    
    return jsonify({'message': 'Task deleted'})


@app.route('/api/tasks/<task_id>/run', methods=['POST'])
def run_task(task_id):
    """Run/restart a task"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    task.status = TaskStatus.pending
    task.current_iteration = 0
    task.error_message = None
    task.cancel_requested = False
    db.session.commit()
    
    execute_task(task_id)
    
    return jsonify(task.to_dict())


@app.route('/api/tasks/<task_id>/cancel', methods=['POST'])
def cancel_task(task_id):
    """Cancel a running task - move to pending"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    
    # Only allow cancelling tasks that are in progress
    if task.status not in [TaskStatus.planning, TaskStatus.executing, TaskStatus.reviewing, TaskStatus.fixing]:
        return jsonify({'error': 'Task is not running'}), 400
    
    # Immediately move to pending
    task.status = TaskStatus.pending
    task.cancel_requested = True
    task.error_message = 'Execution stopped by user'
    db.session.commit()
    
    logger.info(f"Task {task_id} stopped and moved to pending")

    return jsonify({'message': 'Task stopped and moved to pending', 'task': task.to_dict()})


@app.route('/api/tasks/<task_id>/continue', methods=['POST'])
def continue_task(task_id):
    """Continue a completed task with incremental changes"""
    task = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    if task.status != TaskStatus.completed:
        return jsonify({'error': 'Can only continue completed tasks'}), 400

    if not task.html_content:
        return jsonify({'error': 'No existing content to modify'}), 400

    data = request.get_json()
    changes = data.get('changes', '')

    if not changes:
        return jsonify({'error': 'Changes description required'}), 400

    # Store the changes request in the task specification
    original_spec = task.specification or ''
    task.specification = f"{original_spec}\n\n--- INCREMENTAL CHANGES ---\n{changes}"

    # Mark task for continuation (will preserve existing code)
    task.status = TaskStatus.pending
    task.current_iteration = 0
    task.error_message = None
    task.cancel_requested = False
    db.session.commit()

    add_task_log(task_id, f"Continuing task with changes: {changes[:100]}...", 'info')

    # Execute with continuation mode
    execute_continuation_task(task_id, changes)

    return jsonify({'message': 'Applying changes...', 'task': task.to_dict()})


def execute_continuation_task(task_id: str, changes: str):
    """Execute incremental changes on an existing task"""
    with app.app_context():
        task = Task.query.get(task_id)
        if not task:
            return

        try:
            task.status = TaskStatus.planning
            task.current_iteration += 1
            db.session.commit()
            add_task_log(task_id, "Analyzing requested changes...", 'info')

            if task.cancel_requested:
                task.status = TaskStatus.cancelled
                db.session.commit()
                return

            task.status = TaskStatus.executing
            db.session.commit()
            add_task_log(task_id, "Applying incremental changes with Claude AI...", 'info')

            # Get existing content
            existing_html = task.html_content or ''
            existing_css = task.css_content or ''
            existing_js = task.js_content or ''

            # Call LLM with continuation prompt
            llm = ClaudeLLMService()
            html_content, css_content, js_content, llm_response = llm.continue_mini_app(
                existing_html,
                existing_css,
                existing_js,
                changes,
                task.patient_data
            )

            # Save updated content
            task.html_content = html_content
            task.css_content = css_content
            task.js_content = js_content
            db.session.commit()

            # Save to files
            saved_files = save_generated_files(task_id, html_content, css_content, js_content)
            task.generated_files = list(saved_files.values())
            db.session.commit()

            add_task_log(task_id, f"Changes applied. Files updated: {list(saved_files.keys())}", 'info')

            # Review
            task.status = TaskStatus.reviewing
            db.session.commit()
            add_task_log(task_id, "Reviewing updated code...", 'info')

            score, feedback = llm.review_generated_code(
                html_content,
                css_content or '',
                js_content or '',
                f"{task.title}\n{changes}"
            )

            task.final_score = score
            task.status = TaskStatus.completed
            task.completed_at = datetime.utcnow()
            db.session.commit()

            add_task_log(task_id, f"Changes complete with score: {score}/10", 'info')

        except Exception as e:
            logger.error(f"Error continuing task {task_id}: {e}")
            task.status = TaskStatus.failed
            task.error_message = str(e)
            db.session.commit()
            add_task_log(task_id, f"Failed to apply changes: {str(e)}", 'error')


@app.route('/api/tasks/<task_id>/logs', methods=['GET'])
def get_task_logs(task_id):
    """Get logs for a task"""
    logs = TaskLog.query.filter_by(task_id=task_id).order_by(TaskLog.created_at.desc()).all()
    return jsonify([log.to_dict() for log in logs])


@app.route('/api/logs', methods=['GET'])
def get_all_logs():
    """Get all logs"""
    logs = TaskLog.query.order_by(TaskLog.created_at.desc()).limit(100).all()
    return jsonify([log.to_dict() for log in logs])


@app.route('/api/clear-patient-data', methods=['POST'])
def clear_patient_data():
    """Clear patient data from cookies"""
    response = make_response(jsonify({'message': 'Patient data cleared'}))
    response.delete_cookie('fhir_base_url')
    response.delete_cookie('patient_id')
    response.delete_cookie('fhir_token')
    response.delete_cookie('patient_name')
    response.delete_cookie('patient_data')
    return response


# =============================================================================
# TASK EXECUTION
# =============================================================================

def execute_task(task_id: str):
    """Execute a task - generate mini app using LLM"""
    print(f"[EXECUTE-TASK] Starting execution for task {task_id}")
    with app.app_context():
        task = Task.query.get(task_id)
        if not task:
            print(f"[EXECUTE-TASK] Task {task_id} not found")
            logger.error(f"Task {task_id} not found")
            return
        
        # Check if cancellation was requested
        if task.cancel_requested:
            print(f"[EXECUTE-TASK] Task {task_id} was cancelled")
            task.status = TaskStatus.failed
            task.error_message = 'Task was cancelled'
            db.session.commit()
            add_task_log(task_id, "Task cancelled", 'warning')
            return
        
        try:
            # Update status to planning
            print(f"[EXECUTE-TASK] Task {task_id} -> planning")
            task.status = TaskStatus.planning
            task.current_iteration += 1
            db.session.commit()

            # Detailed planning logs
            add_task_log(task_id, "Starting mini app generation...", 'info')
            add_task_log(task_id, f"Task: {task.title}", 'info')
            add_task_log(task_id, "Analyzing requirements and specifications...", 'info')

            # Store plan in task for display
            plan_text = f"""

**Task:** {task.title}

**Description:** {task.description or 'No description provided'}

**Technical Specification:**
{task.specification or 'No specification provided'}

**Complexity:** {task.complexity.value if task.complexity else 'standard'}

---
### Generation Steps:
1. Analyzing patient data context
2. Designing UI/UX layout
3. Generating HTML structure
4. Creating CSS styles
5. Writing JavaScript logic
6. Integrating patient data
7. Review and scoring"""
            task.plan = plan_text
            db.session.commit()

            # Check for cancellation after planning phase
            if check_cancellation(task_id):
                print(f"[EXECUTE-TASK] Task {task_id} cancelled during planning")
                return

            # Get patient data
            print(f"[EXECUTE-TASK] Getting patient data for task {task_id}")
            add_task_log(task_id, "Loading patient data context...", 'info')
            patient_data = task.patient_data
            if not patient_data and task.fhir_base_url and task.patient_id:
                print(f"[EXECUTE-TASK] No patient data, trying to fetch from FHIR")
                fhir_token = request.cookies.get('fhir_token', '') if request else ''
                if fhir_token:
                    try:
                        patient_data = get_patient_data_for_llm(
                            task.fhir_base_url, 
                            fhir_token, 
                            task.patient_id
                        )
                        task.patient_data = patient_data
                        db.session.commit()
                        print(f"[EXECUTE-TASK] Patient data fetched from FHIR")
                    except Exception as e:
                        print(f"[EXECUTE-TASK] Could not fetch patient data: {e}")
                        logger.warning(f"Could not fetch patient data: {e}")
            
            # Require real patient data - no demo/fake data
            if not patient_data:
                print(f"[EXECUTE-TASK] ERROR: No patient data available")
                raise Exception("No patient data available. Please ensure a patient session is active before creating tasks.")
            
            # Update status to executing
            print(f"[EXECUTE-TASK] Task {task_id} -> executing")
            task.status = TaskStatus.executing

            # Update plan to show progress
            task.plan = task.plan.replace("2. Designing UI/UX layout", "2. Designing UI/UX layout")
            db.session.commit()

            add_task_log(task_id, "Designing UI/UX layout...", 'info')
            add_task_log(task_id, "Claude AI is generating code...", 'info')

            # Check for cancellation before generating
            if check_cancellation(task_id):
                print(f"[EXECUTE-TASK] Task {task_id} cancelled before generation")
                return

            # Generate mini app
            print(f"[EXECUTE-TASK] Calling LLM to generate mini app")
            llm = ClaudeLLMService()
            user_prompt = f"{task.title}\n\n{task.description or ''}\n\n{task.specification or ''}"

            add_task_log(task_id, "Generating HTML structure...", 'info')

            html_content, css_content, js_content, llm_response = llm.generate_mini_app(
                user_prompt,
                patient_data
            )
            print(f"[EXECUTE-TASK] Mini app generated: html={len(html_content)} chars, css={len(css_content or '')} chars, js={len(js_content or '')} chars")

            # Update plan progress
            task.plan = task.plan.replace("3. Generating HTML structure", "3. Generating HTML structure")
            task.plan = task.plan.replace("4. Creating CSS styles", "4. Creating CSS styles")
            task.plan = task.plan.replace("5. Writing JavaScript logic", "5. Writing JavaScript logic")
            task.plan = task.plan.replace("6. Integrating patient data", "6. Integrating patient data")
            db.session.commit()

            add_task_log(task_id, "CSS styles created", 'info')
            add_task_log(task_id, "JavaScript logic written", 'info')
            add_task_log(task_id, f"Generated: HTML ({len(html_content)} chars), CSS ({len(css_content or '')} chars), JS ({len(js_content or '')} chars)", 'info')
            
            # Save generated content
            task.html_content = html_content
            task.css_content = css_content
            task.js_content = js_content
            db.session.commit()
            print(f"[EXECUTE-TASK] Content saved to database")
            
            # Save to files
            saved_files = save_generated_files(task_id, html_content, css_content, js_content)
            task.generated_files = list(saved_files.values())
            db.session.commit()
            print(f"[EXECUTE-TASK] Files saved: {list(saved_files.keys())}")
            
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
            print(f"[EXECUTE-TASK] Generation record saved")
            
            # Review the generated code
            print(f"[EXECUTE-TASK] Task {task_id} -> reviewing")
            task.status = TaskStatus.reviewing
            task.plan = task.plan.replace("7. Review and scoring", "7. Review and scoring")
            db.session.commit()
            add_task_log(task_id, "Reviewing generated code with AI...", 'info')

            # Check for cancellation before review
            if check_cancellation(task_id):
                print(f"[EXECUTE-TASK] Task {task_id} cancelled before review")
                return

            print(f"[EXECUTE-TASK] Calling LLM to review code")
            score, feedback = llm.review_generated_code(
                html_content,
                css_content or '',
                js_content or '',
                user_prompt
            )
            print(f"[EXECUTE-TASK] Review complete: score={score}/10")

            # Update generation with review
            generation.score = score
            generation.feedback = feedback

            # Update task with final score
            task.final_score = score
            task.status = TaskStatus.completed
            task.completed_at = datetime.utcnow()
            db.session.commit()

            add_task_log(task_id, f"Task completed with score: {score}/10", 'info', {'score': score, 'feedback': feedback})
            print(f"[EXECUTE-TASK] Task {task_id} completed successfully with score {score}")
            logger.info(f"Task {task_id} completed successfully with score {score}")
            
        except Exception as e:
            print(f"[EXECUTE-TASK] ERROR executing task {task_id}: {e}")
            logger.error(f"Error executing task {task_id}: {e}")
            task.status = TaskStatus.failed
            task.error_message = str(e)
            db.session.commit()
            add_task_log(task_id, f"Task failed: {str(e)}", 'error')


# =============================================================================
# STATIC FILES
# =============================================================================

@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return send_from_directory('static', filename)


@app.route('/generated_apps/<path:filename>')
def serve_generated(filename):
    """Serve generated app files"""
    return send_from_directory(OUTPUT_FOLDER, filename)


# =============================================================================
# ERROR HANDLERS
# =============================================================================

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500


# =============================================================================
# MAIN
# =============================================================================

if __name__ == '__main__':
    # Create output folder if not exists
    os.makedirs(OUTPUT_FOLDER, exist_ok=True)
    
    # Run the app
    port = int(os.getenv('PORT', 2000))
    debug = os.getenv('FLASK_DEBUG', 'true').lower() == 'true'
    
    logger.info(f"Starting CareIT Vibe Mini App Generator on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)
