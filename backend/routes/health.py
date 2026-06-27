from flask import Blueprint, current_app, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health():
    engine = current_app.config.get("SEARCH_ENGINE")
    engine_ready = engine is not None

    payload = {
        "status": "ok" if engine_ready else "degraded",
        "search_engine_loaded": engine_ready,
    }

    if engine_ready:
        payload["plant_count"] = len(engine.df)

    status_code = 200 if engine_ready else 503
    return jsonify(payload), status_code
