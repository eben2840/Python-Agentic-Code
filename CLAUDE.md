# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CareIT Vibe Mini App Generator is a Flask-based application that generates SMART on FHIR compliant mini healthcare applications using Claude AI (Sonnet 4). It integrates with FHIR servers to fetch patient data and generates custom, responsive healthcare dashboards and applications on demand.

## Development Commands

### Setup and Installation

```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and set: ANTHROPIC_API_KEY=your_key_here
```

### Running the Application

```bash
# Run development server
python app.py

# Server starts at http://localhost:5000 (port configurable via PORT env var)
# Debug mode controlled by FLASK_DEBUG env var (defaults to true)
```

### Database Management

```bash
# Initialize database (auto-creates SQLite DB on first run)
# Database file: instance/careit_vibe.db

# Migration script (if needed)
python migrate_db.py
```

### Testing FHIR Integration

```bash
# Test FHIR service directly
python direct_fhir.py

# Test session management
python test_session.py
```

## High-Level Architecture

### Core Application Flow

The application follows a **session-based, task-driven architecture** with three main phases:

1. **Authentication & Session Initialization**
   - Flutter mobile app sends FHIR credentials via secure HTTP headers (Authorization, X-Patient-Id, X-FHIR-Base)
   - Backend creates `PatientSession` in database with fetched FHIR data
   - Session persists across requests, eliminating need for cookies

2. **Task Creation & Execution**
   - Users create tasks describing desired mini-apps (title, description, specification, complexity)
   - Tasks start in `pending` state and transition through: `planning` → `executing` → `reviewing` → `completed`
   - Each task is linked to patient data from active session

3. **AI-Powered Code Generation**
   - Claude AI receives patient FHIR data + user prompt
   - Generates complete HTML/CSS/JS mini-apps (self-contained, no backend required)
   - AI reviews own code and provides 0-10 quality score
   - Generated apps saved to `generated_apps/{task_id}/` directory

### Key Architectural Patterns

**Separation of Concerns:**
- `app.py` - Main Flask app with routes and orchestration
- `backend_service.py` - Blueprint handling frontend logic in Python (instead of JS)
- `models.py` - SQLAlchemy database models (Task, TaskLog, Generation, PatientSession)
- `fhir_service.py` - FHIR server integration (fetch patient resources)
- `llm_service.py` - Claude AI integration (generate, review, continue mini-apps)
- `direct_fhir.py` - Direct FHIR data fetching utilities
- `flutter_session.py` - Session management utilities

**Database Models:**
- `Task` - Stores mini-app generation tasks with status tracking
- `TaskLog` - Audit trail for task execution steps
- `Generation` - Historical record of each generation iteration
- `PatientSession` - Persistent patient sessions with FHIR data and auth tokens

**Task Status Lifecycle:**
```
pending → planning → executing → reviewing → completed
                                          ↘ failed
                                          ↘ cancelled (via cancel_requested flag)
```

**FHIR Data Flow:**
```
Flutter App → Flask Backend → FHIR Server
                ↓
         PatientSession (DB)
                ↓
         Task Creation
                ↓
         Claude AI (with patient data)
                ↓
         Generated Mini App
```

### Critical Design Decisions

**Why Session in Database (not cookies):**
- FHIR auth tokens can be large and should not be exposed in browser
- Patient data is comprehensive (observations, conditions, medications, etc.)
- Database storage enables multi-device access and persistence
- Retrieved via `PatientSession.query.order_by(last_accessed.desc()).first()`

