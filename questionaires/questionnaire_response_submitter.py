from .fhir_client import post_json


def post_questionnaire_response(questionnaire_response):
    return post_json("QuestionnaireResponse", questionnaire_response)
