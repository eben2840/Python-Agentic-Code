# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run the app (port 2000)
python app.py

# Restart (kills existing process, restarts)
./restart_app.sh

# Install dependencies
pip install -r requirements.txt

# Run DB migrations
python migrate_db.py
```

There are no automated tests. No linter is configured.

## Architecture

Flask app that accepts prompts from a Flutter mobile app (via FHIR credentials) and uses Claude AI to generate SMART on FHIR HTML mini-apps for healthcare providers.

### Entry point & blueprints

`app.py` wires together all blueprints and adds CORS headers in `after_request`. Blueprints and their URL prefixes:

| Blueprint | File | Prefix |
|---|---|---|
| `web` | `routes/web.py` | `/` |
| `backend_service` | `backend_service.py` | `/api/backend` |
| `tasks_api` | `routes/tasks_api.py` | `/api/tasks` |
| `quick_generate` | `quick_generate_api.py` | `/api/quick` |
| `skills` | `skills.py` | `/api/skills` |
| `mini_apps` | `routes/mini_apps.py` | — |
| `misc_api`, `organization`, `location`, `bookmarks`, `extraction` | `routes/` | — |

### Authentication

`utils/auth.py` provides two decorators:
- `@require_bearer` — accepts `Authorization: Bearer <token>` header **or** a `fhir_token` cookie. On first successful Bearer auth, the server sets the `fhir_token` cookie.
- `@require_bearer_or_basic` — also accepts Smile CDR Basic auth (validated against `/metadata`).

The Flutter app sends three headers: `Authorization: Bearer <fhir_token>`, `X-Patient-Id`, `X-FHIR-Base`. When the app is opened in a browser (not Flutter webview), `window.FHIR_CONFIG` is not set, so the JS sends `Authorization: Bearer` with no token — routes requiring `@require_bearer` will return 401.

### Patient session lifecycle

1. Flutter sends FHIR credentials via headers to any `@require_bearer` endpoint.
2. `_init_patient_session()` in `auth.py` calls `load_patient_context()` (`services/patient_context_service.py`), which fetches patient data from the FHIR server and stores it in `PatientSession` (SQLite).
3. Subsequent requests use `load_latest_patient_session()` to retrieve the cached session — no FHIR roundtrip needed.
4. Patient data is also denormalized onto the `Task` row at creation time so generation works even if the session expires.

### Task generation pipeline

Tasks follow this status progression: `pending → planning → executing → reviewing → completed` (or `failed`/`cancelled`).

Generation always runs in a **background thread** (`threading.Thread`) with `app.app_context()` so it doesn't block the request. There are three executor entry points depending on which blueprint created the task:

- `execute_task()` — used by `routes/tasks_api.py` (standard flow)
- `execute_miniapp_task()` — used by `backend_service.py`
- `run_generation()` — used by `quick_generate_api.py` (dynamic FHIR retrieval)

Each executor calls `ClaudeLLMService` twice: once to generate HTML/CSS/JS (`generate_mini_app`), then again to score the output 0–10 (`review_generated_code`). Generated files are written to `generated_apps/<task_id>/`.

### LLM service & prompts

`llm_service.py` wraps the Anthropic SDK. All prompts live in `prompts/` as Markdown templates loaded via `string.Template.safe_substitute()`. Key prompt files:
- `generate_miniapp.md` — main generation prompt (receives patient context)
- `continue_miniapp.md` — incremental change prompt
- `generate_idea.md` — idea brainstorm prompt
- `extraction/` — transcript extraction prompts used by the extraction endpoints

Model is hardcoded to `claude-sonnet-4-6` with `max_tokens=20000`.

### FHIR data fetching

- `fhir_service.py` — `FHIRService` class, resource-by-resource fetching
- `direct_fhir.py` — `get_patient_data_direct()`, used for single-patient context
- `services/retrieval_planner.py` — LLM-driven query planner (decides which FHIR resources to fetch based on the prompt)
- `services/retrieval_executor.py` — executes the retrieval plan against the FHIR server
- `services/context_formatter.py` — formats raw FHIR data into a structured dict for the LLM

### Database

SQLite via Flask-SQLAlchemy (`instance/careit_vibe.db`). Key models in `models.py`:
- `Task` — central record; holds patient data JSON blob, generated HTML/CSS/JS, status, score
- `TaskLog` — append-only log entries per task
- `Generation` — one row per iteration (each LLM call)
- `PatientSession` — cached FHIR patient data keyed by `(patient_id, fhir_base_url)`
- `Bookmark` — saved tasks

### Frontend

Static JS in `static/js/app.js`. Auth token is read from `window.FHIR_CONFIG.accessToken` (injected by Flutter webview). The dashboard polls task status via `/api/backend/task/<id>/status`. Generated apps are served at `/api/backend/view-app/<task_id>` with patient data injected as `window.PATIENT_DATA`.
