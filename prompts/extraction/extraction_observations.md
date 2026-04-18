Observation extraction rules:

- Extract patient state, symptoms, feeling, comfort, and orientation findings.
- Normalize labels where possible to short consistent labels such as:
  - Patient Feeling
  - Orientation
  - Mental Status
  - Comfort
- Keep the value concise and faithful to the transcript.
- Do not create an observation unless the transcript actually states one.
- Return one object per observation in the observations array.

Examples:
- "patient feels dizzy" -> {"label": "Patient Feeling", "value": "dizzy"}
- "alert and oriented times three" -> {"label": "Orientation", "value": "alert and oriented x3"}
- "confused and disoriented" -> {"label": "Mental Status", "value": "confused, disoriented"}
- "resting comfortably" -> {"label": "Comfort", "value": "resting comfortably"}
