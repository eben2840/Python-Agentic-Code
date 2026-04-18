Intervention extraction rules:

- Extract nursing care actions such as:
  - mobility assist
  - repositioning
  - meal assist
  - hygiene
  - toileting
- Normalize intervention labels to short clear names.
- Keep the value concise and faithful to what was done.
- Do not convert an observation into an intervention.
- Return one object per intervention in the interventions array.

Examples:
- "repositioned to left side" -> {"label": "Repositioning", "value": "repositioned to left side"}
- "assisted with toileting" -> {"label": "Toileting", "value": "assisted with toileting"}
- "helped patient with breakfast" -> {"label": "Meal Assist", "value": "assisted with breakfast"}
- "full hygiene care provided" -> {"label": "Hygiene", "value": "full hygiene care provided"}
