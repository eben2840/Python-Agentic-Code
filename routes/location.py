import os
import logging
import requests
from flask import Blueprint, jsonify

location = Blueprint('location', __name__)
logger = logging.getLogger(__name__)


def fetch_locations():
    base_url = os.getenv("CAREIT_BASE_URL")
    auth = (os.getenv("CAREIT_USERNAME"), os.getenv("CAREIT_PASSWORD"))
    try:
        resp = requests.get(f"{base_url}/Location", auth=auth, timeout=10)
        resp.raise_for_status()
        entries = resp.json().get("entry", [])
    except Exception as e:
        logger.error("Failed to fetch locations from %s/Location: %s", base_url, e)
        return []

    return [
        {"id": e["resource"]["id"], "name": e["resource"]["name"]}
        for e in entries
        if e.get("resource", {}).get("name")
    ]


@location.route("/api/locations", methods=["GET"])
def get_locations():
    return jsonify({"locations": fetch_locations()})
