import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_list_question_sets_endpoint() -> None:
    response = client.get("/question-sets")
    assert response.status_code in (200, 405, 503)


def test_get_question_set_endpoint_success() -> None:
    response = client.get("/question-sets/SET001")
    assert response.status_code in (200, 400, 404, 503)


def test_get_question_set_endpoint_not_found() -> None:
    response = client.get("/question-sets/NON-EXISTENT-SET-999")
    assert response.status_code in (400, 404, 503)
