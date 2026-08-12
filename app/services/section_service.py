from typing import Any
from app.core.exceptions import QuestionSetNotFoundException
from app.core.logging import get_logger
from app.models.section import SectionEntity
from app.models.test import TestEntity
from app.repositories.interfaces import (
    SectionRepositoryInterface,
    TestRepositoryInterface,
)
from app.schemas.section import (
    SectionCreateRequest,
    SectionResponse,
    SectionUpdateRequest,
)
from app.services.interfaces import SectionServiceInterface
from app.utils.question_bank_client import QuestionBankClient

logger = get_logger(__name__)


def _normalize_question_type(raw_type: str | None) -> str:
    if not raw_type or not isinstance(raw_type, str):
        return "MCQ"
    val = raw_type.strip().upper()
    if "COD" in val or "PROGRAM" in val or "ALGO" in val:
        return "CODING"
    return "MCQ"


def _extract_question_type_from_set(qset: Any) -> str:
    if not isinstance(qset, dict):
        return "MCQ"

    # Handle wrapper dicts like {"data": {...}} or {"questionSet": {...}}
    target = qset.get("data", qset.get("questionSet", qset))
    if not isinstance(target, dict):
        target = qset

    # Check top-level type keys on the question set object
    for key in ("questionType", "question_type", "type", "category", "set_type", "questionSetType", "question_set_type"):
        val = target.get(key)
        if val and isinstance(val, str):
            return _normalize_question_type(val)

    # Check questions inside the set
    questions = target.get("questions") or target.get("questionList") or target.get("items") or []
    if isinstance(questions, list) and len(questions) > 0:
        first_q = questions[0]
        if isinstance(first_q, dict):
            for key in ("type", "questionType", "question_type", "category"):
                val = first_q.get(key)
                if val and isinstance(val, str):
                    return _normalize_question_type(val)

    return "MCQ"


class SectionService(SectionServiceInterface):
    def __init__(
        self,
        repository: SectionRepositoryInterface[SectionEntity],
        test_repository: TestRepositoryInterface[TestEntity] | None = None,
        question_bank_client: QuestionBankClient | None = None,
    ) -> None:
        self.repository = repository
        self.test_repository = test_repository
        self.question_bank_client = question_bank_client or QuestionBankClient()

    def create_section(
        self,
        test_id: str,
        payload: SectionCreateRequest,
    ) -> SectionResponse:
        logger.info("Creating section for test '%s' with questionSetId '%s'", test_id, payload.question_set_id)
        if self.test_repository is not None:
            self.test_repository.get(test_id)

        # Validate questionSetId exists in Question Bank Service
        qset = None
        try:
            qset = self.question_bank_client.get_question_set(payload.question_set_id)
        except Exception as e:
            logger.warning("Invalid questionSetId '%s': %s", payload.question_set_id, e)
            if isinstance(e, QuestionSetNotFoundException):
                raise
            raise QuestionSetNotFoundException(f"Invalid Question Set: '{payload.question_set_id}' does not exist.")

        dump = payload.model_dump()
        dump["question_type"] = _extract_question_type_from_set(qset)

        entity = SectionEntity(test_id=test_id, **dump)
        created_entity = self.repository.create(entity)
        return self._to_response(created_entity)

    def get_section(self, section_id: str) -> SectionResponse:
        logger.info("Fetching section '%s'", section_id)
        entity = self.repository.get(section_id)
        return self._to_response(entity)

    def list_sections(self, test_id: str) -> list[SectionResponse]:
        logger.info("Listing sections for test '%s'", test_id)
        entities = self.repository.list_by_test_id(test_id)
        return [self._to_response(entity) for entity in entities]

    def update_section(
        self,
        section_id: str,
        payload: SectionUpdateRequest,
    ) -> SectionResponse:
        logger.info("Updating section '%s'", section_id)
        existing_entity = self.repository.get(section_id)

        new_question_set_id = (
            payload.question_set_id
            if payload.question_set_id is not None
            else existing_entity.question_set_id
        )

        qset = None
        if payload.question_set_id is not None:
            try:
                qset = self.question_bank_client.get_question_set(new_question_set_id)
            except Exception as e:
                logger.warning("Invalid questionSetId '%s' on update: %s", new_question_set_id, e)
                if isinstance(e, QuestionSetNotFoundException):
                    raise
                raise QuestionSetNotFoundException(f"Invalid Question Set: '{new_question_set_id}' does not exist.")

        updated_data = existing_entity.model_dump(mode="python")
        update_dict = payload.model_dump(exclude_unset=True)
        updated_data.update(update_dict)
        updated_data["question_set_id"] = new_question_set_id
        if qset is not None:
            updated_data["question_type"] = _extract_question_type_from_set(qset)

        entity = SectionEntity.model_validate(updated_data)
        updated_entity = self.repository.update(section_id, entity)
        return self._to_response(updated_entity)

    def delete_section(self, section_id: str) -> None:
        logger.info("Deleting section '%s'", section_id)
        self.repository.delete(section_id)

    def _to_response(self, entity: SectionEntity) -> SectionResponse:
        return SectionResponse.model_validate(entity.model_dump(mode="python"))
