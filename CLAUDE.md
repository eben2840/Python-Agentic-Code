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

### Request Flow

1. Flutter app sends patient credentials via headers (`Authorization`, `X-Patient-Id`, `X-FHIR-Base`) to `POST /`
2. Server fetches FHIR patient data and stores it in a `PatientSession` + a cookie (`fhir_token`)
3. User creates a `Task` describing the mini-app they want
4. Task is executed in a background thread — `services/executor.py` calls `ClaudeLLMService` to generate HTML/CSS/JS
5. Generated files are saved to `generated_apps/<task_id>/` and stored in the DB
6. Code is scored 0–10 by a second Claude call; task transitions to `completed`

### Key Files

| File | Purpose |
|------|---------|
| `app.py` | App factory, blueprint registration, CORS, error handlers |
| `models.py` | SQLAlchemy models: `Task`, `TaskLog`, `Generation`, `PatientSession`, `Bookmark` |
| `llm_service.py` | `ClaudeLLMService` — wraps Anthropic SDK for generation, continuation, review, and idea generation |
| `fhir_service.py` | `FHIRService` class — authenticated FHIR R4 requests |
| `direct_fhir.py` | Standalone FHIR fetch helpers used by web/quick-generate routes |
| `services/executor.py` | Task execution logic: `execute_task`, `execute_continuation_task`, `execute_miniapp_task`, `run_generation` |
| `backend_service.py` | `/api/backend/*` — Flutter-facing endpoints, patient session init, streaming mini-app delivery |
| `quick_generate_api.py` | `/api/quick/*` — fast generation and voice transcript extraction |
| `utils/auth.py` | `require_bearer` decorator — allows Bearer token OR `fhir_token` cookie |
| `utils/helpers.py` | `add_task_log`, `save_generated_files`, `check_cancellation`, `OUTPUT_FOLDER` |
| `migrate_db.py` | Raw SQLite migration script for adding columns to the `tasks` table |

### Blueprints

| Blueprint | Prefix | Description |
|-----------|--------|-------------|
| `web` | `/` | Dashboard UI, Flutter init handler |
| `mini_apps` | `/mini-apps` | Gallery, preview, raw HTML |
| `tasks_api` | `/api/tasks` | Task CRUD, run/cancel/logs |
| `misc_api` | `/api/` | Idea generation, LLM status |
| `organization` | `/api/` | Department list from CareIT FHIR |
| `location` | `/api/` | Ward/location data |
| `bookmarks` | `/api/` | Bookmark management |
| `backend_service` | `/api/backend` | Flutter integration, streaming |
| `quick_generate` | `/api/quick` | Fast generation, transcript extraction |

### LLM Prompts

Prompt templates live in `prompts/` as Markdown files with `$variable` placeholders (Python `string.Template`):
- `generate_miniapp.md` — main generation prompt
- `continue_miniapp.md` — incremental change prompt  
- `generate_idea.md` — idea brainstorming prompt

All Claude calls use `claude-sonnet-4-20250514` at `max_tokens=16000`.

### Task Lifecycle

`pending` → `planning` → `executing` → `reviewing` → `completed` (or `failed`/`cancelled`)

Tasks run in background threads spawned from the routes. `check_cancellation()` is polled between stages to support mid-run cancellation via `task.cancel_requested`.

### CIW Transfer

Completed mini-apps can be transferred to CareITWeb (CIW). The `Task` model stores transfer metadata: `transferred`, `transfer_status`, `transfer_roles`, `transfer_show_at`, `transfer_dept_name`, `transfer_ward`, `transfer_icon`. The `CIWTransfer` class in `models.py` holds the allowed values for these fields.

### Database

SQLite via Flask-SQLAlchemy. DB file is at `instance/careit_vibe.db`. Schema is auto-created by `init_db()` on startup. Use `migrate_db.py` when adding columns to the `tasks` table on existing deployments.
