import os
import requests
from flask import Blueprint, jsonify

location = Blueprint('location', __name__)

BASE_URL = os.getenv("CAREIT_BASE_URL")
AUTH = (os.getenv("CAREIT_USERNAME"), os.getenv("CAREIT_PASSWORD"))


def fetch_locations():
    resp = requests.get(f"{BASE_URL}/Location", auth=AUTH, timeout=10)
    resp.raise_for_status()
    entries = resp.json().get("entry", [])
    return [e["resource"]["name"] for e in entries if e.get("resource", {}).get("name")]


@location.route("/api/locations", methods=["GET"])
def get_locations():
    return jsonify({"locations": fetch_locations()})
