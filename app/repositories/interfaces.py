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


class SectionRepositoryInterface(RepositoryInterface[TEntity], ABC):
    """Repository contract for section entities."""

    @abstractmethod
    def list_by_test_id(self, test_id: str) -> list[TEntity]:
        """List sections belonging to a test."""
