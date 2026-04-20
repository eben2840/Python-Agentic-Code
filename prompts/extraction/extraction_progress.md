Progress reports extraction rules:
 
- Extract type of shift (early, day, late, night).
- Extract the report text and comment.
- Extract if the report is high priority, addendum, handover, doctor info or all of them.
- Return one object per progress report in the progress_reports array.
 
Examples:
- "During my shift at 6am the patient fell down" -> {"report_text": "Patient fell down", "shift": "early", "high_priority": true}
- "The patient does not have any injure or complain from the fall he had this morning" -> {"report_text": "The patient does not have any injure or complain", "shift": "day", "addendum": true}
- "At midday the patient fell confused and disoriented" -> {"report_text": "Patient felt confused and disoriented", "shift": "day"}
 