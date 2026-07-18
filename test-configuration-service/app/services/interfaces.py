from abc import ABC, abstractmethod

from app.schemas.question_bank import QuestionResponse, QuestionSetResponse
from app.schemas.assignment import (
    AssignmentCreateRequest,
    AssignmentResponse,
    AssignmentUpdateRequest,
    BulkAssignmentCreateRequest,
    BulkAssignmentResponse,
)
from app.schemas.exam_session import (
    ExamSessionCreateRequest,
    ExamSessionHeartbeatRequest,
    ExamSessionResponse,
)
from app.schemas.question import (
    QuestionCreateRequest,
    QuestionResponse as ManagedQuestionResponse,
    QuestionUpdateRequest,
)
from app.schemas.section_question_mapping import (
    SectionQuestionMappingCreateRequest,
    SectionQuestionMappingResponse,
    SectionQuestionMappingUpdateRequest,
)
from app.schemas.section import (
    SectionCreateRequest,
    SectionResponse,
    SectionUpdateRequest,
)
from app.schemas.test import (
    CompleteTestResponse,
    FullTestResponse,
    PublishTestResponse,
    PublishedTestResponse,
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
    def get_complete_test(self, test_id: str) -> CompleteTestResponse:
        """Retrieve a complete test template with nested sections."""

    @abstractmethod
    def get_full_test(self, test_id: str) -> FullTestResponse:
        """Retrieve the student-facing full test payload."""

    @abstractmethod
    def publish_test(self, test_id: str) -> PublishTestResponse:
        """Publish a test and create an immutable snapshot."""

    @abstractmethod
    def get_latest_published_test(self, test_id: str) -> PublishedTestResponse:
        """Retrieve the latest published snapshot."""

    @abstractmethod
    def get_published_test_version(self, test_id: str, version: int) -> PublishedTestResponse:
        """Retrieve a specific published snapshot version."""


class QuestionServiceInterface(ABC):
    @abstractmethod
    def create_question(self, payload: QuestionCreateRequest) -> ManagedQuestionResponse:
        """Create a new question."""

    @abstractmethod
    def get_question(self, question_id: str) -> ManagedQuestionResponse:
        """Retrieve a question by id."""

    @abstractmethod
    def list_questions(self) -> list[ManagedQuestionResponse]:
        """List all questions."""

    @abstractmethod
    def get_questions_by_question_set(
        self,
        question_set_id: str,
    ) -> list[ManagedQuestionResponse]:
        """List questions for a specific question set."""

    @abstractmethod
    def update_question(
        self,
        question_id: str,
        payload: QuestionUpdateRequest,
    ) -> ManagedQuestionResponse:
        """Update an existing question."""

    @abstractmethod
    def delete_question(self, question_id: str) -> None:
        """Delete a question."""


class SectionServiceInterface(ABC):
    @abstractmethod
    def create_section(
        self,
        test_id: str,
        payload: SectionCreateRequest,
    ) -> SectionResponse:
        """Create a section for a test."""

    @abstractmethod
    def list_sections(self, test_id: str) -> list[SectionResponse]:
        """List all sections belonging to a test."""

    @abstractmethod
    def get_section(self, section_id: str) -> SectionResponse:
        """Retrieve a section by id."""

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
    def get_question_set(self, question_set_id: str) -> QuestionSetResponse:
        """Retrieve a single question set."""

    @abstractmethod
    def list_questions(self, question_set_id: str) -> list[QuestionResponse]:
        """List questions for a given question set."""


class QuestionBankProviderInterface(ABC):
    @abstractmethod
    def list_question_sets(self) -> list[QuestionSetResponse]:
        """List available question sets from the provider."""

    @abstractmethod
    def get_question_set(self, question_set_id: str) -> QuestionSetResponse:
        """Retrieve a single question set from the provider."""

    @abstractmethod
    def list_questions(self, question_set_id: str) -> list[QuestionResponse]:
        """List questions for a given question set from the provider."""


class SectionQuestionMappingServiceInterface(ABC):
    @abstractmethod
    def create_mapping(
        self,
        section_id: str,
        payload: SectionQuestionMappingCreateRequest,
    ) -> SectionQuestionMappingResponse:
        """Create a question mapping."""

    @abstractmethod
    def list_section_questions(self, section_id: str) -> list[SectionQuestionMappingResponse]:
        """List question mappings for a section."""

    @abstractmethod
    def get_mapping(
        self,
        section_id: str,
        question_id: str,
    ) -> SectionQuestionMappingResponse:
        """Get a question mapping."""

    @abstractmethod
    def update_mapping(
        self,
        section_id: str,
        question_id: str,
        payload: SectionQuestionMappingUpdateRequest,
    ) -> SectionQuestionMappingResponse:
        """Update a question mapping."""

    @abstractmethod
    def delete_mapping(self, section_id: str, question_id: str) -> None:
        """Delete a question mapping."""


class AssignmentServiceInterface(ABC):
    @abstractmethod
    def create_assignment(self, payload: AssignmentCreateRequest) -> AssignmentResponse:
        """Create a single assignment."""

    @abstractmethod
    def create_bulk_assignments(
        self,
        payload: BulkAssignmentCreateRequest,
    ) -> BulkAssignmentResponse:
        """Create assignments in bulk."""

    @abstractmethod
    def list_assignments(
        self,
        student_id: str | None = None,
        test_id: str | None = None,
        status: str | None = None,
    ) -> list[AssignmentResponse]:
        """List assignments with optional filters."""

    @abstractmethod
    def get_assignment(self, assignment_id: str) -> AssignmentResponse:
        """Retrieve an assignment by id."""

    @abstractmethod
    def update_assignment(
        self,
        assignment_id: str,
        payload: AssignmentUpdateRequest,
    ) -> AssignmentResponse:
        """Update an assignment."""

    @abstractmethod
    def delete_assignment(self, assignment_id: str) -> None:
        """Soft delete an assignment."""


class ExamSessionServiceInterface(ABC):
    @abstractmethod
    def create_session(self, payload: ExamSessionCreateRequest) -> ExamSessionResponse:
        """Create an exam session."""

    @abstractmethod
    def list_sessions(
        self,
        student_id: str | None = None,
        assignment_id: str | None = None,
        status: str | None = None,
    ) -> list[ExamSessionResponse]:
        """List exam sessions with optional filters."""

    @abstractmethod
    def get_session(self, session_id: str) -> ExamSessionResponse:
        """Get a single exam session."""

    @abstractmethod
    def start_session(self, session_id: str) -> ExamSessionResponse:
        """Start an exam session."""

    @abstractmethod
    def submit_session(self, session_id: str) -> ExamSessionResponse:
        """Submit an exam session."""

    @abstractmethod
    def heartbeat(
        self,
        session_id: str,
        payload: ExamSessionHeartbeatRequest,
    ) -> ExamSessionResponse:
        """Send a session heartbeat."""
