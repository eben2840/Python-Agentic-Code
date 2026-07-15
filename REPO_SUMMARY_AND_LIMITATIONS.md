# Repo Summary and Limitations

## Plain Summary

This repo is a healthcare mini-app generator called **CareIT Vibe Mini App Generator**.

The main app is a **Flask web app**. It receives patient context from a FHIR server, sends that context plus a user prompt to an LLM, and saves the generated HTML, CSS, and JavaScript as a small healthcare mini app.

The generated mini apps can be previewed in the browser, listed by patient, transferred to a CareIT Web-style API, bookmarked, and used for questionnaire/form workflows.

There is also a `FASTAPI/` folder. 

## What The App Is For

The app helps clinical users create small SMART-on-FHIR-style dashboards or tools from prompts.

Example use cases:

- Generate a patient dashboard.
- Generate a vitals or observations view.
- Generate a medication or clinical summary view.
- Generate a questionnaire/form mini app.
- Extract structured clinical information from a transcript.
- Transfer completed mini apps into a CareIT Web-style catalog.

## Main Tech Stack

- Python
- Flask
- Flask-SQLAlchemy
- Anthropic Claude API
- FHIR REST APIs
- Jinja templates
- Plain JavaScript and CSS
- FastAPI port

## Main Folders And Files

- `app.py`: main Flask entry point.
- `models.py`: database models for tasks, logs, generations, sessions, and bookmarks.
- `routes/`: Flask routes for pages, APIs, mini apps, bookmarks, locations, organizations, extraction, and tasks.
- `services/`: task execution, FHIR retrieval planning, patient context, and formatting.
- `direct_fhir.py`: direct FHIR client for app modules.
- `llm_service.py`: Claude integration for idea generation, mini app generation, review, and questionnaire matching.
- `templates/`: HTML pages for the dashboard, generator, previews, settings, login, and skills editor.
- `static/`: CSS and JavaScript for the web UI.
- `prompts/`: LLM prompt templates.
- `questionaires/`: questionnaire catalog, matching, loading, validation, response building, and response submission.
- `FASTAPI/`: separate FastAPI version of part of the backend.
- `generated_apps/`: generated app files are saved here at runtime.
- `careit_vibe.db`: database file currently present at repo root.

## How The Flask App Starts

The app starts from `app.py`.

Default settings:

- Host: `0.0.0.0`
- Port: `2000`
- Database: `sqlite:///careit_vibe.db`, unless `DATABASE_URL` is set

The app registers these Flask blueprints:

- `web`
- `mini_apps`
- `tasks_api`
- `misc_api`
- `organization`
- `location`
- `bookmarks`
- `extraction`
- `skills`
- `admin`
- `quick_generate`

## How A Mini App Is Generated

The normal flow is:

1. A client sends a Bearer token, patient id, and FHIR base URL.
2. The app loads or creates a `PatientSession`.
3. The app fetches patient data from the FHIR server.
4. A user creates a generation task.
5. A background thread runs the task.
6. Claude receives the prompt and patient context.
7. Claude returns HTML, CSS, and JavaScript.
8. The app saves the generated code in the database and in `generated_apps/<task_id>/`.
9. Claude reviews the generated code and gives a score.
10. The task is marked completed.
11. The generated app can be previewed or embedded.

## Important Routes

Main pages:

- `GET /`
- `GET /generate`
- `GET /vibe-apps`
- `GET /automation`
- `GET /mini-apps`
- `GET /mini-apps/<task_id>`

Task APIs:

- `GET /api/tasks`
- `GET /api/tasks/<task_id>`
- `PATCH /api/tasks/<task_id>`
- `DELETE /api/tasks/<task_id>`
- `POST /api/tasks/<task_id>/run`
- `POST /api/tasks/<task_id>/cancel`
- `POST /api/tasks/<task_id>/continue`
- `GET /api/tasks/<task_id>/logs`

Quick generation:

- `POST /api/quick/generate`
- `POST /api/quick/summary`
- `GET /api/quick/status/<task_id>`
- `POST /api/quick/extract`

Mini app APIs:

- `GET /api/mini-apps?patient_id=...`
- `GET /mini-apps/<task_id>/raw`
- `POST /mini-apps/<task_id>/questionnaire/submit`

CareIT Web-style APIs:

- `GET /careit-web/api/v1`
- `GET /careit-web/api/v1/options`
- `GET /careit-web/api/v1/transfer-options`
- `POST /careit-web/api/v1/<task_id>/transfer`
- `DELETE /careit-web/api/v1/<task_id>`

Other APIs:

- `GET /api/health`
- `GET /api/llm/status`
- `GET /api/logs`
- `GET /api/departments`
- `GET /api/locations`
- `GET /api/bookmarks`

## Database Tables

Main tables:

- `tasks`: one row per mini app generation task.
- `task_logs`: task progress logs.
- `generations`: generated code and LLM responses for each generation.
- `patient_sessions`: cached patient context and auth token.
- `bookmarks`: bookmarked completed mini apps.

## What Works Well

- The app has a clear task model.
- It stores generated apps in both the database and files.
- It has task logs for progress tracking.
- It supports both single-patient and some all-patient context.
- It has questionnaire-related code.
- It has a CareIT Web transfer/catalog API.
- It has a separate FastAPI port started, which could become a cleaner backend later.

## Main Limitations

### 1. Security is not production-ready

