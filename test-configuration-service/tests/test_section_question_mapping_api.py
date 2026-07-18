from datetime import UTC, datetime

from fastapi.testclient import TestClient

from app.core.exceptions import RepositoryNotFoundException
from app.dependencies.providers import get_section_question_mapping_service
from app.main import app
from app.schemas.section_question_mapping import (
    SectionQuestionMappingCreateRequest,
    SectionQuestionMappingResponse,
    SectionQuestionMappingUpdateRequest,
)
from app.services.interfaces import SectionQuestionMappingServiceInterface


class FakeSectionQuestionMappingService(SectionQuestionMappingServiceInterface):
    def create_mapping(
        self,
        section_id: str,
        payload: SectionQuestionMappingCreateRequest,
    ) -> SectionQuestionMappingResponse:
        timestamp = datetime(2026, 7, 16, 0, 0, tzinfo=UTC)
        return SectionQuestionMappingResponse(
            sectionId=section_id,
            questionId=payload.question_id,
            displayOrder=payload.display_order,
            marks=payload.marks,
            negativeMarks=payload.negative_marks,
            isMandatory=payload.is_mandatory,
            created_at=timestamp,
            updated_at=timestamp,
        )

    def list_section_questions(self, section_id: str) -> list[SectionQuestionMappingResponse]:
        timestamp = datetime(2026, 7, 16, 0, 0, tzinfo=UTC)
        return [
            SectionQuestionMappingResponse(
                sectionId=section_id,
                questionId="question-1",
                displayOrder=1,
                marks=2,
                negativeMarks=0,
                isMandatory=True,
                created_at=timestamp,
                updated_at=timestamp,
            )
        ]

    def get_mapping(self, section_id: str, question_id: str) -> SectionQuestionMappingResponse:
        if question_id == "missing":
            raise RepositoryNotFoundException("Mapping not found")
        timestamp = datetime(2026, 7, 16, 0, 0, tzinfo=UTC)
        return SectionQuestionMappingResponse(
            sectionId=section_id,
            questionId=question_id,
            displayOrder=1,
            marks=2,
            negativeMarks=0,
            isMandatory=True,
            created_at=timestamp,
            updated_at=timestamp,
        )

    def update_mapping(
        self,
        section_id: str,
        question_id: str,
        payload: SectionQuestionMappingUpdateRequest,
    ) -> SectionQuestionMappingResponse:
        if question_id == "missing":
            raise RepositoryNotFoundException("Mapping not found")
        timestamp = datetime(2026, 7, 16, 0, 0, tzinfo=UTC)
        return SectionQuestionMappingResponse(
            sectionId=section_id,
            questionId=question_id,
            displayOrder=payload.display_order or 1,
            marks=payload.marks or 2,
            negativeMarks=payload.negative_marks or 0,
            isMandatory=payload.is_mandatory if payload.is_mandatory is not None else True,
            created_at=timestamp,
            updated_at=timestamp,
        )

    def delete_mapping(self, section_id: str, question_id: str) -> None:
        if question_id == "missing":
            raise RepositoryNotFoundException("Mapping not found")


client = TestClient(app)


def override_mapping_service() -> SectionQuestionMappingServiceInterface:
    return FakeSectionQuestionMappingService()


app.dependency_overrides[get_section_question_mapping_service] = override_mapping_service


def test_create_section_question_mapping_endpoint() -> None:
    response = client.post(
        "/sections/section-1/questions",
        json={
            "questionId": "question-1",
            "displayOrder": 1,
            "marks": 2,
            "negativeMarks": 0,
            "isMandatory": True,
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["sectionId"] == "section-1"
    assert body["questionId"] == "question-1"


def test_list_section_question_mappings_endpoint() -> None:
    response = client.get("/sections/section-1/questions")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["questionId"] == "question-1"


def test_get_section_question_mapping_endpoint() -> None:
    response = client.get("/sections/section-1/questions/question-1")

    assert response.status_code == 200
    body = response.json()
    assert body["sectionId"] == "section-1"
    assert body["questionId"] == "question-1"


def test_get_section_question_mapping_endpoint_returns_404_when_missing() -> None:
    response = client.get("/sections/section-1/questions/missing")

    assert response.status_code == 404
    assert response.json()["success"] is False


def test_update_section_question_mapping_endpoint() -> None:
    response = client.put(
        "/sections/section-1/questions/question-1",
        json={
            "displayOrder": 3,
            "marks": 5,
            "negativeMarks": 1,
            "isMandatory": False,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["sectionId"] == "section-1"
    assert body["questionId"] == "question-1"
    assert body["displayOrder"] == 3


def test_delete_question_from_section_mapping_endpoint() -> None:
    response = client.delete("/sections/section-1/questions/question-1")

    assert response.status_code == 204
    assert response.content == b""


def test_delete_question_from_section_mapping_endpoint_returns_404_when_missing() -> None:
    response = client.delete("/sections/section-1/questions/missing")

    assert response.status_code == 404
    assert response.json()["success"] is False
