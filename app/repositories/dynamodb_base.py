from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any, Generic, TypeVar

from boto3.dynamodb.conditions import Attr
from botocore.exceptions import BotoCoreError, ClientError
from pydantic import BaseModel

from app.core.exceptions import (
    RepositoryConflictException,
    RepositoryException,
    RepositoryNotFoundException,
)
from app.repositories.interfaces import RepositoryInterface
from app.utils.dynamodb import DynamoDBClient

TEntity = TypeVar("TEntity", bound=BaseModel)


class DynamoDBRepository(RepositoryInterface[TEntity], Generic[TEntity]):
    """Generic DynamoDB repository with CRUD primitives for single and composite key tables."""

    def __init__(
        self,
        dynamodb_client: DynamoDBClient,
        model_class: type[TEntity],
        table_name: str,
        id_field: str = "id",
        sort_key_field: str | None = None,
        sort_key_value: str = "METADATA",
    ) -> None:
        self.dynamodb_client = dynamodb_client
        self.model_class = model_class
        self.table = dynamodb_client.get_table(table_name)
        self.id_field = id_field
        self.sort_key_field = sort_key_field
        self.sort_key_value = sort_key_value

    def _get_key(self, entity_id: str) -> dict[str, Any]:
        key = {self.id_field: entity_id}
        if self.sort_key_field:
            key[self.sort_key_field] = self.sort_key_value
        return key

    def create(self, entity: TEntity) -> TEntity:
        item = self._serialize(entity)
        entity_id = getattr(entity, "id", None) or item.get(self.id_field) or item.get("id")
        item[self.id_field] = entity_id
        item["id"] = entity_id
        if self.sort_key_field:
            item[self.sort_key_field] = self.sort_key_value

        try:
            self.table.put_item(
                Item=item,
                ConditionExpression=f"attribute_not_exists({self.id_field})",
            )
        except self._client_errors as exc:
            if self._is_conditional_check_failure(exc):
                raise RepositoryConflictException(
                    f"{self.model_class.__name__} with id '{entity_id}' already exists",
                ) from exc
            raise self._wrap_exception("create", entity_id, exc) from exc

        return entity

    def get(self, entity_id: str) -> TEntity:
        try:
            response = self.table.get_item(Key=self._get_key(entity_id))
        except self._client_errors as exc:
            raise self._wrap_exception("get", entity_id, exc) from exc

        item = response.get("Item")
        if item is None:
            raise RepositoryNotFoundException(
                f"{self.model_class.__name__} with id '{entity_id}' was not found",
            )

        return self._deserialize(item)

    def list(self) -> list[TEntity]:
        return self._scan_items()

    def list_by_attribute(self, attribute_name: str, attribute_value: Any) -> list[TEntity]:
        return self._scan_items(
            filter_expression=Attr(attribute_name).eq(attribute_value),
        )

    def _scan_items(self, filter_expression: Any | None = None) -> list[TEntity]:
        items: list[dict[str, Any]] = []

        try:
            scan_kwargs: dict[str, Any] = {}
            if filter_expression is not None:
                scan_kwargs["FilterExpression"] = filter_expression

            response = self.table.scan(**scan_kwargs)
            items.extend(response.get("Items", []))

            while "LastEvaluatedKey" in response:
                response = self.table.scan(
                    ExclusiveStartKey=response["LastEvaluatedKey"],
                    **scan_kwargs,
                )
                items.extend(response.get("Items", []))
        except self._client_errors as exc:
            raise self._wrap_exception("list", None, exc) from exc

        return [self._deserialize(item) for item in items]

    def update(self, entity_id: str, entity: TEntity) -> TEntity:
        existing_entity = self.get(entity_id)
        candidate_entity = entity.model_copy(
            update={
                "id": entity_id,
                "created_at": getattr(existing_entity, "created_at", None),
                "updated_at": datetime.now(UTC),
            },
        )
        item = self._serialize(candidate_entity)
        item[self.id_field] = entity_id
        item["id"] = entity_id
        if self.sort_key_field:
            item[self.sort_key_field] = self.sort_key_value

        try:
            self.table.put_item(
                Item=item,
                ConditionExpression=f"attribute_exists({self.id_field})",
            )
        except self._client_errors as exc:
            if self._is_conditional_check_failure(exc):
                raise RepositoryNotFoundException(
                    f"{self.model_class.__name__} with id '{entity_id}' was not found",
                ) from exc
            raise self._wrap_exception("update", entity_id, exc) from exc

        return candidate_entity

    def delete(self, entity_id: str) -> None:
        try:
            self.table.delete_item(
                Key=self._get_key(entity_id),
                ConditionExpression=f"attribute_exists({self.id_field})",
            )
        except self._client_errors as exc:
            if self._is_conditional_check_failure(exc):
                raise RepositoryNotFoundException(
                    f"{self.model_class.__name__} with id '{entity_id}' was not found",
                ) from exc
            raise self._wrap_exception("delete", entity_id, exc) from exc

    def _serialize(self, entity: TEntity) -> dict[str, Any]:
        return self._to_dynamodb_compatible(entity.model_dump(mode="python"))

    def _deserialize(self, item: dict[str, Any]) -> TEntity:
        # Ensure id is populated from testId or sectionId if missing
        if "id" not in item:
            item["id"] = item.get(self.id_field, "")
        return self.model_class.model_validate(self._from_dynamodb_compatible(item))

    def _to_dynamodb_compatible(self, value: Any) -> Any:
        if isinstance(value, float):
            return Decimal(str(value))
        if isinstance(value, datetime):
            return value.isoformat()
        if isinstance(value, dict):
            return {key: self._to_dynamodb_compatible(item) for key, item in value.items()}
        if isinstance(value, list):
            return [self._to_dynamodb_compatible(item) for item in value]
        return value

    def _from_dynamodb_compatible(self, value: Any) -> Any:
        if isinstance(value, Decimal):
            if value % 1 == 0:
                return int(value)
            return float(value)
        if isinstance(value, dict):
            return {key: self._from_dynamodb_compatible(item) for key, item in value.items()}
        if isinstance(value, list):
            return [self._from_dynamodb_compatible(item) for item in value]
        return value

    @property
    def _client_errors(self) -> tuple[type[BotoCoreError], type[ClientError]]:
        return (BotoCoreError, ClientError)

    def _is_conditional_check_failure(self, exc: Exception) -> bool:
        if not isinstance(exc, ClientError):
            return False
        return exc.response.get("Error", {}).get("Code") == "ConditionalCheckFailedException"

    def _wrap_exception(
        self,
        operation: str,
        entity_id: str | None,
        exc: Exception,
    ) -> RepositoryException:
        identifier = f" '{entity_id}'" if entity_id else ""
        return RepositoryException(
            f"Failed to {operation} {self.model_class.__name__}{identifier}",
            status_code=500,
        )
