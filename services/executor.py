import os
import logging
from datetime import datetime, timezone

from flask import request
from models import db, Task, TaskStatus, Generation
from llm_service import ClaudeLLMService
from fhir_service import get_patient_data_for_llm
from services.context_formatter import format_context
from services.retrieval_executor import execute_retrieval, get_supported_resources
from services.retrieval_planner import plan_retrieval
from utils.helpers import add_task_log, save_generated_files, check_cancellation, OUTPUT_FOLDER

logger = logging.getLogger(__name__)


def execute_task(task_id: str):
    """Execute a task — generate mini app using LLM"""
    print(f"[EXECUTE-TASK] Starting execution for task {task_id}")
    task = Task.query.get(task_id)
    if not task:
        print(f"[EXECUTE-TASK] Task {task_id} not found")
        logger.error(f"Task {task_id} not found")
        return

    if task.cancel_requested:
        print(f"[EXECUTE-TASK] Task {task_id} was cancelled")
        task.status = TaskStatus.failed
        task.error_message = 'Task was cancelled'
        db.session.commit()
        add_task_log(task_id, "Task cancelled", 'warning')
        return

    try:
        print(f"[EXECUTE-TASK] Task {task_id} -> planning")
        task.status = TaskStatus.planning
        task.current_iteration += 1
        db.session.commit()

        add_task_log(task_id, "Starting mini app generation...", 'info')
        add_task_log(task_id, f"Task: {task.title}", 'info')
        add_task_log(task_id, "Analyzing requirements and specifications...", 'info')

        task.plan = f"""
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
        db.session.commit()

        if check_cancellation(task_id):
            print(f"[EXECUTE-TASK] Task {task_id} cancelled during planning")
            return

        print(f"[EXECUTE-TASK] Getting patient data for task {task_id}")
        add_task_log(task_id, "Loading patient data context...", 'info')
        patient_data = task.patient_data
        if not patient_data and task.fhir_base_url and task.patient_id:
            print(f"[EXECUTE-TASK] No patient data, trying to fetch from FHIR")
            fhir_token = request.cookies.get('fhir_token', '') if request else ''
            if fhir_token:
                try:
                    patient_data = get_patient_data_for_llm(task.fhir_base_url, fhir_token, task.patient_id)
                    task.patient_data = patient_data
                    db.session.commit()
                    print(f"[EXECUTE-TASK] Patient data fetched from FHIR")
                except Exception as e:
                    print(f"[EXECUTE-TASK] Could not fetch patient data: {e}")
                    logger.warning(f"Could not fetch patient data: {e}")

        if not patient_data:
            print(f"[EXECUTE-TASK] ERROR: No patient data available")
            raise Exception("No patient data available. Please ensure a patient session is active before creating tasks.")

        print(f"[EXECUTE-TASK] Task {task_id} -> executing")
        task.status = TaskStatus.executing
        task.plan = task.plan.replace("2. Designing UI/UX layout", "2. Designing UI/UX layout")
        db.session.commit()

        add_task_log(task_id, "Designing UI/UX layout...", 'info')
        add_task_log(task_id, "CareIT X is generating code...", 'info')

        if check_cancellation(task_id):
            print(f"[EXECUTE-TASK] Task {task_id} cancelled before generation")
            return

        print(f"[EXECUTE-TASK] Calling LLM to generate mini app")
        llm = ClaudeLLMService()
        user_prompt = f"{task.title}\n\n{task.description or ''}\n\n{task.specification or ''}"
        add_task_log(task_id, "Generating HTML structure...", 'info')

        import time
        _t = time.time()
        print(f"[EXECUTE-TASK] LLM call START — prompt size: {len(user_prompt)} chars, patient_data keys: {list(patient_data.keys())}", flush=True)
        html_content, css_content, js_content, llm_response = llm.generate_mini_app(user_prompt, patient_data)
        print(f"[EXECUTE-TASK] LLM call END — took {time.time()-_t:.1f}s", flush=True)
        print(f"[EXECUTE-TASK] Mini app generated: html={len(html_content)} chars, css={len(css_content or '')} chars, js={len(js_content or '')} chars")

        task.plan = task.plan.replace("3. Generating HTML structure", "3. Generating HTML structure")
        task.plan = task.plan.replace("4. Creating CSS styles", "4. Creating CSS styles")
        task.plan = task.plan.replace("5. Writing JavaScript logic", "5. Writing JavaScript logic")
        task.plan = task.plan.replace("6. Integrating patient data", "6. Integrating patient data")
        db.session.commit()

        add_task_log(task_id, "CSS styles created", 'info')
        add_task_log(task_id, "JavaScript logic written", 'info')
        add_task_log(task_id, f"Generated: HTML ({len(html_content)} chars), CSS ({len(css_content or '')} chars), JS ({len(js_content or '')} chars)", 'info')

        task.html_content = html_content
        task.css_content  = css_content
        task.js_content   = js_content
        db.session.commit()
        print(f"[EXECUTE-TASK] Content saved to database")

        saved_files = save_generated_files(task_id, html_content, css_content, js_content)
        task.generated_files = list(saved_files.values())
        db.session.commit()
        print(f"[EXECUTE-TASK] Files saved: {list(saved_files.keys())}")

        add_task_log(task_id, f"Code generated successfully. Files saved: {list(saved_files.keys())}", 'info')

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

        print(f"[EXECUTE-TASK] Task {task_id} -> reviewing")
        task.status = TaskStatus.reviewing
        task.plan = task.plan.replace("7. Review and scoring", "7. Review and scoring")
        db.session.commit()
        add_task_log(task_id, "Reviewing generated code with AI...", 'info')

        if check_cancellation(task_id):
            print(f"[EXECUTE-TASK] Task {task_id} cancelled before review")
            return

        print(f"[EXECUTE-TASK] Calling LLM to review code")
        score, feedback = llm.review_generated_code(html_content, css_content or '', js_content or '', user_prompt)
        print(f"[EXECUTE-TASK] Review complete: score={score}/10")

        generation.score    = score
        generation.feedback = feedback
        task.final_score    = score
        task.status         = TaskStatus.completed
        task.completed_at   = datetime.utcnow()
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


def execute_continuation_task(task_id: str, changes: str):
    """Execute incremental changes on an existing task"""
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
        add_task_log(task_id, "Applying incremental changes with CareIT X...", 'info')

        existing_html = task.html_content or ''
        existing_css  = task.css_content  or ''
        existing_js   = task.js_content   or ''

        llm = ClaudeLLMService()
        html_content, css_content, js_content, llm_response = llm.continue_mini_app(
            existing_html, existing_css, existing_js, changes, task.patient_data
        )

        task.html_content = html_content
        task.css_content  = css_content
        task.js_content   = js_content
        db.session.commit()

        saved_files = save_generated_files(task_id, html_content, css_content, js_content)
        task.generated_files = list(saved_files.values())
        db.session.commit()

        add_task_log(task_id, f"Changes applied. Files updated: {list(saved_files.keys())}", 'info')

        task.status = TaskStatus.reviewing
        db.session.commit()
        add_task_log(task_id, "Reviewing updated code...", 'info')

        score, feedback = llm.review_generated_code(
            html_content, css_content or '', js_content or '', f"{task.title}\n{changes}"
        )

        task.final_score  = score
        task.status       = TaskStatus.completed
        task.completed_at = datetime.utcnow()
        db.session.commit()

        add_task_log(task_id, f"Changes complete with score: {score}/10", 'info')

    except Exception as e:
        logger.error(f"Error continuing task {task_id}: {e}")
        task.status = TaskStatus.failed
        task.error_message = str(e)
        db.session.commit()
        print(f"[CONTINUE-TASK] ERROR applying changes: {str(e)}")
        add_task_log(task_id, f"Something Went Wrong, Checking for Error...", 'error')


def execute_miniapp_task(task_id: str):
    """Execute mini app generation task — used by backend service blueprint."""
    task = Task.query.get(task_id)
    if not task:
        logger.error(f"[EXECUTE] Task {task_id} not found")
        return

    try:
        logger.info(f"[EXECUTE] Task {task_id} -> planning")
        task.status = TaskStatus.planning
        task.current_iteration += 1
        db.session.commit()
        add_task_log(task_id, "Starting mini app planning...", 'info')

        if task.cancel_requested:
            task.status = TaskStatus.cancelled
            task.error_message = 'Task was cancelled'
            db.session.commit()
            add_task_log(task_id, "Task cancelled", 'warning')
            return

        patient_data = task.patient_data
        if not patient_data:
            raise Exception("No patient data available for this task. Please ensure patient data was loaded when the task was created.")

        add_task_log(task_id, f"Patient data ready: {patient_data.get('patient', {}).get('name', 'Unknown')}", 'info')

        logger.info(f"[EXECUTE] Task {task_id} -> executing")
        task.status = TaskStatus.executing
        db.session.commit()
        add_task_log(task_id, "Generating code with Claude AI...", 'info')

        task = Task.query.get(task_id)
        if task.cancel_requested:
            task.status = TaskStatus.cancelled
            task.error_message = 'Task was cancelled'
            db.session.commit()
            add_task_log(task_id, "Task cancelled", 'warning')
            return

        llm = ClaudeLLMService()
        user_prompt = f"{task.title}\n\n{task.description or ''}\n\n{task.specification or ''}"
        html_content, css_content, js_content, llm_response = llm.generate_mini_app(user_prompt, patient_data)
        logger.info(f"[EXECUTE] Generated: html={len(html_content)} chars, css={len(css_content or '')} chars, js={len(js_content or '')} chars")

        task.html_content = html_content
        task.css_content  = css_content
        task.js_content   = js_content
        db.session.commit()

        saved_files = save_generated_files(task_id, html_content, css_content, js_content)
        task.generated_files = list(saved_files.values())
        db.session.commit()
        add_task_log(task_id, f"Code generated successfully. Files saved: {list(saved_files.keys())}", 'info')

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

        logger.info(f"[EXECUTE] Task {task_id} -> reviewing")
        task.status = TaskStatus.reviewing
        db.session.commit()
        add_task_log(task_id, "AI reviewing generated code...", 'info')

        task = Task.query.get(task_id)
        if task.cancel_requested:
            task.status = TaskStatus.cancelled
            task.error_message = 'Task was cancelled'
            db.session.commit()
            add_task_log(task_id, "Task cancelled", 'warning')
            return

        score, feedback = llm.review_generated_code(html_content, css_content or '', js_content or '', user_prompt)
        logger.info(f"[EXECUTE] Review complete: score={score}/10")

        generation.score    = score
        generation.feedback = feedback
        task.final_score    = score
        task.status         = TaskStatus.completed
        task.completed_at   = datetime.utcnow()
        db.session.commit()
        add_task_log(task_id, f"Task completed with score: {score}/10", 'info', {'score': score, 'feedback': feedback})
        logger.info(f"[EXECUTE] Task {task_id} completed successfully with score {score}")

    except Exception as e:
        logger.error(f"[EXECUTE] Error executing task {task_id}: {e}", exc_info=True)
        task.status = TaskStatus.failed
        task.error_message = str(e)
        db.session.commit()
        add_task_log(task_id, f"Task failed: {str(e)}", 'error')


def run_generation(app, task_id: str, prompt: str, patient_id: str, fhir_base_url: str, access_token: str):
    """Background thread executor used by quick-generate blueprint."""
    with app.app_context():
        task = Task.query.get(task_id)
        if not task:
            return
        try:
            patient_name = _quick_patient_name(task, patient_id)
            patient_data = _prepare_quick_task(task, task_id, prompt, patient_name, patient_id, fhir_base_url, access_token)
            html, css, js, llm = _generate_quick_app(task, task_id, prompt, patient_data)
            _review_quick_app(task, task_id, prompt, html, css, js, llm)

        except Exception as e:
            logger.error(f"[QUICK-GENERATE] Error: {e}", exc_info=True)
            task.status = TaskStatus.failed
            task.error_message = str(e)
            db.session.commit()
            add_task_log(task_id, f"Error: {str(e)}", 'error')


def _build_generation_context(prompt: str, patient_id: str, fhir_base_url: str, access_token: str):
    print(f"[QUICK-GENERATE] Building generation context for patient={patient_id}", flush=True)
    print(f"[DEBUG] fhir_base_url={fhir_base_url} | token={'NONE' if not access_token else access_token[:30] + '...'}", flush=True)
    resources = get_supported_resources(fhir_base_url, access_token, patient_id)
    plan = plan_retrieval(prompt, patient_id, resources)
    raw_data = execute_retrieval(plan, fhir_base_url, access_token, patient_id)
    context = format_context(raw_data, plan)
    print(f"[QUICK-GENERATE] Final context keys: {list(context.keys())}", flush=True)
    return plan, context


def _generation_plan_text(prompt: str, patient_name: str, plan) -> str:
    plan_json = plan.to_dict()
    queries = "\n".join(
        f"{index}. {query['resource']}"
        for index, query in enumerate(plan_json['queries'], start=1)
    )
    return f"""## Generation Plan
