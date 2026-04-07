import os
import requests
from flask import Blueprint, jsonify

organization = Blueprint('organization', __name__)


def fetch_departments():
    base_url = os.getenv("CAREIT_BASE_URL")
    auth = (os.getenv("CAREIT_USERNAME"), os.getenv("CAREIT_PASSWORD"))
    resp = requests.get(f"{base_url}/Organization", params={"type": "dept"}, auth=auth, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    entries = data.get("entry", [])
    return [
        {"id": e["resource"]["id"], "name": e["resource"]["name"]}
        for e in entries
        if e.get("resource", {}).get("name")
    ]


@organization.route("/api/departments", methods=["GET"])
def get_departments():
    departments = fetch_departments()
    return jsonify({"departments": departments})
