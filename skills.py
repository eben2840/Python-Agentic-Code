from string import Template
import uuid
import json
import logging
import threading
import re
from flask import Blueprint, request, jsonify, url_for, current_app

from models import db, Task, TaskStatus, TaskComplexity, TaskLog
from direct_fhir import get_patient_data_direct
from utils.helpers import add_task_log
from utils.auth import require_bearer, require_bearer_or_basic
from services.executor import run_generation
from llm_service import _PROMPTS_DIR, ClaudeLLMService

logger = logging.getLogger(__name__)

skills = Blueprint('skills', __name__, url_prefix='/api/skills')


def _load_prompt(filename: str, **kwargs) -> str:
    raw = (_PROMPTS_DIR / filename).read_text(encoding="utf-8")
    return Template(raw).safe_substitute(**kwargs)


def _build_extraction_system() -> str:
    manifest = json.loads((_PROMPTS_DIR / "extraction" / "index.json").read_text(encoding="utf-8"))
    prompt_files = [f"extraction/{name}" for name in manifest.get("files", [])]
    return "\n\n".join(_load_prompt(filename).strip() for filename in prompt_files)


def _parse_json_response(raw: str):
    text = raw.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.rstrip("`").strip()
    return json.loads(text)



# cristian extraction model for backend testing,
@skills.route('/questionnaire/v1/', methods=['POST'])
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

    
    raw = response.content[0].text.strip()
    match = re.search(r'```(?:json)?\s*([\s\S]*?)```', raw)
    if match:
        raw = match.group(1).strip()
    if not raw:
        return jsonify({'status': 'error', 'error': 'LLM returned no JSON'}), 500
    questionnaire = json.loads(raw)
    return jsonify({'status': 'ok', 'questionnaire': questionnaire, 'transcript': transcript, 'code': 200, 'message': 'Questionnaire extracted'})




@skills.route('/extraction/v1/', methods=['POST'])
@require_bearer_or_basic
def extract_transcript_skills():
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
