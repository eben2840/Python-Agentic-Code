def validate_answers(questionnaire, answers):
    if not answers:
        return {"ok": False, "missing_required": [], "error": "No answers submitted"}
    items = item_map(questionnaire)
    missing = sorted(required_missing(items, answers))
    return {
        "ok": not missing,
        "missing_required": missing,
    }


def item_map(questionnaire):
    return {item["linkId"]: item for item in walk_items(questionnaire.get("item", [])) if item.get("linkId")}


def walk_items(items):
    walked = []
    for item in items:
        walked.append(item)
        walked.extend(walk_items(item.get("item", [])))
    return walked


def required_missing(items, answers):
    return [
        link_id for link_id, item in items.items()
        if item.get("required") is True and not item.get("item") and link_id not in answers
    ]


