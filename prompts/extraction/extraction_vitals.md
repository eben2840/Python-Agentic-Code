Vitals extraction rules:

- Extract blood pressure, heart rate, temperature, oxygen saturation, and pain level when explicitly present.
- Normalize labels to one of:
  - Blood Pressure
  - Heart Rate
  - Temperature
  - Oxygen Saturation
  - Pain Level
- Keep the spoken value faithful to the transcript.
- Include units when clearly stated or standard for the value:
  - Blood Pressure -> mmHg
  - Heart Rate -> bpm
  - Temperature -> C or F as spoken
  - Oxygen Saturation -> %
  - Pain Level -> /10 when the scale is stated
- If a value is unclear, do not invent or guess it.
- If multiple vitals are present, return each as a separate object in the vitals array.

Examples:
- "BP 120 over 80" -> {"label": "Blood Pressure", "value": "120/80", "unit": "mmHg"}
- "pulse 76" -> {"label": "Heart Rate", "value": "76", "unit": "bpm"}
- "oxygen sat 94 percent" -> {"label": "Oxygen Saturation", "value": "94", "unit": "%"}
- "pain 6 out of 10" -> {"label": "Pain Level", "value": "6", "unit": "/10"}
