from functools import lru_cache

from app.core.config import Settings, get_settings
from app.models.assignment import AssignmentEntity
from app.models.exam_session import ExamSessionEntity
from app.models.published_test import PublishedTestEntity
from app.models.question import QuestionEntity
from app.models.section import SectionEntity
from app.models.section_question_mapping import SectionQuestionMappingEntity
from app.models.test import TestEntity
from app.repositories.interfaces import (
    AssignmentRepositoryInterface,
    ExamSessionRepositoryInterface,
    PublishedTestRepositoryInterface,
    QuestionRepositoryInterface,
    SectionQuestionMappingRepositoryInterface,
    SectionRepositoryInterface,
    TestRepositoryInterface,
)
from app.repositories.assignment_repository import AssignmentRepository
from app.repositories.exam_session_repository import ExamSessionRepository
from app.repositories.published_test_repository import PublishedTestRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.section_question_mapping_repository import (
    SectionQuestionMappingRepository,
)
from app.repositories.section_repository import SectionRepository
from app.repositories.test_repository import TestRepository
from app.services.interfaces import (
    AssignmentServiceInterface,
    ExamSessionServiceInterface,
    QuestionBankProviderInterface,
    QuestionBankServiceInterface,
    QuestionServiceInterface,
    SectionQuestionMappingServiceInterface,
    SectionServiceInterface,
    TestServiceInterface,
)
from app.services.assignment_service import AssignmentService
from app.services.exam_session_service import ExamSessionService
from app.services.question_service import QuestionService
from app.services.question_bank_service import QuestionBankService
from app.services.section_service import SectionService
from app.services.section_question_mapping_service import SectionQuestionMappingService
from app.services.test_service import TestService
from app.utils.dynamodb import DynamoDBClient
from app.utils.question_bank_client import QuestionBankClient


def get_app_settings() -> Settings:
    return get_settings()


def get_dynamodb_client() -> DynamoDBClient:
    settings = get_settings()
    return DynamoDBClient(
        region_name=settings.aws_region,
        endpoint_url=settings.dynamodb_endpoint_url,
        table_prefix=settings.dynamodb_table_prefix,
    )


@lru_cache(maxsize=1)
def get_question_bank_client() -> QuestionBankClient:
    return QuestionBankClient()


def get_question_bank_provider() -> QuestionBankProviderInterface:
    return get_question_bank_client()


def get_test_repository() -> TestRepositoryInterface[TestEntity]:
    return TestRepository(dynamodb_client=get_dynamodb_client())


def get_assignment_repository() -> AssignmentRepositoryInterface[AssignmentEntity]:
    return AssignmentRepository(dynamodb_client=get_dynamodb_client())


def get_exam_session_repository() -> ExamSessionRepositoryInterface[ExamSessionEntity]:
    return ExamSessionRepository(dynamodb_client=get_dynamodb_client())


def get_published_test_repository() -> PublishedTestRepositoryInterface[PublishedTestEntity]:
    return PublishedTestRepository(dynamodb_client=get_dynamodb_client())


def get_question_repository() -> QuestionRepositoryInterface[QuestionEntity]:
    return QuestionRepository(dynamodb_client=get_dynamodb_client())


def get_section_repository() -> SectionRepositoryInterface[SectionEntity]:
    return SectionRepository(dynamodb_client=get_dynamodb_client())


def get_section_question_mapping_repository(
) -> SectionQuestionMappingRepositoryInterface[SectionQuestionMappingEntity]:
    return SectionQuestionMappingRepository(dynamodb_client=get_dynamodb_client())


def get_test_service() -> TestServiceInterface:
    return TestService(
        repository=get_test_repository(),
        section_repository=get_section_repository(),
        question_repository=get_question_repository(),
        mapping_repository=get_section_question_mapping_repository(),
        published_test_repository=get_published_test_repository(),
        question_bank_provider=get_question_bank_provider(),
    )


def get_assignment_service() -> AssignmentServiceInterface:
    return AssignmentService(
        repository=get_assignment_repository(),
        test_repository=get_test_repository(),
        published_test_repository=get_published_test_repository(),
    )


def get_exam_session_service() -> ExamSessionServiceInterface:
    return ExamSessionService(
        repository=get_exam_session_repository(),
        assignment_repository=get_assignment_repository(),
        published_test_repository=get_published_test_repository(),
    )


def get_question_service() -> QuestionServiceInterface:
    return QuestionService(
        repository=get_question_repository(),
        section_repository=get_section_repository(),
        mapping_repository=get_section_question_mapping_repository(),
        test_repository=get_test_repository(),
        question_bank_provider=get_question_bank_provider(),
    )


def get_section_service() -> SectionServiceInterface:
    return SectionService(
        repository=get_section_repository(),
        test_repository=get_test_repository(),
        mapping_repository=get_section_question_mapping_repository(),
        question_bank_provider=get_question_bank_provider(),
    )


def get_question_bank_service() -> QuestionBankServiceInterface:
    return QuestionBankService(provider=get_question_bank_provider())


def get_section_question_mapping_service() -> SectionQuestionMappingServiceInterface:
    return SectionQuestionMappingService(
        section_repository=get_section_repository(),
        question_repository=get_question_repository(),
        mapping_repository=get_section_question_mapping_repository(),
        test_repository=get_test_repository(),
    )
