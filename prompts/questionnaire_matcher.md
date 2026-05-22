Given a user request and a list of questionnaires, return the single best matching questionnaire as a raw JSON object.

User request: $user_request

Available questionnaires:
$catalog

Output rules:
- Output ONLY the raw JSON object — no explanation, no markdown, no text before or after
- Do not wrap in code fences
- If nothing matches, return: {"id": "", "url": "", "title": ""}

Output format:
{"id": "<id>", "url": "<url>", "title": "<title>"}
