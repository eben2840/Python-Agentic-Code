from datetime import datetime, timezone


def build_questionnaire_response(
    questionnaire,
    answers,
    patient_id,
    encounter_id,
    status="in-progress",
):
    return {
        "resourceType": "QuestionnaireResponse",
        "questionnaire": f"Questionnaire/{questionnaire['id']}",
        "status": status,
        "subject": {"reference": f"Patient/{patient_id}"},
        "encounter": {"reference": f"Encounter/{encounter_id}"},
        "item": response_items(questionnaire.get("item", []), answers),
    }


def response_items(items, answers):
    return [response_item(item, answers) for item in items]


def response_item(item, answers):
    response = {key: item[key] for key in ("linkId", "text") if key in item}
    children = response_items(item.get("item", []), answers)
    answer = answer_block(item, answers)
    if children:
        response["item"] = children
    if answer:
        response["answer"] = answer
    return response


def answer_block(item, answers):
    value = answers.get(item.get("linkId"))
    values = value if isinstance(value, list) else [value]
    return [{"valueString": v} for v in values if v is not None]
