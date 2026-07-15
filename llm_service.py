"""
Claude LLM Service - Generates healthcare mini apps using real FHIR patient data.
"""
import os
import re
import logging
from pathlib import Path
from string import Template
from anthropic import Anthropic

logger = logging.getLogger(__name__)

_PROMPTS_DIR = Path(__file__).parent / "prompts"

CLINICAL_SYSTEM_PROMPT = (
    "You are a clinical assistant. Only respond to healthcare, patient care, and clinical "
    "workflow requests. If the request is not related to healthcare, respond with: "
    "'I can only assist with clinical tasks.'"
)


def _load_prompt(filename: str, **kwargs) -> str:
    """Load a prompt template from the prompts/ directory and substitute variables."""
    raw = (_PROMPTS_DIR / filename).read_text(encoding="utf-8")
    return Template(raw).safe_substitute(**kwargs)


class ClaudeLLMService:

    def __init__(self):
        self.api_key = os.getenv('ANTHROPIC_API_KEY')
        self.client = Anthropic(api_key=self.api_key)
        self.model = "claude-sonnet-4-6"
        self.max_tokens = 20000

    def generate_mini_app(self, user_prompt: str, patient_data: dict) -> tuple:
        """Generate a mini app (HTML, CSS, JS) from a prompt and real FHIR patient data."""
        system_prompt = CLINICAL_SYSTEM_PROMPT + "\n\n" + _load_prompt("generate_miniapp.md",
            patient_name=patient_data.get('patient', {}).get('name', ''),
            patient_id=patient_data.get('patient', {}).get('id', ''),
            data_context=self._patient_context(patient_data),
        )

        response = self.client.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            temperature=0.3,
            system=system_prompt,
            messages=[{"role": "user", "content": f"Build this healthcare mini-app: {user_prompt}"}]
        )

        raw = response.content[0].text.strip()
        if response.stop_reason == "max_tokens":
            logger.warning("LLM response was truncated")

        html, css, js = self._parse_response(raw)

        if not html or len(html) < 100:
            raise ValueError("LLM did not return valid HTML")

        return html, css, js, raw

    def generate_idea(self, prompt: str) -> str:
        """Generate a mini-app idea description from a prompt."""
        response = self.client.messages.create(
            model=self.model,
            max_tokens=1500,
            system=CLINICAL_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": _load_prompt("generate_idea.md", prompt=prompt)}]
        )
        return response.content[0].text

    def match_questionnaire(self, catalog_text: str, user_request: str) -> str:
        response = self.client.messages.create(
            model=self.model,
            max_tokens=200,
            system="You are a JSON-only responder. Output only a raw JSON object. No explanation, no markdown, no extra text.",
            messages=[{"role": "user", "content": _load_prompt("questionnaire_matcher.md", user_request=user_request, catalog=catalog_text)}]
        )
        raw = response.content[0].text.strip()
        print(f"[QUESTIONNAIRE-MATCHER] Raw LLM response: {raw!r}")
        return raw

    def validate_generation(self, prompt: str, patient_id: str, context: dict) -> str:
        """Validate an upcoming mini-app generation against real FHIR data before it runs."""
        patient_scope = 'all' if patient_id == 'all' else patient_id
        response = self.client.messages.create(
            model=self.model,
            max_tokens=1024,
            system="You are a JSON-only responder. Output only a raw JSON object. No explanation, no markdown, no extra text.",
            messages=[{"role": "user", "content": _load_prompt(
                "validate_generation.md",
                prompt=prompt,
                patient_scope=patient_scope,
                data_context=self._patient_context(context),
            )}]
        )
        return response.content[0].text.strip()

    def review_generated_code(self, html: str, css: str, js: str, original_prompt: str) -> tuple:
        """Score the generated app 0-10 and return (score, feedback)."""
        response = self.client.messages.create(
            model=self.model,
            max_tokens=1024,
            system=CLINICAL_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": f"""Review this healthcare mini-app:
            REQUEST: {original_prompt}

            HTML:
            {html}

            CSS:
            {css}

            JS:
            {js}

            Score 0-10 on: completeness, code quality, UI/UX, data handling.

            Reply in this exact format:
            SCORE: [number]
            FEEDBACK: [your feedback]"""}]
                    )
        result = response.content[0].text
        score_match    = re.search(r'SCORE:\s*(\d+(?:\.\d+)?)', result)
        feedback_match = re.search(r'FEEDBACK:\s*(.+)', result, re.DOTALL)

        score    = float(score_match.group(1)) if score_match else 5.0
        feedback = feedback_match.group(1).strip() if feedback_match else result

        return min(10.0, max(0.0, score)), feedback

    def continue_mini_app(self, existing_html: str, existing_css: str, existing_js: str, changes: str, patient_data: dict = None) -> tuple:
        """Apply incremental changes to an existing mini app."""
        system_prompt = _load_prompt("continue_miniapp.md",
            data_context=self._patient_context(patient_data) if patient_data else "No patient data provided",
        )

        response = self.client.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": f"""Existing app:

            ```html
            {existing_html}
            ```
            ```css
            {existing_css}
            ```
            ```javascript
            {existing_js}
            ```
            Apply this change: {changes}"""}]
                    )

        raw = response.content[0].text
        html, css, js = self._parse_response(raw)

        if not html:
            return existing_html, existing_css, existing_js, raw

        return html, css, js, raw 

    # -------------------------------------------------------------------------
    # Helpers
    # -------------------------------------------------------------------------

    def _patient_context(self, patient_data: dict) -> str:
        """Render all real FHIR patient data as plain text for the LLM prompt."""
        patient = patient_data.get('patient', {})
        lines = []

        if patient:
            lines.append(f"Patient: {patient.get('name')} | Gender: {patient.get('gender')} | DOB: {patient.get('birthDate')} | ID: {patient.get('id')}")

        for key, section in patient_data.items():
            if key in ('patient', 'patients') or not isinstance(section, dict):
                continue
            summary = section.get('summary', [])
            if not summary:
                continue
            if key == 'location':
                print(f"[DEBUG-LOCATION] location summary sent to LLM: {summary}", flush=True)
            lines.append(f"\n{key} ({section.get('count', 0)} records):")
            for item in summary:
                lines.append(f"  {item.get('name')} | {item.get('value')} | {item.get('date')} | {item.get('status')}")

        for p in patient_data.get('patients', []):
            lines.append(f"\nPatient: {p.get('name')} | {p.get('gender')} | DOB: {p.get('birthDate')} | ID: {p.get('id')}")
            for rtype, records in (p.get('data') or {}).items():
                if records:
                    lines.append(f"  {rtype}: {len(records)} records")
                    for item in records:
                        lines.append(f"    {item.get('name')} | {item.get('value')} | {item.get('date')}")
 
        return "\n".join(lines) or "No patient data"


    def _parse_response(self, response: str) -> tuple:
        """Extract HTML, CSS, JS code blocks from the LLM response."""
        html = self._extract_block(response, 'html')
        css  = self._extract_block(response, 'css')
        js   = self._extract_block(response, 'javascript') or self._extract_block(response, 'js')

        if html and not css:
            style_matches = re.findall(r'<style[^>]*>(.*?)</style>', html, re.DOTALL | re.IGNORECASE)
            if style_matches:
                css  = '\n'.join(m.strip() for m in style_matches)
                html = re.sub(r'<style[^>]*>.*?</style>', '', html, flags=re.DOTALL | re.IGNORECASE)
                if 'styles.css' not in html:
                    html = html.replace('</head>', '  <link rel="stylesheet" href="styles.css">\n</head>')

        if html and not js:
            script_matches = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', html, re.DOTALL | re.IGNORECASE)
            if script_matches:
                js   = '\n'.join(m.strip() for m in script_matches if m.strip())
                html = re.sub(r'<script(?![^>]*src=)[^>]*>.*?</script>', '', html, flags=re.DOTALL | re.IGNORECASE)
                if 'app.js' not in html:
                    html = html.replace('</body>', '  <script src="app.js"></script>\n</body>')

        return html, css, js

    def _extract_block(self, text: str, language: str) -> str:
        """Extract a fenced code block by language name."""
        match = re.search(rf'```{language}\s*(.*?)\s*```', text, re.DOTALL)
        if not match:
            match = re.search(rf'```{language}\s*(.+)$', text, re.DOTALL)
        return match.group(1).strip() if match else ''


def check_llm_available() -> dict:
    return {
        'available': bool(os.getenv('ANTHROPIC_API_KEY')),
        'model': 'claude-sonnet-4-6',
    }
