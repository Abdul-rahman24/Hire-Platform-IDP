from abc import ABC, abstractmethod

from app.schemas.question_bank import (
    QuestionResponse,
    QuestionSetResponse,
)
from app.schemas.section import (
    SectionCreateRequest,
    SectionResponse,
    SectionUpdateRequest,
)
from app.schemas.test import (
    TestCreateRequest,
    TestResponse,
    TestUpdateRequest,
)


class TestServiceInterface(ABC):
    @abstractmethod
    def create_test(self, payload: TestCreateRequest) -> TestResponse:
        """Create a new test."""

    @abstractmethod
    def get_test(self, test_id: str) -> TestResponse:
        """Retrieve a test by id."""

    @abstractmethod
    def list_tests(self) -> list[TestResponse]:
        """List all tests."""

    @abstractmethod
    def update_test(self, test_id: str, payload: TestUpdateRequest) -> TestResponse:
        """Update an existing test."""

    @abstractmethod
    def delete_test(self, test_id: str) -> None:
        """Delete a test."""

    @abstractmethod
    def get_complete_test(self, test_id: str) -> TestResponse:
        """Retrieve a complete test template with nested sections."""


class SectionServiceInterface(ABC):
    @abstractmethod
    def create_section(
        self,
        test_id: str,
        payload: SectionCreateRequest,
    ) -> SectionResponse:
        """Create a section for a test."""

    @abstractmethod
    def get_section(self, section_id: str) -> SectionResponse:
        """Retrieve a section by id."""

    @abstractmethod
    def list_sections(self, test_id: str) -> list[SectionResponse]:
        """List all sections belonging to a test."""

    @abstractmethod
    def update_section(
        self,
        section_id: str,
        payload: SectionUpdateRequest,
    ) -> SectionResponse:
        """Update an existing section."""

    @abstractmethod
    def delete_section(self, section_id: str) -> None:
        """Delete a section."""


class QuestionBankServiceInterface(ABC):
    @abstractmethod
    def list_question_sets(self) -> list[QuestionSetResponse]:
        """List available question sets."""

    @abstractmethod
    def list_questions(self, question_set_id: str) -> list[QuestionResponse]:
        """List questions for a given question set."""
