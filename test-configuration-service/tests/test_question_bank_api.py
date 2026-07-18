from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_list_question_sets_endpoint_returns_mock_set() -> None:
    response = client.get("/question-sets")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["questionSetId"] == "MOCK_SET_001"
    assert body[0]["name"] == "Mock Question Set"


def test_get_question_set_endpoint_returns_mock_set() -> None:
    response = client.get("/question-sets/MOCK_SET_001")

    assert response.status_code == 200
    body = response.json()
    assert body["questionSetId"] == "MOCK_SET_001"
    assert body["description"] == "Temporary mock question set used for testing"
    assert body["status"] == "active"


def test_get_question_set_endpoint_returns_404_for_unknown_id() -> None:
    response = client.get("/question-sets/UNKNOWN_SET")

    assert response.status_code == 404
    assert response.json()["success"] is False


def test_list_questions_by_question_set_endpoint_returns_mock_questions() -> None:
    response = client.get("/question-sets/MOCK_SET_001/questions")

    assert response.status_code == 200
    body = response.json()
    assert [item["questionId"] for item in body] == [
        "Q001",
        "Q002",
        "Q003",
        "Q004",
        "Q005",
    ]
    assert all(item["questionSetId"] == "MOCK_SET_001" for item in body)
