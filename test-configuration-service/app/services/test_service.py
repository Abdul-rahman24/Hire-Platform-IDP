from __future__ import annotations

from collections import Counter
from datetime import UTC, datetime

from app.core.exceptions import (
    RepositoryConflictException,
    RepositoryNotFoundException,
    ServiceException,
)
from app.core.logging import get_logger
from app.models.published_test import (
    PublishedQuestionSnapshot,
    PublishedSectionSnapshot,
    PublishedTestEntity,
)
from app.models.question import QuestionEntity
from app.models.section import SectionEntity
from app.models.section_question_mapping import SectionQuestionMappingEntity
from app.models.test import TestEntity
from app.repositories.interfaces import (
    PublishedTestRepositoryInterface,
    QuestionRepositoryInterface,
    SectionQuestionMappingRepositoryInterface,
    SectionRepositoryInterface,
    TestRepositoryInterface,
)
from app.schemas.test import (
    CompleteTestResponse,
    CompleteTestSectionResponse,
    FullTestOptionResponse,
    FullTestQuestionResponse,
    FullTestResponse,
    FullTestSectionResponse,
    PublishTestResponse,
    PublishedTestResponse,
    TestCreateRequest,
    TestResponse,
    TestUpdateRequest,
)
from app.services.interfaces import (
    QuestionBankProviderInterface,
    TestServiceInterface,
)

logger = get_logger(__name__)


