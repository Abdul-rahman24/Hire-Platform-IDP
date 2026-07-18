from app.core.exceptions import (
    RepositoryConflictException,
    RepositoryNotFoundException,
    ServiceException,
)
from app.core.logging import get_logger
from app.models.section import SectionEntity
from app.models.section_question_mapping import SectionQuestionMappingEntity
from app.models.test import TestEntity
from app.repositories.interfaces import (
    SectionQuestionMappingRepositoryInterface,
    SectionRepositoryInterface,
    TestRepositoryInterface,
)
from app.schemas.section import (
    SectionCreateRequest,
    SectionResponse,
    SectionUpdateRequest,
)
from app.services.interfaces import (
    QuestionBankProviderInterface,
    SectionServiceInterface,
)

logger = get_logger(__name__)


class SectionService(SectionServiceInterface):
    def __init__(
        self,
        repository: SectionRepositoryInterface[SectionEntity],
        test_repository: TestRepositoryInterface[TestEntity] | None = None,
        mapping_repository: SectionQuestionMappingRepositoryInterface[
            SectionQuestionMappingEntity
        ]
        | None = None,
        question_bank_provider: QuestionBankProviderInterface | None = None,
    ) -> None:
        self.repository = repository
        self.test_repository = test_repository
        self.mapping_repository = mapping_repository
        self.question_bank_provider = question_bank_provider

    def create_section(
        self,
        test_id: str,
        payload: SectionCreateRequest,
    ) -> SectionResponse:
        logger.info("Creating section for test '%s'", test_id)
        if self.test_repository is not None:
            self._ensure_test_is_mutable(test_id)
        self._ensure_question_set_exists(payload.question_set_id)
        entity = SectionEntity(test_id=test_id, **payload.model_dump())
        created_entity = self.repository.create(entity)
        return self._to_response(created_entity)

    def list_sections(self, test_id: str) -> list[SectionResponse]:
        logger.info("Listing sections for test '%s'", test_id)
        entities = self.repository.list_by_test_id(test_id)
        return [self._to_response(entity) for entity in entities]

    def get_section(self, section_id: str) -> SectionResponse:
        logger.info("Fetching section '%s'", section_id)
        entity = self.repository.get(section_id)
        return self._to_response(entity)

    def update_section(
        self,
        section_id: str,
        payload: SectionUpdateRequest,
    ) -> SectionResponse:
        logger.info("Updating section '%s'", section_id)
        existing_entity = self.repository.get(section_id)
        if self.test_repository is not None:
            self._ensure_test_is_mutable(existing_entity.test_id)
        self._ensure_question_set_exists(payload.question_set_id)
        entity = SectionEntity(
            test_id=existing_entity.test_id,
            **payload.model_dump(),
        )
        updated_entity = self.repository.update(section_id, entity)
        return self._to_response(updated_entity)

    def delete_section(self, section_id: str) -> None:
        logger.info("Deleting section '%s'", section_id)
        existing_entity = self.repository.get(section_id)
        if self.test_repository is not None:
            self._ensure_test_is_mutable(existing_entity.test_id)
        if self.mapping_repository is not None:
            try:
                self.mapping_repository.delete_by_section_id(section_id)
            except RepositoryNotFoundException:
                logger.info("No question mapping found for section '%s'", section_id)
        self.repository.delete(section_id)

    def _ensure_test_is_mutable(self, test_id: str) -> None:
        if self.test_repository is None:
            return
        test = self.test_repository.get(test_id)
        if test.status == "published":
            raise RepositoryConflictException("Test is already published")

    def _to_response(self, entity: SectionEntity) -> SectionResponse:
        return SectionResponse.model_validate(entity.model_dump(mode="python"))

    def _ensure_question_set_exists(self, question_set_id: str) -> None:
        if self.question_bank_provider is None:
            return
        try:
            self.question_bank_provider.get_question_set(question_set_id)
        except RepositoryNotFoundException as exc:
            raise ServiceException(
                f"Unknown questionSetId '{question_set_id}'",
                status_code=400,
            ) from exc
