from string import Template
import uuid
import json
import logging
import threading

from flask import Blueprint, request, jsonify, url_for, current_app

from models import db, Task, TaskStatus, TaskComplexity, TaskLog
from direct_fhir import get_patient_data_direct
from utils.helpers import add_task_log
from utils.auth import require_bearer, require_bearer_or_basic
from services.executor import run_generation
from llm_service import _PROMPTS_DIR, ClaudeLLMService

logger = logging.getLogger(__name__)

quick_generate = Blueprint('quick_generate', __name__, url_prefix='/api/quick')


def _load_prompt(filename: str, **kwargs) -> str:
    raw = (_PROMPTS_DIR / filename).read_text(encoding="utf-8")
    return Template(raw).safe_substitute(**kwargs)

def _build_extraction_system() -> str:
    prompt_files = [
        "extraction/extraction_base.md",
        "extraction/extraction_vitals.md",
        "extraction/extraction_medications.md",
        "extraction/extraction_interventions.md",
        "extraction/extraction_observations.md",
    ]
    return "\n\n".join(_load_prompt(filename).strip() for filename in prompt_files)


def _parse_json_response(raw: str):
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.rstrip("`").strip()
    return json.loads(text)





@quick_generate.route('/questionnaire/v1', methods=['POST'])
@require_bearer_or_basic
def extract_questionnaire():
    data          = request.get_json()
    transcript    = (data.get('transcript') or '').strip()
    questionnaire = (data.get('questionnaire') or '').strip()

    if not transcript:
        return jsonify({'status': 'error', 'error': 'transcript is required'}), 400
    if not questionnaire:
        return jsonify({'status': 'error', 'error': 'questionnaire is required'}), 400

    system = _load_prompt(
        'extraction/extraction_questionnaire.md',
        transcription=transcript,
        itemsDescription=questionnaire,
    )
  
    llm      = ClaudeLLMService()
    response = llm.client.messages.create(
        model=llm.model,
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": transcript}]
    )

    questionnaire = _parse_json_response(response.content[0].text)
    
    return jsonify({'status': 'ok', 'questionnaire': questionnaire, 'transcript': transcript,'code': 200, 'message': 'Questionnaire extracted'})


# cristian extraction model for backend testing,
@quick_generate.route('/v1/extract/', methods=['POST'])
@require_bearer_or_basic
def extract_transcript_careit_voice():
    data       = request.get_json()
    transcript = (data.get('transcript') or '').strip()

    if not transcript:
        return jsonify({'status': 'error', 'error': 'transcript is required'}), 400
    
    _EXTRACTION_SYSTEM = _build_extraction_system()

    llm      = ClaudeLLMService()
    response = llm.client.messages.create(
        model=llm.model,
        max_tokens=1024,
        system=_EXTRACTION_SYSTEM,
        messages=[{"role": "user", "content": transcript}]
    )
    extracted = _parse_json_response(response.content[0].text)
    print("Extracted data:===============================", extracted)
    print("Extracted data:", extracted)
    payload = {
    'extracted': extracted,
    'empty': not any(extracted.values()),
    'transcript': transcript,
    'code': 200,
    'message': 'Data extracted'
        }
    print("extract response payload:", payload)
    return jsonify(payload)





# 



