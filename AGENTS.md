# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
# Run the Flask app (port 2000) — this is the app actually served to the Flutter client
python app.py

# Restart (kills existing process, restarts)
./restart_app.sh

# Install dependencies
pip install -r requirements.txt

# Run DB migrations (Flask-Migrate/Alembic; revisions live in migrations/versions/)
FLASK_APP=app.py flask db upgrade

# Create a new migration after changing models.py
FLASK_APP=app.py flask db migrate -m "description"
```

`init_db()` no longer calls `db.create_all()` — a fresh checkout needs `flask db upgrade` before the app will work. Note: `flask-migrate` is imported by `app.py` but is missing from `requirements.txt`; install it manually if imports fail.

There are no automated tests. No linter is configured.

### FastAPI port (experimental, not yet in production)

`FASTAPI/` is a parallel, in-progress FastAPI port of the same backend. It reads the same `.env`, SQLite database, `prompts/`, and `generated_apps/` folder as the Flask app, from the repo root. Run it from the repo root:

```bash
pip install -r FASTAPI/requirements.txt
uvicorn FASTAPI.main:app --reload --port 8000
```

Keep the Flask app running and treat it as the source of truth until FastAPI route contracts (listed in `FASTAPI/README.md`) are verified against the Flutter/webview client. Don't assume a feature exists in both places — check whether recent work has landed in `FASTAPI/` as well as the Flask blueprint.

## Architecture

Flask app that accepts prompts from a Flutter mobile app (via FHIR credentials) and uses Codex AI to generate SMART on FHIR HTML mini-apps for healthcare providers.

### Entry point & blueprints

`app.py` wires together all blueprints and adds CORS headers in `after_request`. Blueprints and their URL prefixes:

| Blueprint | File | Prefix |
|---|---|---|
| `web` | `routes/web.py` | — |
| `tasks_api` | `routes/tasks_api.py` | — (routes spell out `/api/tasks/...` themselves) |
| `quick_generate` | `quick_generate_api.py` | `/api/quick` |
| `skills` | `skills.py` | `/api/skills` |
| `admin` | `admin.py` | — |
| `mini_apps` | `routes/mini_apps.py` | — (`/mini-apps/...` and `/careit-web/api/v1/...`) |
| `misc_api`, `organization`, `location`, `bookmarks`, `extraction` | `routes/` | — |

`backend_service.py` and its `/api/backend` blueprint were removed — if you see references to `/api/backend/...` routes anywhere, they are dead.

`routes/careitweb_llm.py` is not a blueprint — it's a helper (`enhance_transfer_meta`) used by `routes/mini_apps.py` to have Codex generate a title/description/icon when a mini app is transferred.

### Authentication

`utils/auth.py` provides two decorators:
- `@require_bearer` — accepts `Authorization: Bearer <token>` header **or** a `fhir_token` cookie. On first successful Bearer auth, the server sets the `fhir_token` cookie.
- `@require_bearer_or_basic` — also accepts Smile CDR Basic auth (validated against `/metadata`).

The Flutter app sends three headers: `Authorization: Bearer <fhir_token>`, `X-Patient-Id`, `X-FHIR-Base`. The dashboard JS (`static/js/app.js`) sends no Authorization header at all — every fetch uses `credentials: 'include'` and relies entirely on the `fhir_token` cookie set during the first Bearer-authenticated request from the webview. Opening the app in a plain browser without that cookie means `@require_bearer` routes return 401.

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
- `execute_miniapp_task()` — orphaned: its only caller was the deleted `backend_service.py`; nothing invokes it today
- `run_generation()` — used by `quick_generate_api.py` (dynamic FHIR retrieval, plus questionnaire detection — see below); builds its patient context via `_build_generation_context()` (same module), which is also shared with `/api/quick/validate`

Each executor calls `ClaudeLLMService` twice: once to generate HTML/CSS/JS (`generate_mini_app`), then again to score the output 0–10 (`review_generated_code`). Generated files are written to `generated_apps/<task_id>/`.

### Questionnaire detection (quick_generate_api.py)

Before running full mini-app generation, `quick_generate_api.py` checks the prompt against `_QUESTIONNAIRE_RE` (matches "form"/"questionnaire"/"survey"). If it matches, the flow is diverted through the `questionaires/` package instead of generating a mini app from scratch:

- `questionnaire_catalog.py` — fetches the active FHIR `Questionnaire` catalog
- `questionnaire_matcher.py` — asks Codex (`ClaudeLLMService.match_questionnaire`) to pick the best-matching questionnaire for the prompt
- `questionnaire_loader.py` / `fhir_client.py` — fetch the full `Questionnaire` resource
- `questionnaire_form_view.py` — renders it as a fillable form
- `questionnaire_response_builder.py`, `questionnaire_response_validator.py`, `questionnaire_response_submitter.py` — build, validate, and submit the `QuestionnaireResponse` back to the FHIR server

### Pre-generation validation (quick_generate_api.py)

`POST /api/quick/validate` runs before `/api/quick/generate` and lets the client show the clinician a preview to accept before any mini-app is actually generated. It takes the exact same body as `/generate` (`prompt`, `accessToken`, `fhirBaseUrl`, `patientId`), fetches real FHIR data fresh via `_build_generation_context()` in `services/executor.py` (`get_supported_resources` → `plan_retrieval` → `execute_retrieval` → `format_context` — the same helper `run_generation` uses), then calls `ClaudeLLMService.validate_generation()` (prompt: `prompts/validate_generation.md`) to produce a JSON preview:

```json
{"summary": "...", "patient_scope": "single | all", "data_sources": [...], "assumptions": [...], "warnings": [...]}
```

`/validate` stores its fetched context in `_VALIDATE_CACHE` (module-level dict in `quick_generate_api.py`, keyed by `(prompt, patient_id)`), and `/generate` consumes it with a one-shot `.pop()` — so the accepted generation runs on **exactly the data the clinician previewed**, with no second planner call or FHIR sweep. A cache miss (edited prompt, restart, generate-without-validate) silently falls back to a fresh fetch — never an error, never stale data. Note: the dict is in-process; it will miss randomly under a multi-worker deployment (gunicorn >1 worker) — move it to the DB (e.g. validate pre-creates the Task) if that ever happens. The accept/reject gate is handled entirely client-side (the app just doesn't call `/generate` until the user accepts) — there's no server-side "accepted" state or endpoint.

### LLM service & prompts

`llm_service.py` wraps the Anthropic SDK directly and is what the task-generation pipeline and questionnaire matcher use. Model is hardcoded to `Codex-sonnet-4-6` with `max_tokens=32000`.

**Truncated generation is a hard failure.** `generate_mini_app()` raises `ValueError` when `stop_reason == "max_tokens"` — the task goes to `failed` instead of saving a cut-off app. Do NOT downgrade this back to a warning: a truncated JS block is invalid JavaScript, the browser throws `Unexpected end of input`, nothing executes, and the app renders as an empty static shell — yet the review step still scored such an app 8/10 and marked the task completed. (Questionnaire-flow apps are the usual trigger: the matched FHIR form structure gets hardcoded into the generated JS, inflating output; that's also why `max_tokens` was raised from 20000.)

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

**All-patients retrieval is per-patient, not global.** `_execute_all_patient_retrieval()` finds active patients via `Encounter?status=in-progress&_count=100`, then fetches every other planned resource **for those patients specifically** via `_fetch_for_patients()` — patient IDs batched 20 per query, `_count=100`, `_sort=-_lastUpdated` (newest records survive the cap). Do NOT revert this to `fetch_all_resource()` (global first-50 on the server): that was the root cause of a long-standing bug where active patients got zero conditions/flags attached and generated apps came out empty or forced the LLM to guess — whether an app had data depended on which resource types the (nondeterministic) planner happened to pick. `metadata` is fetched once per run (`supported = dict(...)`), not per resource.

**Location linkage (fixed).** The top-level `location` key is built directly from `_fetch_locations()`'s records (`{'count', 'resources', 'summary'}` — same shape as the single-patient path), NOT via `client.entry()`: `entry()` routes dicts through `_flatten()`, which silently drops `patient_id` and wipes the ward name — that bug shipped for weeks and made patient→ward mapping impossible in all-patients apps. `_patient_context()` in `llm_service.py` renders `status` and `patient_id` on every summary line so the linkage actually reaches the LLM prompt (generated apps key `window.PATIENT_DATA` location records by `patient_id`).

**Known bug — `/api/quick/extract` returns 500 on every call.** `quick_generate_api.py` (`extract_transcript`): `extracted = _parse_json_response(...), transcript` — the trailing `, transcript` makes `extracted` a tuple, so `extracted.values()` throws. It burns a full LLM call before crashing; the Flutter client swallows the 500 and falls back to wrapping the prompt as `{"originalTranscript": ..., "extracted": {}}`. Fix is deleting the trailing `, transcript`; deliberately left unfixed for now per project owner.

### Database

SQLite via Flask-SQLAlchemy (`instance/careit_vibe.db`), schema managed by Flask-Migrate/Alembic (`migrations/`). Key models in `models.py`:
- `Task` — central record; holds patient data JSON blob, generated HTML/CSS/JS, status, score
- `TaskLog` — append-only log entries per task
- `Generation` — one row per iteration (each LLM call)
- `PatientSession` — cached FHIR patient data keyed by `(patient_id, fhir_base_url)`
- `Bookmark` — saved tasks

### Frontend

Static JS in `static/js/app.js`. All requests authenticate via the `fhir_token` cookie (`credentials: 'include'`) — see Authentication above. The dashboard polls task status via `GET /api/tasks/<task_id>`. Generated apps are previewed in an iframe pointed at `/mini-apps/<task_id>/raw` (`routes/mini_apps.py`), which assembles the stored HTML/CSS/JS with `create_combined_html()` (`utils/helpers.py`) and injects the task's patient data as `window.PATIENT_DATA`.
