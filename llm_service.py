"""
Claude LLM Service - Generates healthcare mini apps using real FHIR patient data.
"""
import os
import re
import logging
from anthropic import Anthropic

logger = logging.getLogger(__name__)


class ClaudeLLMService:

    def __init__(self):
        self.api_key = os.getenv('ANTHROPIC_API_KEY')
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")
        self.client = Anthropic(api_key=self.api_key)
        self.model = "claude-sonnet-4-20250514"
        self.max_tokens = 8192

    # -------------------------------------------------------------------------
    # Public API
    # -------------------------------------------------------------------------

    def generate_mini_app(self, user_prompt: str, patient_data: dict) -> tuple:
        """
        Generate a mini app (HTML, CSS, JS) from a prompt and real FHIR patient data.
        Returns (html, css, js, raw_llm_response).
        """
        patient_name = patient_data.get('patient', {}).get('name', '')
        patient_id   = patient_data.get('patient', {}).get('id', '')
        data_context = self._patient_context(patient_data)

        system_prompt = f"""You are a healthcare UI developer. Build a clean, professional mini-app using ONLY the real patient data below.

PATIENT: {patient_name} (ID: {patient_id})

REAL PATIENT DATA FROM FHIR:
{data_context}

NO DEMO DATA — ABSOLUTE RULE:
- Every value displayed MUST come from window.PATIENT_DATA — never hardcode any names, numbers, dates, or clinical values
- If data is missing for a section, show "No data available" — do NOT invent values

DESIGN STYLE (CLEAN, PROFESSIONAL, WHITE):
- Pure WHITE (#ffffff) or very light gray (#f8f9fa) backgrounds ONLY
- NO gradients, NO loud colors, NO flashy effects
- White cards with subtle shadows (box-shadow: 0 2px 12px rgba(0,0,0,0.08))
- Color accents ONLY for icons, badges, and small UI elements — NOT backgrounds
- Accent colors: muted teal #14b8a6, soft blue #3b82f6, gentle green #22c55e
- Subtle hover effects — clean and understated
- Status badges: light pastel backgrounds with darker text
- Think: Apple Health, Notion, Stripe — minimal, sophisticated, professional
- Use Font Awesome icons with small colored accents

REQUIREMENTS:
- Use Bootstrap 5 for layout (cards, grids, utilities)
- Separate HTML / CSS / JS files (link styles.css and app.js)
- Small readable fonts: body 14px, headings 1–1.5rem, no giant text
- White cards: border-radius 12px, box-shadow 0 2px 12px rgba(0,0,0,0.08), border 1px solid #e5e7eb

DATA STRUCTURE IN window.PATIENT_DATA:

Single patient mode (data.patient.id !== 'all'):
  data.patient.name, data.patient.gender, data.patient.birthDate
  data.<resourcetype>.summary → array of {{name, status, date, value}}
  data.locations.summary → array of {{name: "Room 1811", value: "ENT Ward", status: "active"}}
  (name = room name, value = ward name — resolved from Encounter → Location → partOf chain)

All patients mode (data.patient.id === 'all'):
  data.patients → array where each patient has their own data:
  [{{ id, name, gender, birthDate, data: {{ condition: [...], observation: [...], vital_signs: [...] }} }}]
  Filter example: data.patients.filter(p => p.data.condition?.some(c => c.name?.includes('Diabetes')))

OUTPUT — exactly 3 code blocks: ```html  ```css  ```javascript"""

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
        """Generate a mini-app idea description from a prompt. Returns plain text."""
        response = self.client.messages.create(
            model=self.model,
            max_tokens=1500,
            messages=[{"role": "user", "content": f"""Generate a healthcare SMART on FHIR mini-app idea for: "{prompt}"

Describe:
1. Title
2. What the app shows and does
3. Key features
4. How it uses patient data"""}]
        )
        return response.content[0].text

    def review_generated_code(self, html: str, css: str, js: str, original_prompt: str) -> tuple:
        """
        Score the generated app 0-10 and return feedback.
        Returns (score, feedback).
        """
        response = self.client.messages.create(
            model=self.model,
            max_tokens=1024,
            messages=[{"role": "user", "content": f"""Review this healthcare mini-app:

REQUEST: {original_prompt}

HTML: {html[:3000]}
CSS: {css[:1000]}
JS: {js[:2000]}

Score 0-10 on: completeness, code quality, UI/UX, data handling.

Reply in this exact format:
SCORE: [number]
FEEDBACK: [your feedback]"""}]
        )

        result = response.content[0].text
        score_match = re.search(r'SCORE:\s*(\d+(?:\.\d+)?)', result)
        feedback_match = re.search(r'FEEDBACK:\s*(.+)', result, re.DOTALL)

        score = float(score_match.group(1)) if score_match else 5.0
        feedback = feedback_match.group(1).strip() if feedback_match else result

        return min(10.0, max(0.0, score)), feedback

    def continue_mini_app(self, existing_html: str, existing_css: str, existing_js: str, changes: str, patient_data: dict = None) -> tuple:
        """
        Apply changes to an existing mini app.
        Returns (html, css, js, raw_llm_response).
        """
        data_context = self._patient_context(patient_data) if patient_data else "No patient data provided"

        response = self.client.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            system=f"""You are a healthcare UI developer. Apply ONLY the requested changes to the existing app.

REAL PATIENT DATA (use this when the change requires referencing patient values):
{data_context}

CRITICAL: window.PATIENT_DATA is injected at runtime by the backend — do NOT modify, replace, or add fallback values for it.
Return all 3 files even if only one changed. Use ```html ```css ```javascript blocks.""",
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
        lines = []

        patient = patient_data.get('patient', {})
        if patient:
            lines.append(f"Patient: {patient.get('name')} | Gender: {patient.get('gender')} | DOB: {patient.get('birthDate')} | ID: {patient.get('id')}")

        # Single patient — loop over all resource sections dynamically
        for key, section in patient_data.items():
            if key in ('patient', 'patients') or not isinstance(section, dict):
                continue
            summary = section.get('summary', [])
            if not summary:
                continue
            lines.append(f"\n{key} ({section.get('count', 0)} records):")
            for item in summary:
                lines.append(f"  {item.get('name')} | {item.get('value')} | {item.get('date')} | {item.get('status')}")

        # All patients — show each patient with their own data
        for p in patient_data.get('patients', []):
            lines.append(f"\nPatient: {p.get('name')} | {p.get('gender')} | DOB: {p.get('birthDate')} | ID: {p.get('id')}")
            for rtype, records in (p.get('data') or {}).items():
                if records:
                    lines.append(f"  {rtype}: {len(records)} records")
                    for item in records[:3]:
                        lines.append(f"    {item.get('name')} | {item.get('value')} | {item.get('date')}")

        return "\n".join(lines) or "No patient data"

    def _parse_response(self, response: str) -> tuple:
        """Extract HTML, CSS, JS code blocks from the LLM response."""
        html = self._extract_block(response, 'html')
        css  = self._extract_block(response, 'css')
        js   = self._extract_block(response, 'javascript') or self._extract_block(response, 'js')

        # If CSS/JS are embedded inside the HTML, pull them out
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
            # Handle unclosed block at end of response
            match = re.search(rf'```{language}\s*(.+)$', text, re.DOTALL)
        return match.group(1).strip() if match else ''


def check_llm_available() -> dict:
    return {
        'available': bool(os.getenv('ANTHROPIC_API_KEY')),
        'model': 'claude-sonnet-4-20250514',
    }
