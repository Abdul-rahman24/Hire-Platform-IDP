from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Generic, TypeVar


TEntity = TypeVar("TEntity")


class RepositoryInterface(ABC, Generic[TEntity]):
    @abstractmethod
    def create(self, entity: TEntity) -> TEntity:
        """Create a new entity in the persistence layer."""

    @abstractmethod
    def get(self, entity_id: str) -> TEntity:
        """Fetch a single entity by its identifier."""

    @abstractmethod
    def list(self) -> list[TEntity]:
        """Return entities from the persistence layer."""

    @abstractmethod
    def update(self, entity_id: str, entity: TEntity) -> TEntity:
        """Update an existing entity."""

    @abstractmethod
    def delete(self, entity_id: str) -> None:
        """Delete an existing entity."""


class TestRepositoryInterface(RepositoryInterface[TEntity], ABC):
    """Repository contract for test entities."""


class PublishedTestRepositoryInterface(ABC, Generic[TEntity]):
    """Repository contract for published test snapshots."""

    @abstractmethod
    def create(self, entity: TEntity) -> TEntity:
        """Create a new published snapshot."""

    @abstractmethod
    def get_latest(self, test_id: str) -> TEntity:
        """Fetch the latest published snapshot for a test."""

    @abstractmethod
    def get_version(self, test_id: str, version: int) -> TEntity:
        """Fetch a specific published snapshot version."""

    @abstractmethod
    def get_latest_version_number(self, test_id: str) -> int:
        """Return the latest published version number for a test."""

    @abstractmethod
    def publish_snapshot(self, entity: TEntity) -> TEntity:
        """Store a published snapshot and update the test status atomically."""


class QuestionRepositoryInterface(RepositoryInterface[TEntity], ABC):
    """Repository contract for question entities."""

    @abstractmethod
    def list_by_question_set_id(self, question_set_id: str) -> list[TEntity]:
        """List questions belonging to a question set."""


class SectionRepositoryInterface(RepositoryInterface[TEntity], ABC):
    """Repository contract for section entities."""

    @abstractmethod
    def list_by_test_id(self, test_id: str) -> list[TEntity]:
        """List sections belonging to a test."""


class SectionQuestionMappingRepositoryInterface(RepositoryInterface[TEntity], ABC):
    """Repository contract for section-question mapping entities."""

    @abstractmethod
    def get_mapping(self, section_id: str, question_id: str) -> TEntity:
        """Fetch a single question mapping."""

    @abstractmethod
    def delete_by_section_id(self, section_id: str) -> None:
        """Delete all question mappings for a section."""

    @abstractmethod
    def list_by_section_id(self, section_id: str) -> list[TEntity]:
        """List question mappings for a section."""

    @abstractmethod
    def update_mapping(self, section_id: str, question_id: str, entity: TEntity) -> TEntity:
        """Update a single question mapping."""

    @abstractmethod
    def delete_mapping(self, section_id: str, question_id: str) -> None:
        """Delete a single question mapping."""


class AssignmentRepositoryInterface(RepositoryInterface[TEntity], ABC):
    """Repository contract for assignment entities."""

    @abstractmethod
    def list_assignments(
        self,
        student_id: str | None = None,
        test_id: str | None = None,
        status: str | None = None,
    ) -> list[TEntity]:
        """List assignments with optional filters."""

    @abstractmethod
    def list_by_student_id(
        self,
        student_id: str,
        status: str | None = None,
    ) -> list[TEntity]:
        """List assignments for a student."""

    @abstractmethod
    def list_by_test_id(
        self,
        test_id: str,
        status: str | None = None,
    ) -> list[TEntity]:
        """List assignments for a test."""

    @abstractmethod
    def soft_delete(self, assignment_id: str) -> TEntity:
        """Soft delete an assignment."""


class ExamSessionRepositoryInterface(RepositoryInterface[TEntity], ABC):
    """Repository contract for exam session entities."""

    @abstractmethod
    def list_sessions(
        self,
        student_id: str | None = None,
        assignment_id: str | None = None,
        status: str | None = None,
    ) -> list[TEntity]:
        """List exam sessions with optional filters."""

    @abstractmethod
    def list_by_assignment_id(
        self,
        assignment_id: str,
        status: str | None = None,
    ) -> list[TEntity]:
        """List exam sessions for an assignment."""

    @abstractmethod
    def list_by_student_id(
        self,
        student_id: str,
        status: str | None = None,
    ) -> list[TEntity]:
        """List exam sessions for a student."""
