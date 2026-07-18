from datetime import UTC, datetime

from fastapi.testclient import TestClient

from app.core.exceptions import RepositoryNotFoundException
from app.dependencies.providers import get_section_service
from app.main import app
from app.schemas.section import (
    SectionCreateRequest,
    SectionResponse,
    SectionUpdateRequest,
)
from app.services.interfaces import SectionServiceInterface


class FakeSectionService(SectionServiceInterface):
    def __init__(self) -> None:
        timestamp = datetime(2026, 7, 16, 0, 0, tzinfo=UTC)
        self.section = SectionResponse(
            id="section-1",
            testId="test-1",
            questionSetId="MOCK_SET_001",
            name="Math",
            description="Math basics",
            duration=30,
            displayOrder=1,
            status="draft",
            createdAt=timestamp,
            updatedAt=timestamp,
        )

    def create_section(
        self,
        test_id: str,
        payload: SectionCreateRequest,
    ) -> SectionResponse:
        return self.section.model_copy(
            update={"test_id": test_id, **payload.model_dump()},
        )

    def list_sections(self, test_id: str) -> list[SectionResponse]:
        return [self.section.model_copy(update={"test_id": test_id})]

    def get_section(self, section_id: str) -> SectionResponse:
        if section_id == "missing":
            raise RepositoryNotFoundException("SectionEntity not found")
        return self.section.model_copy(update={"id": section_id})

    def update_section(
        self,
        section_id: str,
        payload: SectionUpdateRequest,
    ) -> SectionResponse:
        if section_id == "missing":
            raise RepositoryNotFoundException("SectionEntity not found")
        return self.section.model_copy(
            update={"id": section_id, **payload.model_dump()},
        )

    def delete_section(self, section_id: str) -> None:
        if section_id == "missing":
            raise RepositoryNotFoundException("SectionEntity not found")
        return None


client = TestClient(app)


def override_section_service() -> SectionServiceInterface:
    return FakeSectionService()


app.dependency_overrides[get_section_service] = override_section_service


def test_create_section_endpoint() -> None:
    response = client.post(
        "/tests/test-1/sections",
        json={
            "name": "Math",
            "questionSetId": "MOCK_SET_001",
            "description": "Math basics",
            "duration": 30,
            "displayOrder": 1,
            "status": "draft",
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["testId"] == "test-1"
    assert body["questionSetId"] == "MOCK_SET_001"
    assert body["name"] == "Math"
    assert body["displayOrder"] == 1
    assert body["status"] == "draft"


def test_list_sections_endpoint() -> None:
    response = client.get("/tests/test-1/sections")

    assert response.status_code == 200
    body = response.json()
    assert body["count"] == 1
    assert body["items"][0]["testId"] == "test-1"


def test_get_section_endpoint() -> None:
    response = client.get("/sections/section-1")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == "section-1"
    assert body["name"] == "Math"


def test_get_section_endpoint_returns_404_when_missing() -> None:
    response = client.get("/sections/missing")

    assert response.status_code == 404
    assert response.json()["success"] is False


def test_update_section_endpoint() -> None:
    response = client.put(
        "/sections/section-1",
        json={
            "name": "Updated Math",
            "questionSetId": "MOCK_SET_001",
            "description": "Updated math basics",
            "duration": 45,
            "displayOrder": 2,
            "status": "published",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == "section-1"
    assert body["questionSetId"] == "MOCK_SET_001"
    assert body["name"] == "Updated Math"
    assert body["displayOrder"] == 2
    assert body["status"] == "published"


def test_update_section_endpoint_returns_404_when_missing() -> None:
    response = client.put(
        "/sections/missing",
        json={
            "name": "Updated Math",
            "questionSetId": "MOCK_SET_001",
            "description": "Updated math basics",
            "duration": 45,
            "displayOrder": 2,
            "status": "published",
        },
    )

    assert response.status_code == 404
    assert response.json()["success"] is False


def test_delete_section_endpoint() -> None:
    response = client.delete("/sections/section-1")

    assert response.status_code == 204
    assert response.content == b""


def test_delete_section_endpoint_returns_404_when_missing() -> None:
    response = client.delete("/sections/missing")

    assert response.status_code == 404
    assert response.json()["success"] is False


def test_create_section_validation_error() -> None:
    response = client.post(
        "/tests/test-1/sections",
        json={
            "name": "",
            "questionSetId": "",
            "duration": 0,
            "displayOrder": -1,
            "status": "draft",
        },
    )

    assert response.status_code == 422
