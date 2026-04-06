import json
import logging
from llm_service import ClaudeLLMService

logger = logging.getLogger(__name__)


def enhance_transfer_meta(title: str, description: str, html_content: str) -> tuple:
    """Use Claude to generate a clean title, description and Material Design icon name for a transferred mini app."""

    prompt = f"""You are given a healthcare mini app with the following details:

Title: {title}
Description: {description}

HTML (first 2000 chars):
{html_content[:2000]}

Generate:
1. A concise, accurate title (max 10 words)
2. A clear description (max 30 words) for clinical users
3. A single Material Design icon name (e.g. "monitor_heart", "medication", "vaccines") that best represents this app

Respond with valid JSON only:
{{"title": "...", "description": "...", "icon": "..."}}"""

    llm      = ClaudeLLMService()
    response = llm.client.messages.create(
        model=llm.model,
        max_tokens=256,
        messages=[{"role": "user", "content": prompt}]
    )

    text   = response.content[0].text.strip().strip('```json').strip('```').strip()
    result = json.loads(text)
    return result["title"], result["description"], result["icon"]
