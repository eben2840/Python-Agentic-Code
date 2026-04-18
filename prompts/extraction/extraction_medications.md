Medication extraction rules:

- Extract medication entries only when a medicine name or clearly identifiable medication reference is present.
- For each medication, capture:
  - name
  - dose
  - route
  - status
- Normalize status to one of:
  - given
  - refused
  - held
- Keep medication names and doses faithful to the transcript.
- If route is not stated, omit it rather than inventing it.
- If status is not clearly stated, omit it rather than guessing.
- Return one object per medication in the medications array.

Examples:
- "paracetamol 500 mg given" -> {"name": "Paracetamol", "dose": "500mg", "status": "given"}
- "insulin held" -> {"name": "Insulin", "status": "held"}
- "metoprolol 25 mg by mouth given" -> {"name": "Metoprolol", "dose": "25mg", "route": "oral", "status": "given"}
