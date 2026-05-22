import os
import logging
import requests

logger = logging.getLogger(__name__)

base_url = os.getenv("CAREIT_BASE_URL")
auth = (os.getenv("CAREIT_USERNAME"), os.getenv("CAREIT_PASSWORD"))

def get_json(endpoint, params=None):
    url = endpoint if endpoint.startswith("http") else f"{base_url}/{endpoint.lstrip('/')}"
    try:
        resp = requests.get(url, params=params, auth=auth, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error("Failed to fetch FHIR data from %s: %s", url, e)
        return {}


def post_json(endpoint, payload):
    url = f"{base_url}/{endpoint.lstrip('/')}"
    try:
        resp = requests.post(url, json=payload, auth=auth, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error("Failed to post FHIR data to %s: %s", url, e)
        return {}


def get_bundle_pages(endpoint, params=None):
    bundles = []
    next_url = f"{base_url}/{endpoint.lstrip('/')}"
    next_params = params or {}
    while next_url:
        bundle = get_json(next_url, next_params)
        if not bundle:
            return bundles
        bundles.append(bundle)
        next_url = next_link(bundle)
        next_params = {}
    return bundles


def next_link(bundle):
    return next(
        (link.get("url", "") for link in bundle.get("link", []) if link.get("relation") == "next"),
        "",
    )
