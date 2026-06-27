"""
Optional enrichment: look up a live IUCN Red List status for a species.

This always degrades gracefully — if IUCN_API_TOKEN is unset, or the
request fails for any reason (network, auth, unknown species), callers
should keep using the CSV's iucn_status and simply skip enrichment.

Note: IUCN's older v3 API (apiv3.iucnredlist.org) has been retired in
favor of the v4 API at api.iucnredlist.org, which uses a different auth
scheme (Authorization header instead of a query-string token) and a
different response shape. Update IUCN_BASE / headers if/when you get a
v4 token.
"""
import logging
import os

import requests

from services.cache_service import TTLCache

logger = logging.getLogger(__name__)

cache = TTLCache()

IUCN_BASE = "https://api.iucnredlist.org/api/v4"
TOKEN = os.environ.get("IUCN_API_TOKEN", "")

STATUS_MAP = {
    "Critically Endangered": "Critically Endangered",
    "Endangered": "Endangered",
    "Vulnerable": "Vulnerable",
    "Near Threatened": "Near Threatened",
    "Least Concern": "Safe",
    "Data Deficient": "Unknown",
    "Extinct": "Extinct",
    "Extinct in the Wild": "Extinct in the Wild",
}


def get_iucn_status(scientific_name: str):
    """
    Returns {status, iucn_id, url} or None.
    Cached for 1 hour. Falls back to None silently on any failure so the
    CSV value is always usable as a baseline.
    """
    if not scientific_name:
        return None

    cache_key = f"iucn:{scientific_name.lower()}"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached

    if not TOKEN:
        return None  # No token configured -> skip silently, use CSV value

    try:
        resp = requests.get(
            f"{IUCN_BASE}/taxa/scientific_name",
            params={"genus_name": scientific_name.split(" ")[0],
                    "species_name": " ".join(scientific_name.split(" ")[1:])},
            headers={"Authorization": TOKEN},
            timeout=5,
        )
        resp.raise_for_status()
        data = resp.json()

        assessments = data.get("assessments") or []
        if not assessments:
            return None

        latest = assessments[0]
        category = latest.get("red_list_category", {}).get("description", {}).get("en", "")
        payload = {
            "status": STATUS_MAP.get(category, "Unknown"),
            "iucn_id": data.get("taxon", {}).get("sis_id"),
            "url": latest.get("url"),
        }
        cache.set(cache_key, payload, ttl_seconds=3600)
        return payload

    except Exception as e:
        logger.warning("IUCN lookup failed for %s: %s", scientific_name, e)
        return None
