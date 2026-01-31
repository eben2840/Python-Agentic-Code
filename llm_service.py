"""
Claude LLM Service Module
Handles interaction with Anthropic Claude API for generating mini apps
"""

import os
import re
import json
import logging
from typing import Dict, Any, Optional, Tuple
from anthropic import Anthropic

logger = logging.getLogger(__name__)


class ClaudeLLMService:
    """Service for generating mini apps using Claude API"""

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize Claude LLM service
        
        Args:
            api_key: Anthropic API key. If not provided, uses ANTHROPIC_API_KEY env var
        """
        self.api_key = api_key or os.getenv('ANTHROPIC_API_KEY')
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable not set")
        
        self.client = Anthropic(api_key=self.api_key)
        self.model = "claude-sonnet-4-20250514"  # Using Claude 3.5 Sonnet
        self.max_tokens = 8192  # Standard token limit

    def generate_mini_app(
        self, 
        user_prompt: str, 
        patient_data: Dict[str, Any],
        complexity: str = "standard"
    ) -> Tuple[str, str, str, str]:
        """
        Generate a healthcare UI mini app - FOCUSED ON UI/UX EXCELLENCE
        
        Args:
            user_prompt: User's description of what they want
            patient_data: FHIR patient data dictionary
            complexity: Task complexity (simple, standard, complex)
            
        Returns:
            Tuple of (html_content, css_content, js_content, llm_response)
        """
        
        # Extract patient info for UI context
        patient_name = patient_data.get('patient', {}).get('name', 'Patient')
        patient_id = patient_data.get('patient', {}).get('id', 'Unknown')
        
        # Create simplified system prompt for beautiful but concise code
        system_prompt = f"""You are a healthcare UI developer. Create a BEAUTIFUL, MODERN mini-app with SIMPLE code.

PATIENT: {patient_name} (ID: {patient_id})
DATA AVAILABLE: {self._summarize_patient_data(patient_data)}

