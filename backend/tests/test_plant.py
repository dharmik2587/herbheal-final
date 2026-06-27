def test_get_plant_by_id(client):
    resp = client.get("/plant/1")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["plant_id"] == 1
    assert "name" in data
    assert isinstance(data["uses"], list)


def test_get_plant_not_found(client):
    resp = client.get("/plant/99999")
    assert resp.status_code == 404
    assert "error" in resp.get_json()


def test_get_plant_invalid_id_type(client):
    resp = client.get("/plant/notanumber")
    assert resp.status_code == 404  # Flask route converter rejects non-int


def test_risky_plant_includes_alternative(client):
    resp = client.get("/plant/6")  # Indian Snakeroot — Endangered
    data = resp.get_json()
    assert data["is_risky"] is True
    assert data["safe_alternative"] is not None
    assert data["safe_alternative"]["iucn_status"] == "Safe"


def test_safe_plant_alternative_is_none(client):
    resp = client.get("/plant/1")  # Ashwagandha — Safe
    data = resp.get_json()
    assert data["is_risky"] is False
    assert data["safe_alternative"] is None


def test_list_plants(client):
    resp = client.get("/plants")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["total"] > 0
    assert "stats" in data
    assert "traditional_systems" in data["stats"]
