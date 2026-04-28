Progress reports extraction rules:
 
- Extract type of shift (early, day, late, or night) If a time is specified, then infer the type of shift.
- Extract the information as an event.
- Extract if the report is high priority, an addendum, a handover, doctor info or all of them. If nothing is mentioned then analyze the situation to infer it.
- Return one object per progress report in the progress_reports array.
 
Examples:
- "During my shift at 6am the patient fell down" -> {"report_text": "Patient fell down", "shift": "early", "high_priority": true}
- "The patient does not have any injure or complain from the fall he had this morning" -> {"report_text": "The patient does not have any injure or complain", "shift": "day", "addendum": true}
- "At midday the patient fell confused and disoriented" -> {"report_text": "Patient felt confused and disoriented", "shift": "day"}