class TestService(TestServiceInterface):
    def __init__(
        self,
        repository: TestRepositoryInterface[TestEntity],
        section_repository: SectionRepositoryInterface[SectionEntity] | None = None,
        question_repository: QuestionRepositoryInterface[QuestionEntity] | None = None,
        mapping_repository: SectionQuestionMappingRepositoryInterface[
            SectionQuestionMappingEntity
        ]
        | None = None,
        published_test_repository: PublishedTestRepositoryInterface[PublishedTestEntity] | None = None,
        question_bank_provider: QuestionBankProviderInterface | None = None,
    ) -> None:
        self.repository = repository
        self.section_repository = section_repository
        self.question_repository = question_repository
        self.mapping_repository = mapping_repository
        self.published_test_repository = published_test_repository
        self.question_bank_provider = question_bank_provider

    def create_test(self, payload: TestCreateRequest) -> TestResponse:
        logger.info("Creating test with name '%s'", payload.name)
        try:
            entity = TestEntity(**payload.model_dump())
            created_entity = self.repository.create(entity)
            return self._to_response(created_entity)
        except Exception:
            logger.exception("Failed to create TestEntity")
            raise

    def get_test(self, test_id: str) -> TestResponse:
        logger.info("Fetching test '%s'", test_id)
        entity = self.repository.get(test_id)
        return self._to_response(entity)

    def list_tests(self) -> list[TestResponse]:
        logger.info("Listing tests")
        entities = self.repository.list()
        return [self._to_response(entity) for entity in entities]

    def update_test(self, test_id: str, payload: TestUpdateRequest) -> TestResponse:
        logger.info("Updating test '%s'", test_id)
        self._ensure_test_is_mutable(test_id)
        entity = TestEntity(**payload.model_dump())
        updated_entity = self.repository.update(test_id, entity)
        return self._to_response(updated_entity)

    def delete_test(self, test_id: str) -> None:
        logger.info("Deleting test '%s'", test_id)
        self._ensure_test_is_mutable(test_id)
        if self.section_repository is None or self.mapping_repository is None:
            raise ServiceException(
                "Cascade delete dependencies are not configured",
                status_code=500,
            )

        sections = self.section_repository.list_by_test_id(test_id)
        for section in sections:
            try:
                self.mapping_repository.delete_by_section_id(section.id)
            except RepositoryNotFoundException:
                logger.info("No question mapping found for section '%s'", section.id)
            self.section_repository.delete(section.id)

        self.repository.delete(test_id)

    def get_complete_test(self, test_id: str) -> CompleteTestResponse:
        logger.info("Fetching complete test template for test '%s'", test_id)
        if self.section_repository is None or self.mapping_repository is None:
            raise ServiceException(
                "Complete test template dependencies are not configured",
                status_code=500,
            )

        test_entity, sections = self._get_test_with_sections(test_id)
        complete_sections: list[CompleteTestSectionResponse] = []

        for section in sections:
            question_set_id: str | None = None
            question_ids: list[str] = []
            mappings = self.mapping_repository.list_by_section_id(section.id)
            if not mappings:
                logger.info("No question mapping found for section '%s'", section.id)
            else:
                question_ids = [mapping.question_id for mapping in mappings]

            complete_sections.append(
                CompleteTestSectionResponse(
                    sectionId=section.id,
                    sectionName=section.section_name,
                    duration=section.duration,
                    shuffleQuestions=section.shuffle_questions,
                    questionSetId=section.question_set_id or question_set_id,
                    questionIds=question_ids,
                )
            )

        return CompleteTestResponse(
            id=test_entity.id,
            name=test_entity.name,
            description=test_entity.description,
            status=test_entity.status,
            sections=complete_sections,
        )

    def get_full_test(self, test_id: str) -> FullTestResponse:
        logger.info("Fetching full test payload for test '%s'", test_id)
        if self.section_repository is None or self.question_repository is None:
            raise ServiceException(
                "Full test dependencies are not configured",
                status_code=500,
            )

        test_entity, sections = self._get_test_with_sections(test_id)
        full_sections: list[FullTestSectionResponse] = []

        for section in sections:
            if not section.question_set_id:
                raise ServiceException(
                    f"Section '{section.id}' does not reference a question set",
                    status_code=500,
                )
            if self.question_bank_provider is None:
                raise ServiceException(
                    "Question Bank provider is not configured",
                    status_code=500,
                )
            try:
                question_set = self.question_bank_provider.get_question_set(section.question_set_id)
            except RepositoryNotFoundException as exc:
                raise ServiceException(
                    f"Question set '{section.question_set_id}' is not available in the MVP mock",
                    status_code=500,
                ) from exc
            questions = sorted(
                self.question_repository.list_by_question_set_id(section.question_set_id),
                key=lambda entity: entity.id,
            )
            full_sections.append(
                FullTestSectionResponse(
                    sectionId=section.id,
                    sectionName=section.section_name,
                    duration=section.duration,
                    questionSetId=question_set.question_set_id,
                    questionSetName=question_set.name,
                    questions=[
                        self._to_full_question_response(question)
                        for question in questions
                    ],
                )
            )

        return FullTestResponse(
            testId=test_entity.id,
            testName=test_entity.name,
            description=test_entity.description,
            instructions=self._get_test_instructions(test_entity),
            duration=self._get_test_duration(test_entity, sections),
            sections=full_sections,
        )

    def publish_test(self, test_id: str) -> PublishTestResponse:
        logger.info("Validation started for test publish '%s'", test_id)
        snapshot = self.build_snapshot(test_id)
        logger.info("Snapshot generated for test '%s' version '%s'", test_id, snapshot.version)
        if self.published_test_repository is None:
            raise ServiceException(
                "Published test repository is not configured",
                status_code=500,
            )
        stored_snapshot = self.published_test_repository.publish_snapshot(snapshot)
        logger.info("Snapshot stored for test '%s' version '%s'", test_id, snapshot.version)
        logger.info("Status updated for test '%s' to published", test_id)
        return PublishTestResponse(
            testId=stored_snapshot.test_id,
            status="published",
            publishedAt=stored_snapshot.published_at,
        )

    def get_latest_published_test(self, test_id: str) -> PublishedTestResponse:
        if self.published_test_repository is None:
            raise ServiceException(
                "Published test repository is not configured",
                status_code=500,
            )
        snapshot = self.published_test_repository.get_latest(test_id)
        return self._to_published_response(snapshot)

    def get_published_test_version(self, test_id: str, version: int) -> PublishedTestResponse:
        if self.published_test_repository is None:
            raise ServiceException(
                "Published test repository is not configured",
                status_code=500,
            )
        snapshot = self.published_test_repository.get_version(test_id, version)
        return self._to_published_response(snapshot)

    def validate_publish(self, test_id: str) -> tuple[TestEntity, list[SectionEntity], dict[str, QuestionEntity], dict[str, list[SectionQuestionMappingEntity]]]:
        if (
            self.section_repository is None
            or self.question_repository is None
            or self.mapping_repository is None
        ):
            raise ServiceException(
                "Publish dependencies are not configured",
                status_code=500,
            )

        test_entity = self.repository.get(test_id)
        sections = self.section_repository.list_by_test_id(test_id)
        errors: list[str] = []

        if test_entity.status != "draft":
            errors.append(f"Test '{test_id}' must be in draft status to publish")

        if not sections:
            errors.append(f"Test '{test_id}' must contain at least one section")

        duplicate_section_orders = [
            str(order)
            for order, count in Counter(section.display_order for section in sections).items()
            if count > 1
        ]
        if duplicate_section_orders:
            errors.append(
                f"Duplicate section displayOrder values found: {', '.join(sorted(duplicate_section_orders))}",
            )

        question_entities: dict[str, QuestionEntity] = {}
        section_mappings: dict[str, list[SectionQuestionMappingEntity]] = {}

        for section in sections:
            if section.status != "active":
                errors.append(f"Section '{section.id}' must be active to publish")

            mappings = self.mapping_repository.list_by_section_id(section.id)
            section_mappings[section.id] = mappings
            if not mappings:
                errors.append(f"Section '{section.id}' must contain at least one mapped question")
                continue

            duplicate_question_orders = [
                str(order)
                for order, count in Counter(mapping.display_order for mapping in mappings).items()
                if count > 1
            ]
            if duplicate_question_orders:
                errors.append(
                    f"Section '{section.id}' has duplicate question displayOrder values: {', '.join(sorted(duplicate_question_orders))}",
                )

            for mapping in mappings:
                try:
                    question = self.question_repository.get(mapping.question_id)
                except RepositoryNotFoundException:
                    errors.append(
                        f"Mapped question '{mapping.question_id}' for section '{section.id}' does not exist",
                    )
                    continue
                question_entities[mapping.question_id] = question
                if question.status != "active":
                    errors.append(
                        f"Question '{mapping.question_id}' mapped to section '{section.id}' must be active to publish",
                    )

        if errors:
            raise ServiceException(
                "Publish validation failed: " + "; ".join(errors),
                status_code=400,
            )

        logger.info("Validation completed for test publish '%s'", test_id)
        return test_entity, sections, question_entities, section_mappings

    def build_snapshot(self, test_id: str) -> PublishedTestEntity:
        test_entity, sections, question_entities, section_mappings = self.validate_publish(test_id)
        if self.published_test_repository is None:
            raise ServiceException(
                "Published test repository is not configured",
                status_code=500,
            )

        version = self.published_test_repository.get_latest_version_number(test_id) + 1
        published_at = datetime.now(UTC)
        published_sections: list[PublishedSectionSnapshot] = []

        for section in sorted(sections, key=lambda entity: (entity.display_order, entity.id)):
            mappings = sorted(
                section_mappings[section.id],
                key=lambda entity: (entity.display_order, entity.question_id),
            )
            published_questions = [
                PublishedQuestionSnapshot(
                    questionId=mapping.question_id,
                    questionText=question_entities[mapping.question_id].question_text,
                    options=question_entities[mapping.question_id].options,
                    correctAnswer=question_entities[mapping.question_id].correct_answer,
                    marks=mapping.marks,
                    negativeMarks=mapping.negative_marks,
                    displayOrder=mapping.display_order,
                )
                for mapping in mappings
            ]
            published_sections.append(
                PublishedSectionSnapshot(
                    sectionId=section.id,
                    name=section.name,
                    duration=section.duration,
                    displayOrder=section.display_order,
                    questions=published_questions,
                )
            )

        return PublishedTestEntity(
            testId=test_entity.id,
            version=version,
            publishedAt=published_at,
            name=test_entity.name,
            description=test_entity.description,
            status="published",
            sections=published_sections,
        )

    def _ensure_test_is_mutable(self, test_id: str) -> None:
        test = self.repository.get(test_id)
        if test.status == "published":
            raise RepositoryConflictException("Test is already published")

    def _get_test_with_sections(self, test_id: str) -> tuple[TestEntity, list[SectionEntity]]:
        if self.section_repository is None:
            raise ServiceException(
                "Section repository is not configured",
                status_code=500,
            )
        test_entity = self.repository.get(test_id)
        sections = self.section_repository.list_by_test_id(test_id)
        return test_entity, sections

    def _to_full_question_response(
        self,
        question: QuestionEntity,
    ) -> FullTestQuestionResponse:
        options = [
            FullTestOptionResponse(optionId=chr(65 + index), text=option_text)
            for index, option_text in enumerate(question.options or [])
        ]
        return FullTestQuestionResponse(
            questionId=question.id,
            question=question.question_text,
            options=options,
            correctAnswer=question.correct_answer,
            difficulty=question.difficulty,
            marks=question.marks,
        )

    def _get_test_instructions(self, test_entity: TestEntity) -> str:
        instructions = getattr(test_entity, "instructions", "")
        return instructions if isinstance(instructions, str) else ""

    def _get_test_duration(self, test_entity: TestEntity, sections: list[SectionEntity]) -> int:
        duration = getattr(test_entity, "duration", None)
        if isinstance(duration, int):
            return duration
        return sum(section.duration for section in sections)

    def _to_response(self, entity: TestEntity) -> TestResponse:
        return TestResponse.model_validate(entity.model_dump(mode="python"))

    def _to_published_response(self, entity: PublishedTestEntity) -> PublishedTestResponse:
        return PublishedTestResponse.model_validate(entity.model_dump(mode="python"))
