from app.core.exceptions import RepositoryConflictException, RepositoryNotFoundException
from app.core.logging import get_logger
from app.models.question import QuestionEntity
from app.models.section import SectionEntity
from app.models.section_question_mapping import SectionQuestionMappingEntity
from app.models.test import TestEntity
from app.repositories.interfaces import (
    QuestionRepositoryInterface,
    SectionQuestionMappingRepositoryInterface,
    SectionRepositoryInterface,
    TestRepositoryInterface,
)
from app.schemas.section_question_mapping import (
    SectionQuestionMappingCreateRequest,
    SectionQuestionMappingResponse,
    SectionQuestionMappingUpdateRequest,
)
from app.services.interfaces import SectionQuestionMappingServiceInterface

logger = get_logger(__name__)


class SectionQuestionMappingService(SectionQuestionMappingServiceInterface):
    def __init__(
        self,
        section_repository: SectionRepositoryInterface[SectionEntity],
        question_repository: QuestionRepositoryInterface[QuestionEntity],
        mapping_repository: SectionQuestionMappingRepositoryInterface[SectionQuestionMappingEntity],
        test_repository: TestRepositoryInterface[TestEntity] | None = None,
    ) -> None:
        self.section_repository = section_repository
        self.question_repository = question_repository
        self.mapping_repository = mapping_repository
        self.test_repository = test_repository

    def create_mapping(
        self,
        section_id: str,
        payload: SectionQuestionMappingCreateRequest,
    ) -> SectionQuestionMappingResponse:
        logger.info(
            "Creating question mapping for section '%s' and question '%s'",
            section_id,
            payload.question_id,
        )
        section = self.section_repository.get(section_id)
        self._ensure_test_is_mutable(section.test_id)
        self.question_repository.get(payload.question_id)

        try:
            self.mapping_repository.get_mapping(section_id, payload.question_id)
        except RepositoryNotFoundException:
            pass
        else:
            raise RepositoryConflictException(
                f"Question '{payload.question_id}' is already mapped to section '{section_id}'",
            )

        entity = SectionQuestionMappingEntity(
            id=f"{section_id}#{payload.question_id}",
            section_id=section_id,
            question_id=payload.question_id,
            display_order=payload.display_order,
            marks=payload.marks,
            negative_marks=payload.negative_marks,
            is_mandatory=payload.is_mandatory,
        )
        created_entity = self.mapping_repository.create(entity)
        return self._to_response(created_entity)

    def list_section_questions(self, section_id: str) -> list[SectionQuestionMappingResponse]:
        logger.info("Listing question mappings for section '%s'", section_id)
        self.section_repository.get(section_id)
        entities = self.mapping_repository.list_by_section_id(section_id)
        return [self._to_response(entity) for entity in entities]

    def get_mapping(
        self,
        section_id: str,
        question_id: str,
    ) -> SectionQuestionMappingResponse:
        logger.info(
            "Fetching question mapping for section '%s' and question '%s'",
            section_id,
            question_id,
        )
        self.section_repository.get(section_id)
        entity = self.mapping_repository.get_mapping(section_id, question_id)
        return self._to_response(entity)

    def update_mapping(
        self,
        section_id: str,
        question_id: str,
        payload: SectionQuestionMappingUpdateRequest,
    ) -> SectionQuestionMappingResponse:
        logger.info(
            "Updating question mapping for section '%s' and question '%s'",
            section_id,
            question_id,
        )
        section = self.section_repository.get(section_id)
        self._ensure_test_is_mutable(section.test_id)
        self.question_repository.get(question_id)
        existing_entity = self.mapping_repository.get_mapping(section_id, question_id)
        update_data = payload.model_dump(exclude_unset=True, by_alias=True)
        merged_data = existing_entity.model_dump(mode="python", by_alias=True)
        merged_data.update(update_data)
        entity = SectionQuestionMappingEntity(**merged_data)
        updated_entity = self.mapping_repository.update_mapping(section_id, question_id, entity)
        return self._to_response(updated_entity)

    def delete_mapping(self, section_id: str, question_id: str) -> None:
        logger.info(
            "Deleting question mapping for section '%s' and question '%s'",
            section_id,
            question_id,
        )
        section = self.section_repository.get(section_id)
        self._ensure_test_is_mutable(section.test_id)
        self.mapping_repository.delete_mapping(section_id, question_id)

    def _to_response(self, entity: SectionQuestionMappingEntity) -> SectionQuestionMappingResponse:
        return SectionQuestionMappingResponse.model_validate(entity.model_dump(mode="python"))

    def _ensure_test_is_mutable(self, test_id: str) -> None:
        if self.test_repository is None:
            return
        test = self.test_repository.get(test_id)
        if test.status == "published":
            raise RepositoryConflictException("Test is already published")
