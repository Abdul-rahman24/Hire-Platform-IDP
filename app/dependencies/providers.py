from functools import lru_cache

from app.core.config import Settings, get_settings
from app.models.section import SectionEntity
from app.models.test import TestEntity
from app.repositories.interfaces import (
    SectionRepositoryInterface,
    TestRepositoryInterface,
)
from app.repositories.section_repository import SectionRepository
from app.repositories.test_repository import TestRepository
from app.services.interfaces import (
    QuestionBankServiceInterface,
    SectionServiceInterface,
    TestServiceInterface,
)
from app.services.question_bank_service import QuestionBankService
from app.services.section_service import SectionService
from app.services.test_service import TestService
from app.utils.dynamodb import DynamoDBClient
from app.utils.question_bank_client import QuestionBankClient


def get_app_settings() -> Settings:
    return get_settings()


@lru_cache
def get_dynamodb_client() -> DynamoDBClient:
    settings = get_settings()
    return DynamoDBClient(
        region_name=settings.aws_region,
        endpoint_url=settings.dynamodb_endpoint_url,
        table_prefix=settings.dynamodb_table_prefix,
    )


@lru_cache
def get_question_bank_client() -> QuestionBankClient:
    return QuestionBankClient()


@lru_cache
def get_test_repository() -> TestRepositoryInterface[TestEntity]:
    return TestRepository(dynamodb_client=get_dynamodb_client())


@lru_cache
def get_section_repository() -> SectionRepositoryInterface[SectionEntity]:
    return SectionRepository(dynamodb_client=get_dynamodb_client())


@lru_cache
def get_test_service() -> TestServiceInterface:
    return TestService(
        repository=get_test_repository(),
        section_repository=get_section_repository(),
        question_bank_client=get_question_bank_client(),
    )


@lru_cache
def get_section_service() -> SectionServiceInterface:
    return SectionService(
        repository=get_section_repository(),
        test_repository=get_test_repository(),
        question_bank_client=get_question_bank_client(),
    )


@lru_cache
def get_question_bank_service() -> QuestionBankServiceInterface:
    return QuestionBankService(client=get_question_bank_client())
