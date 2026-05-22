from .fhir_client import get_json


def fetch_questionnaire(questionnaire_id):
    return get_json(f"Questionnaire/{questionnaire_id}")
