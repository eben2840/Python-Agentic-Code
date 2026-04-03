import os
import requests
from flask import Blueprint, jsonify

organization = Blueprint('organization', __name__)

BASE_URL = os.getenv("CAREIT_BASE_URL")
AUTH = (os.getenv("CAREIT_USERNAME"), os.getenv("CAREIT_PASSWORD"))


def fetch_departments():
    resp = requests.get(f"{BASE_URL}/Organization", params={"type": "dept"}, auth=AUTH, timeout=10)
    resp.raise_for_status()
    data = resp.json()
    entries = data.get("entry", [])
    return [e["resource"]["name"] for e in entries if e.get("resource", {}).get("name")]


@organization.route("/api/departments", methods=["GET"])
def get_departments():
    departments = fetch_departments()
    return jsonify({"departments": departments})