**Why Separate HTML/CSS/JS Files:**
- LLM initially generates code in separate blocks (```html, ```css, ```javascript)
- Backend extracts embedded styles/scripts if needed (`_parse_response`)
- Files saved separately to `generated_apps/{task_id}/` for modularity
- Combined back together for preview/embedding via `create_combined_html()`

**Why Two-Phase Execution (Pending → Running):**
- Tasks created in `pending` state, not auto-executed
- User explicitly starts execution via "Start Task" button
- Prevents accidental API consumption and allows review before execution
- Execute via: `POST /api/tasks/{id}/run`

**Why Self-Review with Claude:**
- Claude reviews its own generated code for quality assurance
- Provides 0-10 score based on completeness, code quality, UI/UX, data handling
- Feedback stored in `Generation.feedback` for improvement tracking

## Important Implementation Details

### FHIR Integration Specifics

**Supported Resources:**
- Patient (demographics: name, gender, birthDate)
- Observation (vitals, labs: blood pressure, heart rate, glucose, etc.)
- Condition (diagnoses: diabetes, hypertension, etc.)
- MedicationRequest (current/past medications with dosages)
- AllergyIntolerance (allergies and intolerances with criticality)
- Encounter (visits, appointments)
- Procedure (medical procedures performed)
- Immunization (vaccination records)
- CarePlan (treatment plans)

**Data Summarization:**
- Full FHIR resources stored in `patient_data['resources']`
- Simplified summaries in `patient_data['summary']` for LLM consumption
- Example: `observations.summary[{code, value, unit, date, status}]`

### LLM Service Configuration

**Model:** `claude-sonnet-4-20250514` (Claude 3.5 Sonnet)
**Max Tokens:** 8192
**Temperature:** 0.3 (lower for consistent UI generation)

**System Prompt Strategy:**
- Emphasizes UI/UX excellence over technical complexity
- Requires Bootstrap 5, Chart.js, Font Awesome via CDN
- Enforces separation: HTML references `styles.css` and `app.js`
- Patient data injected as `window.PATIENT_DATA` global variable

**Response Parsing:**
- Extracts code blocks: ````html`, ````css`, ````javascript`
- Falls back to extracting embedded `<style>` and `<script>` tags
- Removes embedded code and adds external file references
- Critical: Always returns 3 separate strings (html, css, js)

### Generated Mini-App Characteristics

**Technical Stack:**
- HTML5 with semantic markup
- Bootstrap 5 for responsive grid
- Chart.js for data visualizations
- Font Awesome for medical icons
- Vanilla JavaScript (no frameworks)

**Data Access Pattern:**
```javascript
// Patient data embedded by backend
const patientData = window.PATIENT_DATA;

// Structure:
patientData.patient // {id, name, gender, birthDate}
patientData.observations // {count, summary: [{code, value, unit, date}]}
patientData.conditions // {count, summary: [{condition, status, onset}]}
patientData.medications // {count, summary: [{medication, status, dosage}]}
patientData.allergies // {count, summary: [{allergen, type, criticality}]}
```

**Design Requirements:**
- Mobile-first, responsive layout
- Healthcare color scheme (blues/greens, high contrast)
- WCAG 2.1 accessible (screen reader friendly)
- Professional medical-grade appearance
- Touch-friendly buttons and swipe gestures

### Task Execution Flow

**Backend Orchestration (app.py):**
```python
execute_task(task_id)  # Main entry point
  → Phase 1: Planning (analyze requirements)
  → Phase 2: Executing (call Claude AI)
  → Phase 3: Reviewing (AI self-review)
  → Phase 4: Completed (save results)
```

**Parallel Backend Service (backend_service.py):**
```python
execute_miniapp_task(task_id)  # Alternative execution path
  → Similar phases but handles cancellation checks
  → Used by backend blueprint routes
```

**Cancellation Mechanism:**
- Set `task.cancel_requested = True`
- Each phase checks cancellation before proceeding
- Task moved to `TaskStatus.cancelled` if flag detected

### File Generation and Storage

**Output Structure:**
```
generated_apps/
  └── {task_id}/
      ├── index.html
      ├── styles.css
      └── app.js
```

**File Saving:**
- `save_generated_files(task_id, html, css, js)` creates task folder
- Paths stored in `task.generated_files` list
- Combined HTML served via `/mini-apps/{id}/raw` for preview

**Preview Modes:**
- `/mini-apps/{id}` - Modal preview with `mini_app_preview.html` template
- `/mini-apps/{id}/raw` - Raw combined HTML for iframe embedding
- `/api/backend/view-app/{id}` - Direct full-page view with progress indicator

## Common Workflows

### Adding a New FHIR Resource

1. Add fetch method to `FHIRService` class in `fhir_service.py`
2. Add summarization method (e.g., `_summarize_new_resource`)
3. Update `get_full_patient_data()` to include new resource
4. Update LLM system prompt in `llm_service.py` to inform Claude of new data

### Modifying Task Complexity Levels

- Edit `TaskComplexity` enum in `models.py`
- Update `_build_system_prompt()` in `llm_service.py` with new guidance
- Complexity affects LLM instructions (simple, standard, complex)

### Adding New API Endpoints

- Main routes → `app.py`
- Backend service routes → `backend_service.py` with `/api/backend/` prefix
- Always register blueprint: `app.register_blueprint(backend_service)`

### Handling Session Expiration

Current implementation does NOT expire sessions automatically. To add:
1. Check `PatientSession.created_at` vs `datetime.utcnow()`
2. Return 401 if expired (see FHIR_INTEGRATION_DOCUMENTATION.md example)
3. Frontend should catch 401 and re-authenticate via Flutter app

## Security Considerations

**Current State (Development):**
- Auth tokens stored in plaintext in `PatientSession.auth_token`
- CORS allows all origins (`Access-Control-Allow-Origin: *`)
- FHIR requests over HTTP allowed
- No token expiration enforcement

**Production Requirements:**
- Encrypt tokens with `cryptography.fernet.Fernet` before DB storage
- Whitelist specific CORS origins
- Enforce HTTPS for all communications
- Implement token refresh mechanism
- Add rate limiting on API endpoints
- Validate FHIR base URLs (protocol, domain)

**Token Security Pattern (for production):**
```python
from cryptography.fernet import Fernet
cipher = Fernet(os.getenv('ENCRYPTION_KEY'))
encrypted = cipher.encrypt(token.encode())
# Store encrypted, decrypt when needed
```

## Debugging and Troubleshooting

### Common Issues

**"No patient session found":**
- Check: `PatientSession.query.all()` to see if any sessions exist
- Solution: Re-initialize via `POST /` with Flutter headers
- Check logs for FHIR fetch errors

**"Task stuck in running status":**
- Check: `TaskLog.query.filter_by(task_id=id).all()` for error logs
- Solution: Cancel via `POST /api/tasks/{id}/cancel`, then restart
- May indicate Claude API timeout or error

**"Generated HTML is empty":**
- Check: LLM response in `Generation.llm_response`
- Issue: Claude may not have returned properly formatted code blocks
- Solution: Review system prompt in `llm_service.py`, ensure format instructions clear

### Logging

- Application logs to console with timestamps
- Log level: INFO (configured in `app.py`)
- Task execution logs to `TaskLog` table (queryable via `/api/tasks/{id}/logs`)
- Enable DEBUG logging: Set `FLASK_DEBUG=true` in `.env`

## Dependencies and Environment

**Key Dependencies:**
- `flask` - Web framework
- `flask-sqlalchemy` - ORM for database
- `anthropic` - Claude AI SDK
- `requests` - HTTP client for FHIR
- `python-dotenv` - Environment variable management

**Environment Variables:**
- `ANTHROPIC_API_KEY` (required) - Claude API key
- `SECRET_KEY` (optional) - Flask secret, defaults to dev key
- `DATABASE_URL` (optional) - Database URI, defaults to SQLite
- `PORT` (optional) - Server port, defaults to 2000
- `FLASK_DEBUG` (optional) - Debug mode, defaults to true

**Python Version:** Compatible with Python 3.7+

## Code Style and Conventions

- Use 4-space indentation
- SQLAlchemy models use `db.Column` syntax
- Routes use descriptive function names matching URL patterns
- Task execution functions take `task_id` parameter, query fresh from DB
- Always commit DB changes after mutations: `db.session.commit()`
- Log important actions: `logger.info()`, `logger.error()`
- Add task logs for user-visible progress: `add_task_log(task_id, message, level)`

## Frontend Integration Notes

**Dashboard Rendering:**
- Main template: `templates/index.html`
- Mini app preview: `templates/mini_app_preview.html`
- Mini apps gallery: `templates/mini_apps.html`

**Task Categories Displayed:**
- Pending tasks (awaiting start)
- Running tasks (planning/executing/fixing)
- Reviewing tasks (AI review in progress)
- Completed tasks (with score display)
- Failed tasks (with error message)

**AJAX Polling Pattern:**
Frontend should poll `GET /api/backend/task/{id}/status` every 2-3 seconds during task execution to update progress in real-time.

## Related Documentation

- `README.md` - User-facing setup and usage guide
- `FHIR_INTEGRATION_DOCUMENTATION.md` - Comprehensive FHIR integration details with examples
- `risk_to_do.md` - Known issues and future improvements

## Notes for Future Development

**Potential Improvements:**
- Implement WebSocket for real-time task updates (replace polling)
- Add user authentication system (currently single-user)
- Support multiple concurrent patient sessions
- Add mini-app versioning (track iterations over time)
- Implement template library (reusable mini-app patterns)
- Add automated testing suite
- Docker containerization for deployment
- CI/CD pipeline integration
