import json
import logging
from dataclasses import asdict, dataclass

from llm_service import CLINICAL_SYSTEM_PROMPT, ClaudeLLMService

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class RetrievalQuery:
    resource: str


@dataclass(frozen=True)
class RetrievalPlan:
    patient_scope: str
    queries: list[RetrievalQuery]
    rationale: str

    def to_dict(self):
        return {
            'patient_scope': self.patient_scope,
            'queries': [asdict(query) for query in self.queries],
            'rationale': self.rationale,
        }


def plan_retrieval(prompt: str, patient_id: str, supported_resources: list[str]) -> RetrievalPlan:
    llm = ClaudeLLMService()
    print(f"[RETRIEVAL-PLANNER] Planning retrieval for patient={patient_id} prompt={prompt[:160]!r}", flush=True)
    print(f"[RETRIEVAL-PLANNER] Supported resources: {supported_resources}", flush=True)
    response = llm.client.messages.create(
        model=llm.model,
        max_tokens=1200,
        temperature=0,
        system=_planner_system(patient_id, supported_resources),
        messages=[{"role": "user", "content": prompt}],
    )
    print(f"[RETRIEVAL-PLANNER] Raw planner response: {response.content[0].text[:1000]}", flush=True)
    plan = _parse_plan(response.content[0].text)
    _validate_resources(plan, supported_resources)
    print(f"[RETRIEVAL-PLANNER] Parsed plan: {plan.to_dict()}", flush=True)
    return plan


def _planner_system(patient_id: str, supported_resources: list[str]) -> str:
    scope = 'all' if patient_id == 'all' else 'single'
    resources = ", ".join(sorted(set(supported_resources)))
    rules = [
        "Plan FHIR retrieval for a hospital mini-app request.",
        f"Patient scope must be '{scope}'.",
        f"Allowed resources: {resources}.",
        "Return JSON only with keys: patient_scope, rationale, queries.",
        "Each query must include only one key: resource.",
        "Do not include params, filters, sort, count, or FHIR query strings.",
        "Pick only the smallest set of resource types needed for the request.",
    ]
    return "\n".join(rules)


def _parse_plan(raw: str) -> RetrievalPlan:
    payload = _parse_json_payload(raw)
    queries = [_parse_query(query) for query in payload.get('queries', [])]
    if not queries:
        raise ValueError("Rephrase the request with more specific details about the needs and context.")
    return RetrievalPlan(
        patient_scope=payload.get('patient_scope', 'single'),
        queries=queries,
        rationale=payload.get('rationale', '').strip(),
    )


def _parse_query(query: dict) -> RetrievalQuery:
    resource = str(query.get('resource', '')).strip()
    if not resource:
        raise ValueError(f"Invalid retrieval query: {query}")
    return RetrievalQuery(resource=resource)


def _strip_code_fence(raw: str) -> str:
    text = raw.strip()
    if not text.startswith("```"):
        return text
    text = text.split("```", 2)[1]
    return text[4:].strip() if text.startswith("json") else text.strip()


def _parse_json_payload(raw: str) -> dict:
    text = _strip_code_fence(raw)
    if text:
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

    start = min([idx for idx in (text.find('{'), text.find('[')) if idx != -1], default=-1)
    if start == -1:
        raise ValueError("Retrieval planner did not return JSON content")

    payload, _ = json.JSONDecoder().raw_decode(text[start:])
    return payload


def _validate_resources(plan: RetrievalPlan, supported_resources: list[str]):
    allowed = set(supported_resources)
    invalid = [query.resource for query in plan.queries if query.resource not in allowed]
    if invalid:
        raise ValueError(f"Unsupported resources in retrieval plan: {', '.join(invalid)}")