**Prompt:** {prompt}
**Patient:** {patient_name}
**Rationale:** {plan_json['rationale'] or 'Dynamic retrieval from prompt'}
**Queries:**
{queries}
"""

def _direct_fetch_plan(patient_data: dict):
    queries = [{'resource': key} for key in patient_data if key != 'patient']
    return type('DirectFetchPlan', (), {'queries': queries, 'to_dict': lambda self: {
        'patient_scope': 'all' if patient_data.get('patient', {}).get('id') == 'all' else 'single',
        'queries': queries,
        'rationale': 'Direct patient context fetch',
    }})()


def _prepare_quick_task(task, task_id: str, prompt: str, patient_name: str, patient_id: str, fhir_base_url: str, access_token: str):
    add_task_log(task_id, "Preparing direct patient context..." if task.patient_data else "Planning retrieval from prompt...")
    plan, patient_data = _existing_patient_context(task) or _build_generation_context(prompt, patient_id, fhir_base_url, access_token)
    print(f"[QUICK-GENERATE] Retrieval plan for task={task_id}: {plan.to_dict()}", flush=True)
    task.plan = _generation_plan_text(prompt, patient_name, plan)
    task.patient_data = patient_data
    db.session.commit()
    add_task_log(task_id, f"Retrieval plan ready with {len(plan.queries)} query(s)")
    return patient_data


def _existing_patient_context(task):
    if not task.patient_data:
        return None
    print(f"[QUICK-GENERATE] Using preloaded patient context for task={task.id}", flush=True)
    print(f"[QUICK-GENERATE] Final context keys: {list(task.patient_data.keys())}", flush=True)
    return _direct_fetch_plan(task.patient_data), task.patient_data


def _quick_patient_name(task, patient_id: str) -> str:
    if task.patient_data:
        return task.patient_data.get('patient', {}).get('name') or f"Patient {patient_id}"
    return 'All Patients' if patient_id == 'all' else f"Patient {patient_id}"


def _generate_quick_app(task, task_id: str, prompt: str, patient_data: dict):
    task.status = TaskStatus.executing
    db.session.commit()
    add_task_log(task_id, "Calling AI to generate code...")
    print(f"[QUICK-GENERATE] Generating app for task={task_id} with context keys={list(patient_data.keys())}", flush=True)
    llm = ClaudeLLMService()
    html, css, js, _ = llm.generate_mini_app(prompt, patient_data)
    task.html_content, task.css_content, task.js_content = html, css, js
    db.session.commit()
    save_generated_files(task_id, html, css, js)
    add_task_log(task_id, f"Code generated: HTML ({len(html)} chars), CSS ({len(css or '')} chars), JS ({len(js or '')} chars)")
    add_task_log(task_id, "Files saved to disk")
    return html, css, js, llm


def _review_quick_app(task, task_id: str, prompt: str, html: str, css: str, js: str, llm: ClaudeLLMService):
    task.status = TaskStatus.reviewing
    db.session.commit()
    add_task_log(task_id, "AI reviewing generated code...")
    score, feedback = llm.review_generated_code(html, css or '', js or '', prompt)
    task.final_score = score
    task.status = TaskStatus.completed
    task.completed_at = datetime.now(timezone.utc)
    task.plan += f"\n\n## Review Feedback\n{feedback}"
    db.session.commit()
    add_task_log(task_id, f"Review complete. Score: {score}/10")
    add_task_log(task_id, "Task completed successfully")
