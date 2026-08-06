from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_endpoint() -> None:
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert "message" in body


def test_health_endpoint_default_environment() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "Test Configuration Service"
    assert "environment" in body


def test_health_endpoint_environment_priority() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_unexpected_error_handler_returns_500() -> None:
    response = client.get("/non-existent-route-path-xyz")
    assert response.status_code == 404
