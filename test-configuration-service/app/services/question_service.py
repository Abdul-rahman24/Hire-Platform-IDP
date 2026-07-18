from app.core.exceptions import (
    RepositoryConflictException,
    RepositoryNotFoundException,
    ServiceException,
)
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
from app.schemas.question import (
    QuestionCreateRequest,
    QuestionResponse,
    QuestionUpdateRequest,
)
from app.services.interfaces import (
    QuestionBankProviderInterface,
    QuestionServiceInterface,
)

logger = get_logger(__name__)


class QuestionService(QuestionServiceInterface):
    def __init__(
        self,
        repository: QuestionRepositoryInterface[QuestionEntity],
        section_repository: SectionRepositoryInterface[SectionEntity] | None = None,
        mapping_repository: SectionQuestionMappingRepositoryInterface[SectionQuestionMappingEntity] | None = None,
        test_repository: TestRepositoryInterface[TestEntity] | None = None,
        question_bank_provider: QuestionBankProviderInterface | None = None,
    ) -> None:
        self.repository = repository
        self.section_repository = section_repository
        self.mapping_repository = mapping_repository
        self.test_repository = test_repository
        self.question_bank_provider = question_bank_provider

    def create_question(self, payload: QuestionCreateRequest) -> QuestionResponse:
        logger.info("Creating question in category '%s'", payload.category)
        self._ensure_question_set_exists(payload.question_set_id)
        entity = QuestionEntity(**payload.model_dump())
        created_entity = self.repository.create(entity)
        return self._to_response(created_entity)

    def get_question(self, question_id: str) -> QuestionResponse:
        logger.info("Fetching question '%s'", question_id)
        entity = self.repository.get(question_id)
        return self._to_response(entity)

    def list_questions(self) -> list[QuestionResponse]:
        logger.info("Listing questions")
        entities = self.repository.list()
        return [self._to_response(entity) for entity in entities]

    def get_questions_by_question_set(self, question_set_id: str) -> list[QuestionResponse]:
        logger.info("Listing questions for question set '%s'", question_set_id)
        entities = self.repository.list_by_question_set_id(question_set_id)
        return [self._to_response(entity) for entity in entities]

    def update_question(
        self,
        question_id: str,
        payload: QuestionUpdateRequest,
    ) -> QuestionResponse:
        logger.info("Updating question '%s'", question_id)
        self._ensure_question_is_mutable(question_id)
        existing_entity = self.repository.get(question_id)
        update_data = payload.model_dump(exclude_unset=True, by_alias=True)
        effective_question_set_id = update_data.get("questionSetId", existing_entity.question_set_id)
        if effective_question_set_id is not None:
            self._ensure_question_set_exists(effective_question_set_id)
        merged_data = existing_entity.model_dump(mode="python", by_alias=True)
        merged_data.update(update_data)
        entity = QuestionEntity(**merged_data)
        updated_entity = self.repository.update(question_id, entity)
        return self._to_response(updated_entity)

    def delete_question(self, question_id: str) -> None:
        logger.info("Deleting question '%s'", question_id)
        self._ensure_question_is_mutable(question_id)
        self.repository.delete(question_id)

    def _to_response(self, entity: QuestionEntity) -> QuestionResponse:
        return QuestionResponse.model_validate(entity.model_dump(mode="python"))

    def _ensure_question_is_mutable(self, question_id: str) -> None:
        if (
            self.mapping_repository is None
            or self.section_repository is None
            or self.test_repository is None
        ):
            return

        for mapping in self.mapping_repository.list():
            if mapping.question_id != question_id:
                continue
            section = self.section_repository.get(mapping.section_id)
            test = self.test_repository.get(section.test_id)
            if test.status == "published":
                raise RepositoryConflictException("Test is already published")

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