DESIGN STYLE (CLEAN, PROFESSIONAL, WHITE):
- Pure WHITE (#ffffff) or very light gray (#f8f9fa) backgrounds ONLY
- NO gradients, NO loud colors, NO flashy effects
- White cards with subtle shadows (box-shadow: 0 2px 12px rgba(0,0,0,0.08))
- Color accents ONLY for icons, badges, and small UI elements - NOT backgrounds
- Accent colors: muted teal #14b8a6, soft blue #3b82f6, gentle green #22c55e
- Subtle hover effects - clean and understated
- Status badges: light pastel backgrounds with darker text
- Clean borders,
- Think: Apple Health, Notion, Stripe - minimal, sophisticated, professional
- Use Font Awesome icons with small colored accents

REQUIREMENTS:
- Use Bootstrap 5 for layout (cards, grids, utilities)
- Keep JavaScript and nice  and beautiful.
- Use window.PATIENT_DATA only (NO mock/fake data generators)
- CSS can be detailed for beautiful styling

OUTPUT - exactly 3 code blocks:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Healthcare App</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- Beautiful HTML with Bootstrap classes -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="app.js"></script>
</body>
</html>
```

```css
/* Clean, minimal CSS - small readable fonts */
body {{ background: #ffffff; min-height: 100vh; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }}
h1 {{ font-size: 1.5rem; font-weight: 600; }}
h2 {{ font-size: 1.25rem; font-weight: 600; }}
h3 {{ font-size: 1rem; font-weight: 600; }}
p, span, td, li {{ font-size: 0.875rem; }}
.card {{ background: #ffffff; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); border: 1px solid #e5e7eb; }}
```

```javascript
// SHORT JavaScript - display REAL patient data
document.addEventListener('DOMContentLoaded', function() {{
    const data = window.PATIENT_DATA;
    if (!data) {{ document.body.innerHTML = '<p class="text-center mt-5">No patient data</p>'; return; }}

    // EXACT DATA STRUCTURE - use these paths:
    // data.patient.name, data.patient.gender, data.patient.birthDate
    // data.observations.summary (array) - each item: {{code, display, value, unit, date, status}}
    // data.conditions.summary (array) - each item: {{condition, status, onset, severity}}
    // data.medications.summary (array) - each item: {{medication, status, dosage, authoredOn}}
    // data.allergies.summary (array) - each item: {{allergen, type, criticality, status}}
    // data.vital_signs.summary (array) - each item: {{code, display, value, unit, date, status}}

    // Example: Loop through observations
    data.observations.summary.forEach(obs => {{
        console.log(obs.display, obs.value, obs.unit); // e.g., "Body Height", 172.9, "cm"
    }});
}});
```

CRITICAL RULES:
- Make it CLEAN and PROFESSIONAL with white backgrounds, subtle shadows, minimal accents
- NO gradients anywhere - pure white or very light gray backgrounds only
- Keep JavaScript SHORT - just read and display data
- ALWAYS use .summary arrays: data.observations.summary, data.conditions.summary, etc.
- Summary items have: {{code, display, value, unit, date}} for observations
- Summary items have: {{condition, status, onset}} for conditions
- NO mock data - ONLY window.PATIENT_DATA
- ALWAYS close all braces"""

        try:
            logger.info(f"[LLM] Calling Claude API for mini app generation...")
            logger.info(f"[LLM] Model: {self.model}, Max tokens: {self.max_tokens}")

            messages = [
                {
                    "role": "user",
                    "content": f"Create a healthcare mini-app: {user_prompt}"
                }
            ]

            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=0.3,  # Lower temperature for more consistent UI generation
                system=system_prompt,
                messages=messages
            )

            logger.info(f"[LLM] Response received from Claude API")
            logger.info(f"[LLM] Stop reason: {response.stop_reason}")

            llm_response = response.content[0].text.strip()

            # Warn if truncated but don't auto-continue (keeping code simple should prevent this)
            if response.stop_reason == "max_tokens":
                logger.warning(f"[LLM] Response was truncated - code may be incomplete")

            # Log the raw response for debugging
            logger.info(f"LLM response length: {len(llm_response)}")
            logger.info(f"Response preview: {llm_response[:200]}...")

            # Parse the response to extract HTML, CSS, and JS blocks
            logger.info("Parsing LLM response to extract HTML, CSS, JS...")
            html_content, css_content, js_content = self._parse_response(llm_response)

            # Validate that we got proper content
            if not html_content or len(html_content) < 100:
                logger.error("Failed to extract valid HTML from LLM response")
                raise Exception("LLM did not generate properly formatted HTML content")

            logger.info(f"Parsed successfully - HTML: {len(html_content)} chars, CSS: {len(css_content)} chars, JS: {len(js_content)} chars")

            # Check for incomplete JavaScript (common truncation indicator)
            if js_content:
                # Check for unbalanced braces
                open_braces = js_content.count('{') - js_content.count('}')
                open_parens = js_content.count('(') - js_content.count(')')
                if open_braces > 0 or open_parens > 0:
                    logger.warning(f"WARNING: JS may be incomplete - unbalanced braces: {open_braces}, parens: {open_parens}")

            if not js_content:
                logger.warning("WARNING: JS content is EMPTY after parsing!")

            return html_content, css_content, js_content, llm_response

        except Exception as e:
            logger.error(f"Error generating mini app: {e}")
            # No fallback - let it fail with real error
            raise e
    
    def _summarize_patient_data(self, patient_data: Dict[str, Any]) -> str:
        """Summarize patient data with sample values for LLM context"""
        lines = []

        # Show observations with sample
        if 'observations' in patient_data:
            obs = patient_data['observations']
            if isinstance(obs, dict) and obs.get('summary'):
                lines.append(f"observations.summary: {obs.get('count', 0)} items")
                # Show first 3 samples
                for item in obs['summary'][:3]:
                    lines.append(f"  - {item.get('display', 'N/A')}: {item.get('value', 'N/A')} {item.get('unit', '')}")

        # Show conditions with sample
        if 'conditions' in patient_data:
            cond = patient_data['conditions']
            if isinstance(cond, dict) and cond.get('summary'):
                lines.append(f"conditions.summary: {cond.get('count', 0)} items")
                for item in cond['summary'][:3]:
                    lines.append(f"  - {item.get('condition', 'N/A')}")

        # Show medications with sample
        if 'medications' in patient_data:
            meds = patient_data['medications']
            if isinstance(meds, dict) and meds.get('summary'):
                lines.append(f"medications.summary: {meds.get('count', 0)} items")
                for item in meds['summary'][:3]:
                    lines.append(f"  - {item.get('medication', 'N/A')}")

        # Show allergies with sample
        if 'allergies' in patient_data:
            allergies = patient_data['allergies']
            if isinstance(allergies, dict) and allergies.get('summary'):
                lines.append(f"allergies.summary: {allergies.get('count', 0)} items")
                for item in allergies['summary'][:3]:
                    lines.append(f"  - {item.get('allergen', 'N/A')} ({item.get('criticality', 'N/A')})")

        # Show vital signs with sample
        if 'vital_signs' in patient_data:
            vitals = patient_data['vital_signs']
            if isinstance(vitals, dict) and vitals.get('summary'):
                lines.append(f"vital_signs.summary: {vitals.get('count', 0)} items")
                for item in vitals['summary'][:3]:
                    lines.append(f"  - {item.get('display', 'N/A')}: {item.get('value', 'N/A')} {item.get('unit', '')}")

        return "\n".join(lines) if lines else "Basic patient info only"

    def _build_system_prompt(self, complexity: str) -> str:
        """Build the system prompt for Claude"""
        complexity_guidance = {
            "simple": "Create a simple, single-page application with minimal styling.",
            "standard": "Create a well-designed application with good UX and proper styling.",
            "complex": "Create a comprehensive application with advanced features, animations, and professional styling."
        }
        
        return f"""You are an expert healthcare application developer specializing in SMART on FHIR applications.
Your task is to generate a complete, functional mini web application based on patient health data.

{complexity_guidance.get(complexity, complexity_guidance['standard'])}

IMPORTANT GUIDELINES:
1. Create a COMPLETE, self-contained application that works immediately
2. Use modern, clean design with a healthcare-appropriate color scheme
3. Make the application responsive and mobile-friendly
4. Include proper data visualization for health metrics (charts, graphs, tables)
5. Handle missing or null data gracefully
6. Include appropriate icons and visual indicators for health status
7. Use semantic HTML5 and accessible design patterns
8. The application should be visually appealing and professional

OUTPUT FORMAT:
You MUST provide your response in the following format with clear markers:

```html
<!-- Your complete HTML here -->
```

```css
/* Your complete CSS here */
```

```javascript
// Your complete JavaScript here
```

TECHNICAL REQUIREMENTS:
- HTML should be complete with proper DOCTYPE, head, and body
- CSS should be embedded in a <style> tag within the HTML OR provided separately
- JavaScript should be embedded in a <script> tag within the HTML OR provided separately
- Use Chart.js (via CDN) for any charts/graphs
- Use Font Awesome (via CDN) for icons if needed
- Do NOT use any backend APIs - all data will be passed via window.PATIENT_DATA
- The app should read patient data from window.PATIENT_DATA global variable

DATA ACCESS:
The patient data will be available in the global variable window.PATIENT_DATA with this structure:
- window.PATIENT_DATA.patient: {{id, name, gender, birthDate}}
- window.PATIENT_DATA.observations: {{count, summary: [{{code, value, unit, date}}]}}
- window.PATIENT_DATA.conditions: {{count, summary: [{{condition, status, onset}}]}}
- window.PATIENT_DATA.medications: {{count, summary: [{{medication, status, dosage}}]}}
- window.PATIENT_DATA.allergies: {{count, summary: [{{allergen, type, criticality}}]}}

Always check if data exists before using it (e.g., if (window.PATIENT_DATA && window.PATIENT_DATA.observations))"""

    def _build_user_message(self, user_prompt: str, patient_data: Dict[str, Any]) -> str:
        """Build the user message with patient context"""
        # Create a summary of patient data for the prompt
        patient_summary = self._create_patient_summary(patient_data)
        
        return f"""Create a mini web application based on the following request:

USER REQUEST:
{user_prompt}

PATIENT DATA CONTEXT:
{patient_summary}

Please generate the complete HTML, CSS, and JavaScript code for this application.
The application should:
1. Display relevant patient information based on the request
2. Use appropriate visualizations for the data
3. Be fully functional and visually appealing
4. Handle the specific patient data provided

Remember to output your code in the format specified (```html, ```css, ```javascript blocks)."""

    def _create_patient_summary(self, patient_data: Dict[str, Any]) -> str:
        """Create a summary of patient data for the prompt"""
        summary_parts = []
        
        # Patient demographics
        patient = patient_data.get('patient', {})
        summary_parts.append(f"""Patient Demographics:
- Name: {patient.get('name', 'Unknown')}
- Gender: {patient.get('gender', 'Unknown')}
- Date of Birth: {patient.get('birthDate', 'Unknown')}""")
        
        # Observations
        obs = patient_data.get('observations', {})
        if obs.get('count', 0) > 0:
            obs_summary = obs.get('summary', [])[:10]  # Limit for prompt
            obs_text = "\n".join([
                f"  - {o.get('code', 'Unknown')}: {o.get('value', 'N/A')} {o.get('unit', '')} ({o.get('date', 'N/A')})"
                for o in obs_summary
            ])
            summary_parts.append(f"""Observations ({obs.get('count', 0)} total):
{obs_text}""")
        
        # Conditions
        cond = patient_data.get('conditions', {})
        if cond.get('count', 0) > 0:
            cond_summary = cond.get('summary', [])
            cond_text = "\n".join([
                f"  - {c.get('condition', 'Unknown')} (Status: {c.get('status', 'N/A')})"
                for c in cond_summary
            ])
            summary_parts.append(f"""Conditions ({cond.get('count', 0)} total):
{cond_text}""")
        
        # Medications
        meds = patient_data.get('medications', {})
        if meds.get('count', 0) > 0:
            med_summary = meds.get('summary', [])
            med_text = "\n".join([
                f"  - {m.get('medication', 'Unknown')} - {m.get('dosage', 'N/A')} (Status: {m.get('status', 'N/A')})"
                for m in med_summary
            ])
            summary_parts.append(f"""Medications ({meds.get('count', 0)} total):
{med_text}""")
        
        # Allergies
        allergies = patient_data.get('allergies', {})
        if allergies.get('count', 0) > 0:
            allergy_summary = allergies.get('summary', [])
            allergy_text = "\n".join([
                f"  - {a.get('allergen', 'Unknown')} (Criticality: {a.get('criticality', 'N/A')})"
                for a in allergy_summary
            ])
            summary_parts.append(f"""Allergies ({allergies.get('count', 0)} total):
{allergy_text}""")
        
        return "\n\n".join(summary_parts)

    def _parse_response(self, response: str) -> Tuple[str, str, str]:
        """
        Parse the LLM response to extract HTML, CSS, and JavaScript
        Always returns separate files - extracts embedded content if needed

        Returns:
            Tuple of (html_content, css_content, js_content)
        """
        logger.info(f"[_parse_response] Starting to parse response ({len(response)} chars)")
        html_content = ""
        css_content = ""
        js_content = ""

        # Extract HTML from code block
        html_match = re.search(r'```html\s*(.*?)\s*```', response, re.DOTALL)
        if html_match:
            html_content = html_match.group(1).strip()
            logger.info(f"[_parse_response] Extracted HTML: {len(html_content)} chars")
        else:
            logger.warning("[_parse_response] No HTML code block found")

        # Extract CSS from code block
        css_match = re.search(r'```css\s*(.*?)\s*```', response, re.DOTALL)
        if css_match:
            css_content = css_match.group(1).strip()
            logger.info(f"[_parse_response] Extracted CSS: {len(css_content)} chars")
        else:
            logger.warning("[_parse_response] No CSS code block found")

        # Extract JavaScript from code block
        logger.info("[_parse_response] Attempting to extract JavaScript...")
        js_match = re.search(r'```javascript\s*(.*?)\s*```', response, re.DOTALL)
        if not js_match:
            logger.info("[_parse_response] No closed ```javascript block, trying ```js...")
            js_match = re.search(r'```js\s*(.*?)\s*```', response, re.DOTALL)
        if not js_match:
            logger.info("[_parse_response] No closed JS block, trying unclosed ```javascript...")
            # Handle unclosed javascript block (Claude sometimes forgets to close it)
            js_match = re.search(r'```javascript\s*(.*)$', response, re.DOTALL)
        if js_match:
            js_content = js_match.group(1).strip()
            logger.info(f"[_parse_response] Extracted JS from code block: {len(js_content)} chars")
        else:
            logger.warning("[_parse_response] No JavaScript code block found at all")

        # If CSS/JS are embedded in HTML, extract them
        if html_content and (not css_content or not js_content):
            logger.info("Extracting embedded CSS/JS from HTML...")

            # Extract embedded CSS from <style> tags
            if not css_content:
                style_matches = re.findall(r'<style[^>]*>(.*?)</style>', html_content, re.DOTALL | re.IGNORECASE)
                if style_matches:
                    css_content = '\n\n'.join(match.strip() for match in style_matches)
                    # Remove <style> tags from HTML (keep link to external CSS)
                    html_content = re.sub(r'<style[^>]*>.*?</style>\s*', '', html_content, flags=re.DOTALL | re.IGNORECASE)
                    # Add link to external CSS if not present
                    if 'styles.css' not in html_content:
                        html_content = html_content.replace('</head>', '    <link rel="stylesheet" href="styles.css">\n</head>')

            # Extract embedded JS from <script> tags (not CDN scripts)
            if not js_content:
                # Match script tags that don't have src attribute (inline scripts)
                script_matches = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', html_content, re.DOTALL | re.IGNORECASE)
                if script_matches:
                    js_content = '\n\n'.join(match.strip() for match in script_matches if match.strip())
                    # Remove inline <script> tags from HTML
                    html_content = re.sub(r'<script(?![^>]*src=)[^>]*>.*?</script>\s*', '', html_content, flags=re.DOTALL | re.IGNORECASE)
                    # Add link to external JS if not present
                    if 'app.js' not in html_content:
                        html_content = html_content.replace('</body>', '    <script src="app.js"></script>\n</body>')

        return html_content, css_content, js_content

    def generate_idea(self, prompt: str, patient_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Generate a SMART on FHIR app idea based on user prompt
        
        Args:
            prompt: User's description of what kind of app they want
            patient_data: Optional patient data for context
            
        Returns:
            Dictionary with title, description, features, data_used, user_benefit
        """
        system = """You are a healthcare technology expert specializing in SMART on FHIR applications.
Generate creative, practical ideas for healthcare mini-applications.
Your ideas should be:
1. Clinically relevant and useful
2. Technically feasible as a web application
3. Appropriate for the patient data available
4. Well-structured with clear features

Return a JSON object with this structure (no markdown, just pure JSON):
{
  "title": "App Name",
  "description": "Brief description of the app",
  "features": ["Feature 1", "Feature 2", "Feature 3"],
  "data_used": "What patient data it would display/use",
  "user_benefit": "How this helps the patient or clinician",
  "technical_specification": "Brief technical notes"
}"""

        context = ""
        if patient_data:
            patient = patient_data.get('patient', {})
            context = f"""
Patient Context:
- Has {patient_data.get('observations', {}).get('count', 0)} observations
- Has {patient_data.get('conditions', {}).get('count', 0)} conditions  
- Has {patient_data.get('medications', {}).get('count', 0)} medications
- Has {patient_data.get('allergies', {}).get('count', 0)} allergies"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=system,
                messages=[
                    {"role": "user", "content": f"Generate a SMART on FHIR mini-app idea based on: {prompt}{context}"}
                ]
            )
            
            # Parse the JSON response
            response_text = response.content[0].text.strip()
            
            # Try to extract JSON from markdown code blocks
            json_match = re.search(r'```json\s*(\{.*?\})\s*```', response_text, re.DOTALL)
            if json_match:
                response_text = json_match.group(1)
            
            # Try to extract JSON from plain text
            if not response_text.startswith('{'):
                json_match = re.search(r'(\{.*\})', response_text, re.DOTALL)
                if json_match:
                    response_text = json_match.group(1)
            
            idea_data = json.loads(response_text)
            
            # Ensure required fields
            return {
                'title': idea_data.get('title', 'SMART on FHIR App'),
                'description': idea_data.get('description', 'A healthcare mini-app'),
                'features': idea_data.get('features', []),
                'data_used': idea_data.get('data_used', 'Patient health data'),
                'user_benefit': idea_data.get('user_benefit', 'Improved healthcare experience'),
                'technical_specification': idea_data.get('technical_specification', '')
            }
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing idea JSON: {e}")
            # Return a fallback structured response
            return {
                'title': 'SMART on FHIR App',
                'description': response.content[0].text if response.content else 'A healthcare mini-app',
                'features': ['Patient data visualization', 'Health metrics tracking'],
                'data_used': 'Patient observations, conditions, medications',
                'user_benefit': 'Improved healthcare management',
                'technical_specification': ''
            }
        except Exception as e:
            logger.error(f"Error generating idea: {e}")
            raise

    def review_generated_code(self, html: str, css: str, js: str, original_prompt: str) -> Tuple[float, str]:
        """
        Review generated code and provide a score and feedback
        
        Args:
            html: Generated HTML
            css: Generated CSS
            js: Generated JavaScript
            original_prompt: The original user request
            
        Returns:
            Tuple of (score 0-10, feedback string)
        """
        review_prompt = f"""Review this generated SMART on FHIR mini-app code:

ORIGINAL REQUEST: {original_prompt}

HTML:
```html
{html[:3000]}
```

CSS:
```css
{css[:1000] if css else 'Embedded in HTML'}
```

JavaScript:
```javascript
{js[:2000] if js else 'Embedded in HTML'}
```

Score this application from 0-10 based on:
1. Completeness - Does it fulfill the request?
2. Code Quality - Is the code well-structured?
3. UI/UX - Is it visually appealing and usable?
4. Data Handling - Does it properly use patient data?
5. Error Handling - Does it handle edge cases?

Respond in this exact format:
SCORE: [number 0-10]
FEEDBACK: [your detailed feedback]"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                messages=[
                    {"role": "user", "content": review_prompt}
                ]
            )
            
            result = response.content[0].text
            
            # Parse score
            score_match = re.search(r'SCORE:\s*(\d+(?:\.\d+)?)', result)
            score = float(score_match.group(1)) if score_match else 5.0
            
            # Parse feedback
            feedback_match = re.search(r'FEEDBACK:\s*(.+)', result, re.DOTALL)
            feedback = feedback_match.group(1).strip() if feedback_match else result
            
            return min(10.0, max(0.0, score)), feedback
            
        except Exception as e:
            logger.error(f"Error reviewing code: {e}")
            return 5.0, f"Review failed: {str(e)}"

    def continue_mini_app(
        self,
        existing_html: str,
        existing_css: str,
        existing_js: str,
        changes: str,
        patient_data: Optional[Dict[str, Any]] = None
    ) -> Tuple[str, str, str, str]:
        """
        Apply incremental changes to an existing mini app

        Args:
            existing_html: Current HTML content
            existing_css: Current CSS content
            existing_js: Current JavaScript content
            changes: Description of changes to make
            patient_data: Patient data context

        Returns:
            Tuple of (html_content, css_content, js_content, llm_response)
        """
        system_prompt = """You are an expert healthcare application developer.
Your task is to MODIFY an existing SMART on FHIR application based on the user's requested changes.

IMPORTANT RULES:
1. PRESERVE the existing structure and functionality
2. Only make the SPECIFIC changes requested
3. Keep all existing styling and design
4. Do not remove any existing features unless explicitly asked
5. Maintain all patient data handling code
6. Keep the same overall look and feel

OUTPUT FORMAT:
Return the COMPLETE updated code in THREE SEPARATE code blocks:

```html
<!-- Complete updated HTML file -->
```

```css
/* Complete updated CSS file */
```

```javascript
// Complete updated JavaScript file
```

IMPORTANT: Always return all three files, even if only one changed."""

        user_message = f"""Here is the existing application:

CURRENT HTML:
```html
{existing_html}
```

{f"CURRENT CSS:" + chr(10) + "```css" + chr(10) + existing_css + chr(10) + "```" if existing_css else ""}

{f"CURRENT JAVASCRIPT:" + chr(10) + "```javascript" + chr(10) + existing_js + chr(10) + "```" if existing_js else ""}

REQUESTED CHANGES:
{changes}

Please apply ONLY the requested changes while preserving everything else.
Return the complete updated application code."""

        try:
            logger.info(f"Applying changes to mini app: {changes[:100]}...")

            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_message}
                ]
            )

            llm_response = response.content[0].text
            html_content, css_content, js_content = self._parse_response(llm_response)

            # If parsing failed, return original content
            if not html_content:
                logger.warning("Could not parse updated HTML, returning original")
                html_content = existing_html
                css_content = existing_css
                js_content = existing_js

            logger.info("Changes applied successfully")
            return html_content, css_content, js_content, llm_response

        except Exception as e:
            logger.error(f"Error applying changes: {e}")
            raise


def get_llm_service() -> ClaudeLLMService:
    """Get a configured LLM service instance"""
    return ClaudeLLMService()


def check_llm_available() -> Dict[str, Any]:
    """Check if LLM service is available"""
    api_key = os.getenv('ANTHROPIC_API_KEY')
    return {
        'available': bool(api_key),
        'provider': 'Anthropic',
        'model': 'claude-sonnet-4-20250514',
        'configured': bool(api_key)
    }
