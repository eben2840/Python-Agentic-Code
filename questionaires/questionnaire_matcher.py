import json
import logging
from llm_service import ClaudeLLMService

logger = logging.getLogger(__name__)


def select_best_questionnaire(catalog, user_request):
    catalog_text = "\n".join(
        f"- id: {r['id']} | title: {r.get('title') or r.get('name')} | url: {r['url']}"
        for r in catalog
    )
    try:
        raw = ClaudeLLMService().match_questionnaire(catalog_text, user_request)
        result = json.loads(raw)
        return next((r for r in catalog if r["id"] == result.get("id")), None)
    except Exception as e:
        logger.error("Failed to match questionnaire: %s", e)
        return None
