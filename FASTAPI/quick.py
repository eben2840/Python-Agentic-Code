from __future__ import annotations

import json
import re
import uuid
from string import Template

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from direct_fhir import get_patient_data_direct
from llm_service import ClaudeLLMService

from .auth import require_bearer
from .database import ROOT_DIR, get_db
from .models import Task, TaskComplexity, TaskLog, TaskStatus
from .schemas import ExtractRequest, QuickGenerateRequest
from .utils import add_log
from .worker import run_task_generation

router = APIRouter(prefix="/api/quick", tags=["quick"], dependencies=[Depends(require_bearer)])
PROMPTS_DIR = ROOT_DIR / "prompts"


@router.post("/extract")
def extract_transcript(payload: ExtractRequest):
    transcript = payload.transcript.strip()
    if not transcript:
        raise HTTPException(status_code=400, detail="transcript is required")
    response = ClaudeLLMService().client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        system=extraction_system(transcript),
        messages=[{"role": "user", "content": transcript}],
    )
    extracted = clear_questionnaire_if_not_requested(parse_json_response(response.content[0].text), transcript)
    return {"status": "ok", "extracted": extracted, "empty": not any(extracted.values()), "transcript": transcript}


QUESTIONNAIRE_REQUEST_RE = re.compile(
    r"\b(form|forms|questionnaire|questionnaires|questionaire|questionaires|survey|surveys)\b",
    re.IGNORECASE,
)


def is_questionnaire_request(transcript: str) -> bool:
    return bool(QUESTIONNAIRE_REQUEST_RE.search(transcript or ""))


def clear_questionnaire_if_not_requested(extracted, transcript: str):
    if not isinstance(extracted, dict) or is_questionnaire_request(transcript):
        return extracted
    extracted["questionnaire"] = []
    extracted["questionaire"] = []
    return extracted


def extraction_system(transcript: str = ""):
    files = ["extraction/extraction_base.md", "extraction/extraction_progress.md", "extraction/extraction_vitals.md", "extraction/extraction_medications.md", "extraction/extraction_interventions.md", "extraction/extraction_observations.md"]
    if is_questionnaire_request(transcript):
        files.append("questionaire/questionaire_base.md")
    return "\n\n".join(load_prompt(name).strip() for name in files)


def load_prompt(filename: str):
    return Template((PROMPTS_DIR / filename).read_text(encoding="utf-8")).safe_substitute()


def parse_json_response(raw: str):
    text = raw.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = min([i for i in (text.find("{"), text.find("[")) if i != -1], default=-1)
    if start == -1:
        raise ValueError("Model did not return JSON content")
    return json.JSONDecoder().raw_decode(text[start:])[0]


@router.post("/generate", status_code=202)
def generate(payload: QuickGenerateRequest, background: BackgroundTasks, db: Session = Depends(get_db)):
    patient_data = load_patient_data(payload)
    task = Task(id=str(uuid.uuid4()), title=payload.prompt[:100],
                description=payload.prompt, complexity=TaskComplexity.standard,
                status=TaskStatus.pending, patient_id=payload.patientId,
                fhir_base_url=payload.fhirBaseUrl, patient_data=patient_data)
    db.add(task)
    db.commit()
    add_log(db, task.id, "Task created, starting generation...")
    background.add_task(run_task_generation, task.id)
    return {"status": "processing", "task_id": task.id, "message": "Task started"}


@router.post("/summary", status_code=202)
def summary(payload: QuickGenerateRequest, background: BackgroundTasks, db: Session = Depends(get_db)):
    return generate(payload, background, db)


def load_patient_data(payload: QuickGenerateRequest):
    if payload.patientId == "all":
        return {"patients": []}
    return get_patient_data_direct({"fhir_base_url": payload.fhirBaseUrl, "patient_id": payload.patientId, "auth_token": payload.accessToken})


@router.get("/status/{task_id}")
def status(task_id: str, db: Session = Depends(get_db)):
    task = db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    logs = db.scalars(select(TaskLog).where(TaskLog.task_id == task_id).order_by(TaskLog.created_at.asc())).all()
    return {"task_id": task.id, "status": task.status.value, "title": task.title, "description": task.description, "score": task.final_score, "error": task.error_message, "activity": [log.message for log in logs]}
