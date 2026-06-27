def test_search_requires_query(client):
    resp = client.get("/search")
    assert resp.status_code == 400
    assert "error" in resp.get_json()


def test_search_basic_query(client):
    resp = client.get("/search?q=anxiety")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["query"] == "anxiety"
    assert data["total"] > 0
    assert all("similarity_score" in r for r in data["results"])
    # Results should be ranked descending by similarity
    scores = [r["similarity_score"] for r in data["results"]]
    assert scores == sorted(scores, reverse=True)


def test_search_respects_limit(client):
    resp = client.get("/search?q=digestion&limit=2")
    data = resp.get_json()
    assert data["total"] <= 2


def test_search_limit_is_capped(client):
    resp = client.get("/search?q=digestion&limit=999")
    data = resp.get_json()
    assert data["total"] <= 20  # MAX_LIMIT


def test_search_invalid_limit(client):
    resp = client.get("/search?q=digestion&limit=notanumber")
    assert resp.status_code == 400


def test_search_system_filter(client):
    resp = client.get("/search?q=stress&system=Ayurveda")
    data = resp.get_json()
    for r in data["results"]:
        assert r["traditional_system"] == "Ayurveda"


def test_search_no_match_returns_empty(client):
    resp = client.get("/search?q=zzzznonsensequery123")
    data = resp.get_json()
    assert data["total"] == 0
    assert data["results"] == []


def test_risky_plant_has_safe_alternative_field(client):
    resp = client.get("/search?q=hypertension+anxiety&limit=10")
    data = resp.get_json()
    risky = [r for r in data["results"] if r["is_risky"]]
    for plant in risky:
        assert "safe_alternative" in plant
