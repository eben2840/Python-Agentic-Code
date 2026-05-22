from __future__ import annotations

from llm_service import ClaudeLLMService


def generate_idea_text(prompt: str, patient_data: dict = None):
    context = patient_context(patient_data)
    return ClaudeLLMService().generate_idea(f"{prompt}\n\n{context}".strip())


def patient_context(patient_data: dict = None):
    if not patient_data:
        return ""
    patient = patient_data.get("patient", {})
    return f"Patient: {patient.get('name', 'Unknown')} | Gender: {patient.get('gender', 'Unknown')} | DOB: {patient.get('birthDate', 'Unknown')}"
