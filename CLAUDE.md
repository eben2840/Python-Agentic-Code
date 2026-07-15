# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run the Flask app (port 2000) — this is the app actually served to the Flutter client
python app.py

# Restart (kills existing process, restarts)
./restart_app.sh

# Install dependencies
pip install -r requirements.txt

# Run DB migrations
python migrate_db.py
```

There are no automated tests. No linter is configured.

### FastAPI port (experimental, not yet in production)

`FASTAPI/` is a parallel, in-progress FastAPI port of the same backend. It reads the same `.env`, SQLite database, `prompts/`, and `generated_apps/` folder as the Flask app, from the repo root. Run it from the repo root:

```bash
pip install -r FASTAPI/requirements.txt
uvicorn FASTAPI.main:app --reload --port 8000
```

Keep the Flask app running and treat it as the source of truth until FastAPI route contracts (listed in `FASTAPI/README.md`) are verified against the Flutter/webview client. Don't assume a feature exists in both places — check whether recent work has landed in `FASTAPI/` as well as the Flask blueprint.

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
| `admin` | `admin.py` | — |
| `mini_apps` | `routes/mini_apps.py` | — |
| `misc_api`, `organization`, `location`, `bookmarks`, `extraction` | `routes/` | — |

`routes/careitweb_llm.py` is not a blueprint — it's a helper (`enhance_transfer_meta`) used by `routes/mini_apps.py` to have Claude generate a title/description/icon when a mini app is transferred.

### Authentication

`utils/auth.py` provides two decorators:
- `@require_bearer` — accepts `Authorization: Bearer <token>` header **or** a `fhir_token` cookie. On first successful Bearer auth, the server sets the `fhir_token` cookie.
- `@require_bearer_or_basic` — also accepts Smile CDR Basic auth (validated against `/metadata`).

The Flutter app sends three headers: `Authorization: Bearer <fhir_token>`, `X-Patient-Id`, `X-FHIR-Base`. When the app is opened in a browser (not Flutter webview), `window.FHIR_CONFIG` is not set, so the JS sends `Authorization: Bearer` with no token — routes requiring `@require_bearer` will return 401.

`admin.py` is a separate, session-based login (`validate_careit_admin_login` in `utils/auth.py`) guarding an obscured `/login?417761=21312` route — unrelated to the FHIR bearer/cookie flow above.

### Patient session lifecycle

1. Flutter sends FHIR credentials via headers to any `@require_bearer` endpoint.
2. `_init_patient_session()` in `auth.py` calls `load_patient_context()` (`services/patient_context_service.py`), which fetches patient data from the FHIR server and stores it in `PatientSession` (SQLite).
3. Subsequent requests use `load_latest_patient_session()` to retrieve the cached session — no FHIR roundtrip needed.
4. Patient data is also denormalized onto the `Task` row at creation time so generation works even if the session expires.

### Task generation pipeline

Tasks follow this status progression: `pending → planning → executing → reviewing → completed` (or `failed`/`cancelled`).

All generation logic lives in `services/executor.py`, regardless of which blueprint triggered it. Each entry point is always launched in a background `threading.Thread` with `app.app_context()` so it doesn't block the request:

- `execute_task()` — standard flow, called via `execute_task_in_context()` in `routes/tasks_api.py`
- `execute_continuation_task()` — incremental "continue" flow (change requests against an already-generated app), also called from `routes/tasks_api.py`
- `execute_miniapp_task()` — used by `backend_service.py`'s task-creation route (note: `backend_service.py` itself only serves task status/view routes — creation is where it invokes the executor)
- `run_generation()` — used by `quick_generate_api.py` (dynamic FHIR retrieval, plus questionnaire detection — see below)

Each executor calls `ClaudeLLMService` twice: once to generate HTML/CSS/JS (`generate_mini_app`), then again to score the output 0–10 (`review_generated_code`). Generated files are written to `generated_apps/<task_id>/`.

### Questionnaire detection (quick_generate_api.py)

Before running full mini-app generation, `quick_generate_api.py` checks the prompt against `_QUESTIONNAIRE_RE` (matches "form"/"questionnaire"/"survey"). If it matches, the flow is diverted through the `questionaires/` package instead of generating a mini app from scratch:

- `questionnaire_catalog.py` — fetches the active FHIR `Questionnaire` catalog
- `questionnaire_matcher.py` — asks Claude (`ClaudeLLMService.match_questionnaire`) to pick the best-matching questionnaire for the prompt
- `questionnaire_loader.py` / `fhir_client.py` — fetch the full `Questionnaire` resource
- `questionnaire_form_view.py` — renders it as a fillable form
- `questionnaire_response_builder.py`, `questionnaire_response_validator.py`, `questionnaire_response_submitter.py` — build, validate, and submit the `QuestionnaireResponse` back to the FHIR server

### Pre-generation validation (quick_generate_api.py)

`POST /api/quick/validate` runs before `/api/quick/generate` and lets the client show the clinician a preview to accept before any mini-app is actually generated. It takes the exact same body as `/generate` (`prompt`, `accessToken`, `fhirBaseUrl`, `patientId`), fetches real FHIR data fresh (`get_supported_resources` → `plan_retrieval` → `execute_retrieval` → `format_context` — the same chain `run_generation` uses internally), then calls `ClaudeLLMService.validate_generation()` (prompt: `prompts/validate_generation.md`) to produce a JSON preview:

```json
{"summary": "...", "patient_scope": "single | all", "data_sources": [...], "assumptions": [...], "warnings": [...]}
```

Deliberately does **no caching** — health data can change between validate and generate, so `/generate` re-fetches independently rather than reusing anything from `/validate`. This means two FHIR round-trips instead of one; that's an intentional tradeoff for freshness over efficiency. The accept/reject gate is handled entirely client-side (the app just doesn't call `/generate` until the user accepts) — there's no server-side "accepted" state or endpoint.

### LLM service & prompts

`llm_service.py` wraps the Anthropic SDK directly and is what the task-generation pipeline and questionnaire matcher use. Model is hardcoded to `claude-sonnet-4-6` with `max_tokens=20000`.

Separately, `llm/` (`llm/dynamic.py`, `llm/helpers.py`) is a multi-provider abstraction (Anthropic/OpenAI/Gemini) used only by user-facing "pick your LLM provider" settings in `routes/web.py`, `routes/extraction.py`, and `skills.py` — selection is stored on `current_app.config['LLM_PROVIDER'] / ['LLM_MODEL']`. This is unrelated to the model used for mini-app generation itself, which always uses `ClaudeLLMService`.

All prompts live in `prompts/` as Markdown templates loaded via `string.Template.safe_substitute()`. Key prompt files:
- `generate_miniapp.md` — main generation prompt (receives patient context)
- `continue_miniapp.md` — incremental change prompt
- `generate_idea.md` — idea brainstorm prompt
- `questionnaire_matcher.md`, `questionaire/questionaire_base.md` — questionnaire-detection flow prompts
- `extraction/` — transcript extraction prompts used by the extraction endpoints

### FHIR data fetching

- `direct_fhir.py` — `DirectFHIRClient`, `get_patient_data_direct()`; resource-by-resource fetching, used for single-patient context
- `services/retrieval_planner.py` — LLM-driven query planner (decides which FHIR resources to fetch based on the prompt)
- `services/retrieval_executor.py` — executes the retrieval plan against the FHIR server, constrained by `services/fhir_resource_allowlist.py`; for `patient_id == 'all'` it delegates to `_execute_all_patient_retrieval()`, which groups resources per patient via `_group_patients()`
- `services/context_formatter.py` — formats raw FHIR data into a structured dict for the LLM

**Known bug — location data is corrupted in the "all patients" view.** `_execute_all_patient_retrieval()` (`services/retrieval_executor.py:82`) builds the top-level `location` key via `client.entry(location_records)`, which routes already-flattened dicts (`{patient_id, name, status, date, value}` from `direct_fhir.py`'s `_fetch_locations()`) through `_flatten()` (`direct_fhir.py:178-215`) — a function meant for raw FHIR resources. `_flatten()`'s return statement is `{'name', 'status', 'date', 'value'}`, so `patient_id` is silently dropped, and its `value` extraction logic only reads FHIR-specific keys (`valueQuantity`, `valueCodeableConcept`, etc.), never the plain `value` key already set — so the ward name is wiped to `''`. Net effect: in "All Patients" mini-apps, the model has no reliable way to say which patient is in which room/ward. The single-patient path (`direct_fhir.py`'s `get_patient_data()`) does not have this bug — it assigns `location_records` directly to `summary` without going through `entry()`/`_flatten()`. Fix: build the `location` key in `_execute_all_patient_retrieval()` the same way the single-patient path does, skipping `entry()` for this key. Not yet fixed as of this writing.

### Database

SQLite via Flask-SQLAlchemy (`instance/careit_vibe.db`). Key models in `models.py`:
- `Task` — central record; holds patient data JSON blob, generated HTML/CSS/JS, status, score
- `TaskLog` — append-only log entries per task
- `Generation` — one row per iteration (each LLM call)
- `PatientSession` — cached FHIR patient data keyed by `(patient_id, fhir_base_url)`
- `Bookmark` — saved tasks

### Frontend

Static JS in `static/js/app.js`. Auth token is read from `window.FHIR_CONFIG.accessToken` (injected by Flutter webview). The dashboard polls task status via `/api/backend/task/<id>/status`. Generated apps are served at `/api/backend/view-app/<task_id>` with patient data injected as `window.PATIENT_DATA`.
