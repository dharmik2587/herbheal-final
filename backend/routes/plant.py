from flask import Blueprint, current_app, jsonify

from services.iucn_service import get_iucn_status

plant_bp = Blueprint("plant", __name__)


@plant_bp.get("/plant/<int:plant_id>")
def get_plant(plant_id):
    engine = current_app.config.get("SEARCH_ENGINE")
    if engine is None:
        return jsonify({"error": "Search engine is not available. Check server logs."}), 503

    plant = engine.get_by_id(plant_id)
    if plant is None:
        return jsonify({"error": f"No plant found with id {plant_id}"}), 404

    # Best-effort live enrichment; CSV value is always the fallback.
    live_status = get_iucn_status(plant.get("scientific_name", ""))
    if live_status:
        plant["iucn_live"] = live_status

    if plant["is_risky"]:
        plant["safe_alternative"] = engine.find_alternative(plant)
    else:
        plant["safe_alternative"] = None

    return jsonify(plant)


@plant_bp.get("/plants")
def list_plants():
    """Lightweight listing endpoint used by the frontend to populate filters
    and browse all plants without a search query."""
    engine = current_app.config.get("SEARCH_ENGINE")
    if engine is None:
        return jsonify({"error": "Search engine is not available. Check server logs."}), 503

    df = engine.df
    plants = []
    for _, row in df.iterrows():
        plants.append({
            "plant_id": int(row["plant_id"]),
            "name": row["name"],
            "scientific_name": row["scientific_name"],
            "iucn_status": row["iucn_status"],
            "traditional_system": row["traditional_system"],
        })

    return jsonify({"plants": plants, "total": len(plants), "stats": engine.stats()})
