# -*- coding: utf-8 -*-
"""
Geocode blueprint (proxy to Nominatim or compatible API)
- Exposes: GET /api/geocode/search?q=<address>
- Reads base API URL from env NOMINATIM_API_URL (default: https://nominatim.openstreetmap.org/search)
- Country is fixed to "tw" per your TS usage.
"""

from flask import Blueprint, request, jsonify, current_app
import os
import requests
from config import NOMINATIM_API_URL

geocode_bp = Blueprint("geocode", __name__, url_prefix="/geocode")

# Constants / defaults
REQUEST_TIMEOUT = 6  # seconds

@geocode_bp.route("/search", methods=["GET"])
def search_address():
    """
    Query external geocoding API and return JSON.
    Query params:
      - q: user input (required)
    Returns:
      - 200 with JSON list (possibly empty)
      - 400 if q missing/blank
      - 504/502 for upstream timeout/HTTP error
    """
    q = request.args.get("q", type=str, default="")
    q = q.strip()

    if not q:
        # Guard clause: refuse empty queries
        return jsonify({"error": "Parameter 'q' is required and cannot be empty."}), 400

    api_url = os.getenv("NOMINATIM_API_URL", NOMINATIM_API_URL)

    # Build query string to mirror your TS:
    # ?format=json&countrycodes=tw&addressdetails=1&q=<encoded>
    params = {
        "format": "json",
        "countrycodes": "tw",
        "addressdetails": 1,
        "q": q,
    }

    # Nominatim requires an identifying User-Agent and recommends Referer / email
    headers = {
        # Use your project/app name and a contact; adjust as needed.
        "User-Agent": os.getenv("GEOCODE_USER_AGENT", "YourApp/1.0 (contact@example.com)"),
        "Accept": "application/json",
    }

    try:
        resp = requests.get(api_url, params=params, headers=headers, timeout=REQUEST_TIMEOUT)
    except requests.Timeout:
        # Upstream too slow
        return jsonify({"error": "Upstream geocoding service timed out."}), 504
    except requests.RequestException as e:
        # Network / DNS / SSL etc.
        current_app.logger.exception("Geocoding upstream request failed")
        return jsonify({"error": "Failed to reach geocoding service.", "detail": str(e)}), 502

    if not resp.ok:
        # Bubble up upstream status when reasonable
        return jsonify({"error": "Upstream returned error.", "status": resp.status_code, "body": _safe_text(resp)}), 502

    # Pass-through JSON
    try:
        results = resp.json()
    except ValueError:
        return jsonify({"error": "Invalid JSON from upstream."}), 502

    # Mirror your TS behavior: if empty, return a helpful message (HTTP 404 is optional)
    if isinstance(results, list) and len(results) == 0:
        return jsonify({"message": "找不到該地址，請確認格式或換個關鍵字", "results": []}), 404

    return jsonify(results), 200


def _safe_text(response: requests.Response) -> str:
    """Return a short diagnostic text without risking huge payloads."""
    text = response.text
    if len(text) > 500:
        return text[:500] + "...(truncated)"
    return text
