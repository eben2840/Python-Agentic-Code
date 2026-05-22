from .fhir_client import get_bundle_pages


def fetch_active_questionnaire_catalog():
    params = {"status": "active", "_summary": "true"}
    return [record for bundle in get_bundle_pages("Questionnaire", params) for record in catalog_from_bundle(bundle)]


def catalog_from_bundle(bundle):
    records = []
    for entry in bundle.get("entry", []):
        resource = entry.get("resource", {})
        if resource.get("resourceType") == "Questionnaire":
            records.append(catalog_record(resource, entry.get("fullUrl", "")))
    return records


def catalog_record(resource, full_url=""):
    return {
        "id": resource.get("id", ""),
        "url": resource.get("url", ""),
        "version": resource.get("version", ""),
        "name": resource.get("name", ""),
        "title": resource.get("title", ""),
        "status": resource.get("status", ""),
        "fullUrl": full_url,
    }
