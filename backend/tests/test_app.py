def test_reload_allowed_in_dev(client):
    resp = client.post("/reload")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["status"] == "ok"


def test_404_on_unknown_route(client):
    resp = client.get("/this-route-does-not-exist")
    assert resp.status_code == 404
    assert "error" in resp.get_json()
