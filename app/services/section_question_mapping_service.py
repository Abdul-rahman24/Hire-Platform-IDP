from app.core.exceptions import RepositoryConflictException, RepositoryNotFoundException
from app.core.logging import get_logger
from app.models.section import SectionEntity
from app.models.section_question_mapping import SectionQuestionMappingEntity
from app.repositories.interfaces import (
    SectionQuestionMappingRepositoryInterface,
    SectionRepositoryInterface,
)
from app.schemas.question_bank import (
    SectionQuestionMappingCreateRequest,
    SectionQuestionMappingResponse,
    SectionQuestionMappingUpdateRequest,
)
from app.services.interfaces import SectionQuestionMappingServiceInterface
from app.utils.question_bank_client import QuestionBankClient

logger = get_logger(__name__)


class SectionQuestionMappingService(SectionQuestionMappingServiceInterface):
    def __init__(
        self,
        section_repository: SectionRepositoryInterface[SectionEntity],
        mapping_repository: SectionQuestionMappingRepositoryInterface[SectionQuestionMappingEntity],
        question_bank_client: QuestionBankClient,
    ) -> None:
        self.section_repository = section_repository
        self.mapping_repository = mapping_repository
        self.question_bank_client = question_bank_client

    def create_mapping(
        self,
        section_id: str,
        payload: SectionQuestionMappingCreateRequest,
    ) -> SectionQuestionMappingResponse:
        logger.info("Creating question mapping for section '%s'", section_id)
        self.section_repository.get(section_id)
        self.question_bank_client.validate_question_ids(
            question_set_id=payload.question_set_id,
            question_ids=payload.question_ids,
        )

        try:
            self.mapping_repository.get_by_section_id(section_id)
        except RepositoryNotFoundException:
            pass
        else:
            raise RepositoryConflictException(
                f"Question mapping already exists for section '{section_id}'",
            )

        entity = SectionQuestionMappingEntity(
            section_id=section_id,
            question_set_id=payload.question_set_id,
            question_ids=payload.question_ids,
        )
        created_entity = self.mapping_repository.create(entity)
        return self._to_response(created_entity)

    def get_mapping(self, section_id: str) -> SectionQuestionMappingResponse:
        logger.info("Fetching question mapping for section '%s'", section_id)
        self.section_repository.get(section_id)
        entity = self.mapping_repository.get_by_section_id(section_id)
        return self._to_response(entity)

    def update_mapping(
        self,
        section_id: str,
        payload: SectionQuestionMappingUpdateRequest,
    ) -> SectionQuestionMappingResponse:
        logger.info("Updating question mapping for section '%s'", section_id)
        self.section_repository.get(section_id)
        existing_entity = self.mapping_repository.get_by_section_id(section_id)
        self.question_bank_client.validate_question_ids(
            question_set_id=payload.question_set_id,
            question_ids=payload.question_ids,
        )
        entity = SectionQuestionMappingEntity(
            section_id=section_id,
            question_set_id=payload.question_set_id,
            question_ids=payload.question_ids,
        )
        updated_entity = self.mapping_repository.update(existing_entity.id, entity)
        return self._to_response(updated_entity)

    def remove_question(
        self,
        section_id: str,
        question_id: str,
    ) -> SectionQuestionMappingResponse:
        logger.info("Removing question '%s' from section '%s'", question_id, section_id)
        self.section_repository.get(section_id)
        existing_entity = self.mapping_repository.get_by_section_id(section_id)
        if question_id not in existing_entity.question_ids:
            raise RepositoryNotFoundException(
                f"Question '{question_id}' was not found in section '{section_id}'",
            )

        entity = SectionQuestionMappingEntity(
            section_id=existing_entity.section_id,
            question_set_id=existing_entity.question_set_id,
            question_ids=[
                existing_question_id
                for existing_question_id in existing_entity.question_ids
                if existing_question_id != question_id
            ],
        )
        updated_entity = self.mapping_repository.update(existing_entity.id, entity)
        return self._to_response(updated_entity)

    def _to_response(
        self,
        entity: SectionQuestionMappingEntity,
    ) -> SectionQuestionMappingResponse:
        return SectionQuestionMappingResponse.model_validate(entity.model_dump(mode="python"))
