# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Setup
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run (default port 2000)
python app.py

# Restart running instance
bash restart_app.sh

# Migrate database schema (adds new columns to existing SQLite DB)
python migrate_db.py
```

Required environment variables (`.env`):
```
ANTHROPIC_API_KEY=...
SECRET_KEY=...
DATABASE_URL=sqlite:///careit_vibe.db   # optional, this is the default
CAREIT_BASE_URL=...                     # for organization/department API
CAREIT_USERNAME=...
CAREIT_PASSWORD=...
```

## Architecture

This is a **Flask** web app that generates SMART on FHIR healthcare mini-apps (HTML/CSS/JS) using Claude AI. It is embedded in a Flutter mobile app via webview.

### Two Generation Paths

**Dashboard path** (`POST /create-task` → `routes/tasks_api.py`):
1. Flutter sends credentials via `Authorization`, `X-Patient-Id`, `X-FHIR-Base` headers to `POST /`
2. Server stores a `PatientSession` and sets a `fhir_token` cookie
3. Task is created as `pending`; user manually starts it
4. `execute_task()` in `services/executor.py` calls `ClaudeLLMService.generate_mini_app()` with cached `task.patient_data`
5. Generated HTML/CSS/JS saved to `generated_apps/<task_id>/` and to the DB
6. `review_generated_code()` scores the output 0–10; task → `completed`

**Quick-generate path** (`POST /api/quick/generate` → `quick_generate_api.py`):
1. Request includes `patientId`, `fhirBaseUrl`, `accessToken` in JSON body
2. `run_generation()` in `services/executor.py` runs in a background thread
3. **Agentic retrieval pipeline** (non-obvious — runs before LLM generation):
   - `get_supported_resources()` probes the FHIR server's `/metadata`
   - `plan_retrieval()` asks Claude to choose which FHIR resource types are needed
   - `execute_retrieval()` fetches those resources from FHIR
   - `format_context()` filters to non-empty sections + embeds the retrieval plan
4. `ClaudeLLMService.generate_mini_app()` uses the fetched context
5. Same review + scoring step as the dashboard path

When `patient_id == 'all'`, the quick-generate path fetches all patients across the ward and groups their data by patient ID before passing it to the LLM.

### Key Files

| File | Purpose |
|------|---------|
| `app.py` | App factory, blueprint registration, CORS, error handlers |
| `models.py` | SQLAlchemy models: `Task`, `TaskLog`, `Generation`, `PatientSession`, `Bookmark` |
| `llm_service.py` | `ClaudeLLMService` — generation, continuation, review, idea generation; `_parse_response()` extracts fenced code blocks |
| `fhir_service.py` | `FHIRService` class — authenticated FHIR R4 requests (used by dashboard path) |
| `direct_fhir.py` | `DirectFHIRClient` — probes FHIR metadata, fetches resources, normalises into `{count, summary, resources}` dicts |
| `services/executor.py` | `execute_task`, `execute_continuation_task`, `execute_miniapp_task`, `run_generation` |
| `services/retrieval_planner.py` | Asks Claude to pick FHIR resource types needed for a prompt → `RetrievalPlan` |
| `services/retrieval_executor.py` | Runs a `RetrievalPlan` against FHIR, groups all-patient data by patient ID |
| `services/context_formatter.py` | Strips empty sections from retrieval result, embeds `_retrieval` plan metadata |
| `services/patient_context_service.py` | `load_patient_context` / `load_latest_patient_session` — creates/reuses `PatientSession` records |
| `backend_service.py` | `/api/backend/*` — Flutter-facing endpoints, task creation, streaming mini-app delivery via `_inject_patient_data()` |
| `quick_generate_api.py` | `/api/quick/*` — fast generation, voice transcript extraction |
| `routes/careitweb_llm.py` | `enhance_transfer_meta()` — Claude-generated title/description/icon for CIW transfers |
| `utils/auth.py` | `require_bearer` (Bearer or cookie); `require_bearer_or_basic` (also validates Smile CDR Basic Auth) |
| `utils/helpers.py` | `add_task_log`, `save_generated_files`, `check_cancellation`, `OUTPUT_FOLDER` |
| `migrate_db.py` | Raw SQLite migration script for adding columns to `tasks` |

### Blueprints

| Blueprint | Prefix | Description |
|-----------|--------|-------------|
| `web` | `/` | Dashboard UI, Flutter init handler |
| `mini_apps` | `/mini-apps` | Gallery, preview, raw HTML |
| `tasks_api` | `/api/tasks` | Task CRUD, run/cancel/logs; also `POST /create-task` (form) |
| `misc_api` | `/api/` | Idea generation, LLM status |
| `organization` | `/api/` | Department list from CareIT FHIR |
| `location` | `/api/` | Ward/location data |
| `bookmarks` | `/api/` | Bookmark management |
| `backend_service` | `/api/backend` | Flutter integration, dashboard data, mini-app streaming |
| `quick_generate` | `/api/quick` | Fast generation (`/generate`, `/summary`), transcript extraction (`/extract`, `/v1/extract/`, `/questionnaire/v1`), status polling (`/status/<id>`) |

### LLM Prompts

Prompt templates live in `prompts/` as Markdown files with `$variable` placeholders (`string.Template.safe_substitute`):
- `generate_miniapp.md` — main generation prompt
- `continue_miniapp.md` — incremental change prompt
- `generate_idea.md` — idea brainstorming
- `extraction/` — 6 modular files composed at runtime by `_build_extraction_system()` for voice transcript extraction

All Claude calls use `claude-sonnet-4-20250514` at `max_tokens=20000`.

### Task Lifecycle

`pending` → `planning` → `executing` → `reviewing` → `completed` (or `failed` / `cancelled` / `fixing`)

Tasks run in daemon background threads. Background thread functions receive `app._get_current_object()` so that SQLAlchemy sessions work correctly inside the thread context. `check_cancellation()` is polled between stages; setting `task.cancel_requested = True` stops execution at the next checkpoint.

### CIW Transfer

Completed mini-apps can be transferred to CareITWeb (CIW). `routes/careitweb_llm.py` provides `enhance_transfer_meta()` which uses Claude to generate a cleaned title, description, and Material Design icon name. Transfer metadata columns on `Task`: `transferred`, `transfer_status`, `transfer_roles`, `transfer_show_at`, `transfer_dept_name`, `transfer_ward`, `transfer_icon`. Allowed values are defined in `CIWTransfer` in `models.py`.

### Database

SQLite via Flask-SQLAlchemy. DB file is at `instance/careit_vibe.db`. Schema is auto-created by `init_db()` on startup. Use `migrate_db.py` when adding columns to the `tasks` table on existing deployments.
