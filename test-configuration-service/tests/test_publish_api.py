from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from app.core.exceptions import RepositoryNotFoundException, ServiceException
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


class FakePublishApiTestService(TestServiceInterface):
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
                            question="What is 2 + 2?",
                            options=[
                                FullTestOptionResponse(optionId="A", text="3"),
                                FullTestOptionResponse(optionId="B", text="4"),
                            ],
                            correctAnswer="4",
                            difficulty="easy",
                            marks=2,
                        )
                    ],
                )
            ],
        )

    def publish_test(self, test_id: str) -> PublishTestResponse:
        if test_id == "invalid":
            raise ServiceException("Publish validation failed: missing section", status_code=400)
        return PublishTestResponse(
            testId=test_id,
            status="published",
            publishedAt=datetime(2026, 7, 16, 1, 0, tzinfo=UTC),
        )

    def get_latest_published_test(self, test_id: str) -> PublishedTestResponse:
        if test_id == "missing":
            raise RepositoryNotFoundException("Published snapshot not found")
        return self.get_published_test_version(test_id, 2)

    def get_published_test_version(self, test_id: str, version: int) -> PublishedTestResponse:
        if test_id == "missing":
            raise RepositoryNotFoundException("Published snapshot not found")
        return PublishedTestResponse(
            testId=test_id,
            version=version,
            publishedAt=datetime(2026, 7, 16, 1, 0, tzinfo=UTC),
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
    return FakePublishApiTestService()


@pytest.fixture(autouse=True)
def set_test_service_override():
    app.dependency_overrides[get_test_service] = override_test_service
    yield
    app.dependency_overrides.pop(get_test_service, None)


def test_publish_test_endpoint() -> None:
    response = client.post("/tests/test-1/publish")

    assert response.status_code == 200
    body = response.json()
    assert body["testId"] == "test-1"
    assert body["status"] == "published"


def test_publish_test_endpoint_returns_400_on_validation_failure() -> None:
    response = client.post("/tests/invalid/publish")

    assert response.status_code == 400
    assert response.json()["success"] is False


def test_get_latest_published_test_endpoint() -> None:
    response = client.get("/tests/test-1/published")

    assert response.status_code == 200
    body = response.json()
    assert body["testId"] == "test-1"
    assert body["version"] == 2


def test_get_published_test_version_endpoint() -> None:
    response = client.get("/tests/test-1/published/3")

    assert response.status_code == 200
    body = response.json()
    assert body["version"] == 3
    assert body["sections"][0]["questions"][0]["questionId"] == "question-1"


def test_get_published_test_endpoint_returns_404_when_missing() -> None:
    response = client.get("/tests/missing/published")

    assert response.status_code == 404
    assert response.json()["success"] is False
