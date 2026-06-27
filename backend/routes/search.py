import logging

from flask import Blueprint, current_app, jsonify, request

logger = logging.getLogger(__name__)

search_bp = Blueprint("search", __name__)

MAX_LIMIT = 20
DEFAULT_LIMIT = 5


@search_bp.get("/search")
def search():
    engine = current_app.config.get("SEARCH_ENGINE")
    if engine is None:
        return jsonify({"error": "Search engine is not available. Check server logs."}), 503

    query = request.args.get("q", "").strip()
    if not query:
        return jsonify({"error": "Query param 'q' is required"}), 400

    try:
        limit = int(request.args.get("limit", DEFAULT_LIMIT))
    except ValueError:
        return jsonify({"error": "'limit' must be an integer"}), 400
    limit = max(1, min(limit, MAX_LIMIT))

    system = request.args.get("system") or None

    results = engine.search(query, top_n=limit, system_filter=system)

    for plant in results:
        if plant["is_risky"]:
            plant["safe_alternative"] = engine.find_alternative(plant)
        else:
            plant["safe_alternative"] = None

    return jsonify({
        "query": query,
        "system_filter": system,
        "results": results,
        "total": len(results),
        "endangered_count": sum(1 for r in results if r["is_risky"]),
    })
