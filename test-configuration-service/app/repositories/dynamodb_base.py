from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from time import perf_counter
from typing import Any, Generic, TypeVar

from boto3.dynamodb.conditions import Attr
from botocore.exceptions import BotoCoreError, ClientError
from pydantic import BaseModel

from app.core.exceptions import RepositoryConflictException, RepositoryNotFoundException
from app.core.logging import get_logger
from app.repositories.interfaces import RepositoryInterface
from app.utils.dynamodb import DynamoDBClient

TEntity = TypeVar("TEntity", bound=BaseModel)
logger = get_logger(__name__)


class DynamoDBRepository(RepositoryInterface[TEntity], Generic[TEntity]):
    """Generic DynamoDB repository with CRUD primitives for composite-key tables."""
    # DynamoDB table sort key marker: SK="META"

    def __init__(
        self,
        dynamodb_client: DynamoDBClient,
        model_class: type[TEntity],
        table_name: str,
        partition_key_name: str,
        entity_id_field: str = "id",
        sort_key_name: str = "SK",
        sort_key_value: str = "META",
    ) -> None:
        self.dynamodb_client = dynamodb_client
        self.model_class = model_class
        self.table = dynamodb_client.get_table(table_name)
        self.partition_key_name = partition_key_name
        self.entity_id_field = entity_id_field
        self.sort_key_name = sort_key_name
        self.sort_key_value = sort_key_value
        self._table_metadata_logged = False
        logger.info(
            "Repository initialized: model=%s table=%s region=%s partition_key=%s "
            "sort_key=%s sort_key_value=%s entity_id_field=%s",
            self.model_class.__name__,
            self.table.name,
            self.dynamodb_client.region_name,
            self.partition_key_name,
            self.sort_key_name,
            self.sort_key_value,
            self.entity_id_field,
        )

    def create(self, entity: TEntity) -> TEntity:
        logger.info("Entering create(): model=%s", self.model_class.__name__)
        entity_id = getattr(entity, self.entity_id_field)
        item = self._serialize(entity)
        item = self._with_table_keys(item, entity_id)
        condition_expression = f"attribute_not_exists({self.partition_key_name})"

        try:
            self._log_table_metadata_once()
            self._log_put_item_debug(
                item=item,
                entity_id=entity_id,
                condition_expression=condition_expression,
            )
            self._call_dynamodb(
                operation="PutItem",
                call=lambda: self.table.put_item(
                    Item=item,
                    ConditionExpression=condition_expression,
                ),
                key=self._key(entity_id),
                item=item,
            )
        except self._client_errors as exc:
            if self._is_conditional_check_failure(exc):
                raise RepositoryConflictException(
                    f"{self.model_class.__name__} with id '{entity_id}' already exists",
                ) from exc
            logger.exception("Failed to create %s", self.model_class.__name__)
            raise

        return entity

    def get(self, entity_id: str) -> TEntity:
        logger.info("Entering get(): model=%s id=%s", self.model_class.__name__, entity_id)
        key = self._key(entity_id)
        try:
            self._log_operation_debug(
                operation="GetItem",
                key=key,
            )
            response = self._call_dynamodb(
                operation="GetItem",
                call=lambda: self.table.get_item(Key=key),
                key=key,
            )
        except self._client_errors as exc:
            logger.exception("Failed to get %s", self.model_class.__name__)
            raise

        item = response.get("Item")
        if item is None:
            raise RepositoryNotFoundException(
                f"{self.model_class.__name__} with id '{entity_id}' was not found",
            )

        return self._deserialize(item)

    def list(self) -> list[TEntity]:
        logger.info("Entering list(): model=%s", self.model_class.__name__)
        return self._scan_items()

    def list_by_attribute(self, attribute_name: str, attribute_value: Any) -> list[TEntity]:
        logger.info(
            "Entering list_by_attribute(): model=%s attribute=%s value=%s",
            self.model_class.__name__,
            attribute_name,
            attribute_value,
        )
        return self._scan_items(
            filter_expression=Attr(attribute_name).eq(attribute_value),
        )

    def _scan_items(self, filter_expression: Any | None = None) -> list[TEntity]:
        items: list[dict[str, Any]] = []

        try:
            scan_kwargs: dict[str, Any] = {}
            if filter_expression is not None:
                scan_kwargs["FilterExpression"] = filter_expression

            self._log_operation_debug(
                operation="Scan",
                item=scan_kwargs,
            )
            response = self._call_dynamodb(
                operation="Scan",
                call=lambda: self.table.scan(**scan_kwargs),
                item=scan_kwargs,
            )
            items.extend(response.get("Items", []))

            while "LastEvaluatedKey" in response:
                exclusive_start_key = response["LastEvaluatedKey"]
                self._log_operation_debug(
                    operation="Scan",
                    key=exclusive_start_key,
                    item=scan_kwargs,
                )
                response = self._call_dynamodb(
                    operation="Scan",
                    call=lambda: self.table.scan(
                        ExclusiveStartKey=exclusive_start_key,
                        **scan_kwargs,
                    ),
                    key=exclusive_start_key,
                    item=scan_kwargs,
                )
                items.extend(response.get("Items", []))
        except self._client_errors as exc:
            logger.exception("Failed to list %s", self.model_class.__name__)
            raise

        return [self._deserialize(item) for item in items]

    def update(self, entity_id: str, entity: TEntity) -> TEntity:
        logger.info("Entering update(): model=%s id=%s", self.model_class.__name__, entity_id)
        existing_entity = self.get(entity_id)
        candidate_entity = entity.model_copy(
            update={
                self.entity_id_field: entity_id,
                "created_at": getattr(existing_entity, "created_at", None),
                "updated_at": datetime.now(UTC),
            },
        )
        item = self._serialize(candidate_entity)
        item = self._with_table_keys(item, entity_id)
        condition_expression = f"attribute_exists({self.partition_key_name})"

        try:
            self._log_table_metadata_once()
            self._log_put_item_debug(
                item=item,
                entity_id=entity_id,
                condition_expression=condition_expression,
            )
            self._call_dynamodb(
                operation="PutItem",
                call=lambda: self.table.put_item(
                    Item=item,
                    ConditionExpression=condition_expression,
                ),
                key=self._key(entity_id),
                item=item,
            )
        except self._client_errors as exc:
            if self._is_conditional_check_failure(exc):
                raise RepositoryNotFoundException(
                    f"{self.model_class.__name__} with id '{entity_id}' was not found",
                ) from exc
            logger.exception("Failed to update %s", self.model_class.__name__)
            raise

        return candidate_entity

    def delete(self, entity_id: str) -> None:
        logger.info("Entering delete(): model=%s id=%s", self.model_class.__name__, entity_id)
        key = self._key(entity_id)
        try:
            self._log_operation_debug(
                operation="DeleteItem",
                key=key,
                condition_expression=f"attribute_exists({self.partition_key_name})",
            )
            self._call_dynamodb(
                operation="DeleteItem",
                call=lambda: self.table.delete_item(
                    Key=key,
                    ConditionExpression=f"attribute_exists({self.partition_key_name})",
                ),
                key=key,
            )
        except self._client_errors as exc:
            if self._is_conditional_check_failure(exc):
                raise RepositoryNotFoundException(
                    f"{self.model_class.__name__} with id '{entity_id}' was not found",
                ) from exc
            logger.exception("Failed to delete %s", self.model_class.__name__)
            raise

    def _serialize(self, entity: TEntity) -> dict[str, Any]:
        item = self._to_dynamodb_compatible(entity.model_dump(mode="python", by_alias=True))
        if self.entity_id_field != self.partition_key_name:
            item.pop("id", None)
        return item

    def _deserialize(self, item: dict[str, Any]) -> TEntity:
        normalized_item = self._from_dynamodb_compatible(item)
        if "id" not in normalized_item and self.partition_key_name in normalized_item:
            normalized_item["id"] = normalized_item[self.partition_key_name]
        return self.model_class.model_validate(normalized_item)

    def _key(self, entity_id: str) -> dict[str, Any]:
        return {
            self.partition_key_name: entity_id,
            self.sort_key_name: self.sort_key_value,
        }

    def _with_table_keys(self, item: dict[str, Any], entity_id: str) -> dict[str, Any]:
        return {
            **item,
            self.partition_key_name: entity_id,
            self.sort_key_name: self.sort_key_value,
        }

    def _log_put_item_debug(
        self,
        item: dict[str, Any],
        entity_id: str,
        condition_expression: str,
    ) -> None:
        logger.debug(
            "Preparing DynamoDB PutItem: table=%s partition_key_name=%s "
            "partition_key_value=%s sort_key_name=%s sort_key_value=%s item=%s "
            "condition_expression=%s",
            self.table.name,
            self.partition_key_name,
            entity_id,
            self.sort_key_name,
            self.sort_key_value,
            item,
            condition_expression,
        )

    def _log_operation_debug(
        self,
        operation: str,
        key: dict[str, Any] | None = None,
        item: dict[str, Any] | None = None,
        condition_expression: str | None = None,
    ) -> None:
        logger.debug(
            "Preparing DynamoDB %s: table=%s partition_key_name=%s "
            "sort_key_name=%s sort_key_value=%s key=%s item=%s "
            "condition_expression=%s",
            operation,
            self.table.name,
            self.partition_key_name,
            self.sort_key_name,
            self.sort_key_value,
            key,
            item,
            condition_expression,
        )

    def _log_table_metadata_once(self) -> None:
        if self._table_metadata_logged:
            return

        logger.info(
            "Loading DynamoDB table metadata before write: table=%s region=%s",
            self.table.name,
            self.dynamodb_client.region_name,
        )
        response = self._call_dynamodb(
            operation="DescribeTable",
            call=self.table.load,
        )
        logger.info(
            "DynamoDB table metadata loaded: table=%s status=%s key_schema=%s "
            "attribute_definitions=%s load_response=%s",
            self.table.name,
            self.table.table_status,
            self.table.key_schema,
            self.table.attribute_definitions,
            response,
        )
        self._table_metadata_logged = True

    def _call_dynamodb(
        self,
        operation: str,
        call,
        key: dict[str, Any] | None = None,
        item: dict[str, Any] | None = None,
    ) -> Any:
        start = perf_counter()
        logger.info(
            "Calling DynamoDB %s: table=%s region=%s key=%s item=%s",
            operation,
            self.table.name,
            self.dynamodb_client.region_name,
            key,
            item,
        )
        try:
            response = call()
        except Exception:
            duration_ms = (perf_counter() - start) * 1000
            logger.exception(
                "DynamoDB %s failed after %.2f ms: table=%s region=%s key=%s item=%s",
                operation,
                duration_ms,
                self.table.name,
                self.dynamodb_client.region_name,
                key,
                item,
            )
            raise

        duration_ms = (perf_counter() - start) * 1000
        retry_attempts = self._retry_attempts(response)
        logger.info(
            "DynamoDB %s completed successfully in %.2f ms: table=%s "
            "region=%s retry_attempts=%s",
            operation,
            duration_ms,
            self.table.name,
            self.dynamodb_client.region_name,
            retry_attempts,
        )
        if duration_ms > 5000:
            logger.warning(
                "DynamoDB %s exceeded 5 seconds: duration_ms=%.2f table=%s region=%s",
                operation,
                duration_ms,
                self.table.name,
                self.dynamodb_client.region_name,
            )
        return response

    def _retry_attempts(self, response: Any) -> Any:
        if not isinstance(response, dict):
            return None
        return response.get("ResponseMetadata", {}).get("RetryAttempts")

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
