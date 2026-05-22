def form_view(questionnaire):
    return {
        "questionnaire": questionnaire_meta(questionnaire),
        "form": {
            "title": questionnaire.get("title") or questionnaire.get("name") or "Questionnaire",
            "sections": form_items(questionnaire.get("item", [])),
        },
    }


def questionnaire_meta(questionnaire):
    return {
        "id": questionnaire.get("id", ""),
        "url": questionnaire.get("url", ""),
        "version": questionnaire.get("version", ""),
        "name": questionnaire.get("name", ""),
        "title": questionnaire.get("title", ""),
        "status": questionnaire.get("status", ""),
    }


def form_items(items):
    return [form_item(item) for item in items]


def form_item(item):
    view = {
        "linkId": item.get("linkId", ""),
        "text": item.get("text", ""),
        "type": item.get("type", ""),
        "required": item.get("required", False),
        "repeats": item.get("repeats", False),
    }
    if item.get("answerOption"):
        view["answerOption"] = item["answerOption"]
    if item.get("enableWhen"):
        view["enableWhen"] = item["enableWhen"]
    if item.get("item"):
        view["item"] = form_items(item["item"])
    return view