- Several routes have authentication commented out.
- `GET /`, `GET /generate`, `GET /vibe-apps`, `GET /automation`, and `GET /mini-apps/<task_id>` are public in the current Flask code.
- `POST /mini-apps/<task_id>/questionnaire/submit` is also public.
- `GET /api/logs`, `GET /api/health`, and `GET /api/llm/status` are public.
- `GET /api/departments` and `GET /api/locations` are public.
- The default Flask `SECRET_KEY` is hardcoded in `app.py`.
- Bearer token presence and request headers are printed in logs. The token value is partly masked in some places, but the logging is still too noisy for healthcare data.
- `PatientSession.auth_token` stores the access token in the database as plain text.
- Generated mini app previews inject `window.PATIENT_DATA` into HTML, which exposes patient data to browser JavaScript.
- Generated HTML/CSS/JS is executed in the browser. That is risky because the code comes from an LLM.
- There is no visible sanitization or sandboxing of generated app code.
- CORS reflects any request origin or falls back to `*`.
- FHIR base URLs are accepted from request headers/body, which can become an SSRF risk if not restricted.

### 2. Clinical safety is limited

- The LLM creates clinical UI/code directly from patient data.
- The LLM also reviews and scores its own generated output.
- There is no separate clinical validation step.
- There is no rules engine to verify clinical calculations.
- There is no audit workflow for human approval before generated apps are used.


### 4. FHIR retrieval is basic

- Patient-specific fetches use `_count` limits and do not fully paginate all resources.
- Some all-patient fetches cap at 50 records.
- The retrieval planner only chooses resource types, not filters, dates, sorting, or search parameters.
- The code mainly supports resources searchable by `patient` or `subject`.
- Some FHIR resources may be missed if the server uses different search behavior.
- All-patient context is based mainly on active encounters and simple grouping.



### 7. Database and migrations are weak

- There is no real migration tool configured, such as Alembic or Flask-Migrate.
- `db.create_all()` runs at startup, but it does not handle schema changes safely.
- `migrate_db.py` was open in the IDE context, but it is not present in the repo path I inspected.
- The root `careit_vibe.db` file is tracked by git.
- `.gitignore` ignores `instance/careit_vibe.db`, but not the root `careit_vibe.db` that is currently tracked.
- Generated code and patient/session data can remain in the database unless manually removed.

### 8. Deployment config is environment-specific

- `web.config` contains a Windows user-specific Python path.
- `web.config` uses Python 3.11 paths, while `runtime.txt` says Python 3.12.0.
- There is both root `web.config` and `static/web.config`.
- The deployment story is not clear for local, IIS, and Python-hosted environments.

### 9. Error handling is inconsistent

- Many functions catch broad exceptions.
- Some failures return empty lists or empty dictionaries.
- Some API errors return JSON, while page errors redirect to `https://nursit.de/careit-vibe`.
- The 404 handler redirects non-API routes away from the app.
- Some debug `print()` calls are mixed with structured logging.
- Users may not get a clear reason when FHIR or LLM calls fail.


### 11. Generated app isolation is limited

- The preview combines generated HTML, CSS, JS, and patient data into one page.
- Generated JavaScript can access the page context.
- There is no strict iframe sandbox configuration visible in the backend.
- There is no Content Security Policy visible.
- Generated apps may leak patient data through JavaScript, links, network calls, or browser tools.


### 13. Dependencies are inconsistent

- `requirements.txt` includes `google-generativeai`, but the main path uses Claude.
- `llm/dynamic.py` imports `openai`, but `openai` is not listed in `requirements.txt`.
- `FASTAPI/requirements.txt` does not include all packages used by the root app.
- Some packages look unused in the main Flask flow, such as speech/audio packages.

### 14. Code organization has duplication

- Flask and FastAPI duplicate models, routes, utilities, and generation logic.
- Extraction logic appears in both `quick_generate_api.py`, `skills.py`, and `FASTAPI/quick.py`.
- Generation logic appears in several functions inside `services/executor.py`.
- Some route decorators are commented out instead of being clearly configured.
- Some comments and old code are left in place.

### 15. Documentation is stale

- README describes the app but misses many current routes and features.
- README says port 5000, while code defaults to port 2000.
- README mentions `.env.example`, but I did not find `.env.example` in the file list.
- README does not explain the FastAPI port clearly.
- README does not explain required CareIT environment variables.
- README does not describe the security model accurately.

## Environment Variables The App Appears To Need

Common variables:

- `ANTHROPIC_API_KEY`
- `SECRET_KEY`
- `DATABASE_URL`
- `PORT`
- `FLASK_DEBUG`
- `CAREIT_BASE_URL`
- `CAREIT_USERNAME`
- `CAREIT_PASSWORD`
- `PROMPT_USERNAME`
- `PROMPT_PASSWORD`
- `WEBHOOK_URL`
- `CORS_ALLOWED_ORIGINS` for FastAPI

Optional or partially supported:

- `OPENAI_API_KEY`
- `GEMINI_API_KEY`

## Verification Done

I ran a Python syntax compile check with:

```bash
env PYTHONPYCACHEPREFIX=/private/tmp/careit_compile_cache python3 -m compileall -q app.py admin.py direct_fhir.py llm_service.py models.py quick_generate_api.py skills.py routes services utils llm questionaires FASTAPI
```

Result: syntax compile passed.

I did not run the full app because it needs environment variables, live FHIR services, database state, and LLM API keys.

## Best Next Improvements

1. Decide whether Flask or FastAPI is the real backend.
2. Add proper authentication to every patient-data and generated-app route.
3. Remove hardcoded secrets and user-specific deployment paths.
4. Stop storing access tokens in plain text.
5. Add a real job queue for generation tasks.
6. Add database migrations.
7. Add tests for routes, FHIR parsing, generation flows, and questionnaire submission.
8. Align README with the current code.
9. Remove the tracked root `careit_vibe.db` from git.
10. Sandbox or strongly restrict generated app execution.

