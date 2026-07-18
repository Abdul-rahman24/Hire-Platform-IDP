from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from app.core.exceptions import RepositoryNotFoundException
from app.dependencies.providers import get_test_service
from app.main import app
from app.schemas.test import (
    CompleteTestResponse,
    CompleteTestSectionResponse,
    FullTestOptionResponse,
    FullTestQuestionResponse,
    FullTestResponse,
    FullTestSectionResponse,
    PublishTestResponse,
    PublishedQuestionResponse,
    PublishedSectionResponse,
    PublishedTestResponse,
    TestCreateRequest,
    TestResponse,
    TestUpdateRequest,
)
from app.services.interfaces import TestServiceInterface


class FakeTestService(TestServiceInterface):
    def __init__(self) -> None:
        timestamp = datetime(2026, 7, 16, 0, 0, tzinfo=UTC)
        self.test = TestResponse(
            id="test-1",
            name="Midterm",
            description="Sample test",
            status="draft",
            created_at=timestamp,
            updated_at=timestamp,
        )

    def create_test(self, payload: TestCreateRequest) -> TestResponse:
        return self.test.model_copy(update=payload.model_dump())

    def get_test(self, test_id: str) -> TestResponse:
        if test_id == "missing":
            raise RepositoryNotFoundException("TestEntity not found")
        return self.test.model_copy(update={"id": test_id})

    def list_tests(self) -> list[TestResponse]:
        return [self.test]

    def update_test(self, test_id: str, payload: TestUpdateRequest) -> TestResponse:
        if test_id == "missing":
            raise RepositoryNotFoundException("TestEntity not found")
        return self.test.model_copy(update={"id": test_id, **payload.model_dump()})

    def delete_test(self, test_id: str) -> None:
        if test_id == "missing":
            raise RepositoryNotFoundException("TestEntity not found")
        return None

    def get_complete_test(self, test_id: str) -> CompleteTestResponse:
        return CompleteTestResponse(
            id=test_id,
            name="Midterm",
            description="Sample test",
            status="draft",
            sections=[
                CompleteTestSectionResponse(
                    sectionId="section-1",
                    sectionName="Math",
                    duration=30,
                    shuffleQuestions=True,
                    questionSetId="MOCK_SET_001",
                    questionIds=["Q001", "Q002"],
                )
            ],
        )

    def get_full_test(self, test_id: str) -> FullTestResponse:
        return FullTestResponse(
            testId=test_id,
            testName="Midterm",
            description="Sample test",
            instructions="Read all questions carefully.",
            duration=60,
            sections=[
                FullTestSectionResponse(
                    sectionId="section-1",
                    sectionName="Math",
                    duration=30,
                    questionSetId="MOCK_SET_001",
                    questionSetName="Mock Question Set",
                    questions=[
                        FullTestQuestionResponse(
                            questionId="question-1",
                            question="What is JVM?",
                            options=[
                                FullTestOptionResponse(optionId="A", text="Java Virtual Machine"),
                                FullTestOptionResponse(optionId="B", text="Java Variable Method"),
                            ],
                            correctAnswer="Java Virtual Machine",
                            difficulty="easy",
                            marks=2,
                        )
                    ],
                )
            ],
        )

    def publish_test(self, test_id: str) -> PublishTestResponse:
        timestamp = datetime(2026, 7, 16, 1, 0, tzinfo=UTC)
        return PublishTestResponse(
            testId=test_id,
            status="published",
            publishedAt=timestamp,
        )

    def get_latest_published_test(self, test_id: str) -> PublishedTestResponse:
        return self.get_published_test_version(test_id, 1)

    def get_published_test_version(self, test_id: str, version: int) -> PublishedTestResponse:
        timestamp = datetime(2026, 7, 16, 1, 0, tzinfo=UTC)
        if test_id == "missing":
            raise RepositoryNotFoundException("PublishedTestEntity not found")
        return PublishedTestResponse(
            testId=test_id,
            version=version,
            publishedAt=timestamp,
            name="Midterm",
            description="Sample test",
            status="published",
            sections=[
                PublishedSectionResponse(
                    sectionId="section-1",
                    name="Math",
                    duration=30,
                    displayOrder=1,
                    questions=[
                        PublishedQuestionResponse(
                            questionId="question-1",
                            questionText="What is 2 + 2?",
                            options=["3", "4"],
                            correctAnswer="4",
                            marks=2,
                            negativeMarks=0,
                            displayOrder=1,
                        )
                    ],
                )
            ],
        )


client = TestClient(app)


def override_test_service() -> TestServiceInterface:
    return FakeTestService()


@pytest.fixture(autouse=True)
def set_test_service_override():
    app.dependency_overrides[get_test_service] = override_test_service
    yield
    app.dependency_overrides.pop(get_test_service, None)


def test_create_test_endpoint() -> None:
    response = client.post(
        "/tests",
        json={
            "name": "Midterm",
            "description": "Sample test",
            "status": "draft",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["name"] == "Midterm"
    assert body["status"] == "draft"


def test_list_tests_endpoint() -> None:
    response = client.get("/tests")

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["items"][0]["id"] == "test-1"


def test_get_test_endpoint() -> None:
    response = client.get("/tests/test-1")

    assert response.status_code == 200
    assert response.json()["id"] == "test-1"


def test_get_test_endpoint_returns_404_when_missing() -> None:
    response = client.get("/tests/missing")

    assert response.status_code == 404
    assert response.json()["success"] is False


def test_get_complete_test_endpoint() -> None:
    response = client.get("/tests/test-1/complete")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == "test-1"
    assert body["sections"][0]["sectionId"] == "section-1"
    assert body["sections"][0]["questionSetId"] == "MOCK_SET_001"
    assert body["sections"][0]["questionIds"] == ["Q001", "Q002"]


def test_get_full_test_endpoint() -> None:
    response = client.get("/tests/test-1/full")

    assert response.status_code == 200
    body = response.json()
    assert body["testId"] == "test-1"
    assert body["testName"] == "Midterm"
    assert body["instructions"] == "Read all questions carefully."
    assert body["duration"] == 60
    assert body["sections"][0]["sectionId"] == "section-1"
    assert body["sections"][0]["questionSetId"] == "MOCK_SET_001"
    assert body["sections"][0]["questionSetName"] == "Mock Question Set"
    assert body["sections"][0]["questions"][0]["questionId"] == "question-1"
    assert body["sections"][0]["questions"][0]["options"][0]["optionId"] == "A"


def test_update_test_endpoint() -> None:
    response = client.put(
        "/tests/test-1",
        json={
            "name": "Final Exam",
            "description": "Updated test",
            "status": "published",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == "test-1"
    assert body["name"] == "Final Exam"
    assert body["status"] == "published"


def test_update_test_endpoint_returns_404_when_missing() -> None:
    response = client.put(
        "/tests/missing",
        json={
            "name": "Final Exam",
            "description": "Updated test",
            "status": "published",
        },
    )

    assert response.status_code == 404
    assert response.json()["success"] is False


def test_delete_test_endpoint() -> None:
    response = client.delete("/tests/test-1")

    assert response.status_code == 204
    assert response.content == b""


def test_delete_test_endpoint_returns_404_when_missing() -> None:
    response = client.delete("/tests/missing")

    assert response.status_code == 404
    assert response.json()["success"] is False


def test_create_test_validation_error() -> None:
    response = client.post(
        "/tests",
        json={
            "name": "",
            "description": "Invalid",
            "status": "draft",
        },
    )

    assert response.status_code == 422
