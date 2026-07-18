from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from time import perf_counter
from typing import Any

from boto3.dynamodb.conditions import Key
from botocore.exceptions import BotoCoreError, ClientError

from app.core.exceptions import RepositoryConflictException, RepositoryNotFoundException
from app.core.logging import get_logger
from app.models.published_test import PublishedTestEntity
from app.repositories.interfaces import PublishedTestRepositoryInterface
from app.utils.dynamodb import DynamoDBClient

logger = get_logger(__name__)


class PublishedTestRepository(PublishedTestRepositoryInterface[PublishedTestEntity]):
    def __init__(self, dynamodb_client: DynamoDBClient) -> None:
        self.dynamodb_client = dynamodb_client
        self.table = dynamodb_client.get_table("published-tests")
        self.partition_key_name = "testId"
        self.sort_key_name = "version"
        self.tests_table_name = dynamodb_client.table_name("tests")

    def create(self, entity: PublishedTestEntity) -> PublishedTestEntity:
        item = self._serialize(entity)
        condition_expression = "attribute_not_exists(version)"
        key = self._key(entity.test_id, entity.version)
        self._log_operation_debug(
            operation="PutItem",
            key=key,
            item=item,
            condition_expression=condition_expression,
        )
        try:
            self._call_dynamodb(
                operation="PutItem",
                call=lambda: self.table.put_item(
                    Item=item,
                    ConditionExpression=condition_expression,
                ),
                key=key,
                item=item,
            )
        except (BotoCoreError, ClientError) as exc:
            if self._is_conditional_check_failure(exc):
                raise RepositoryConflictException(
                    f"PublishedTestEntity version '{entity.version}' already exists for test '{entity.test_id}'",
                ) from exc
            logger.exception("Failed to create PublishedTestEntity")
            raise
        return entity

    def get_latest(self, test_id: str) -> PublishedTestEntity:
        logger.info("Fetching latest published snapshot for test '%s'", test_id)
        query_kwargs = {
            "KeyConditionExpression": Key(self.partition_key_name).eq(test_id),
            "ScanIndexForward": False,
            "Limit": 1,
        }
        self._log_operation_debug(
            operation="Query",
            item={
                "KeyConditionExpression": f"testId = {test_id}",
                "ScanIndexForward": False,
                "Limit": 1,
            },
        )
        response = self._call_dynamodb(
            operation="Query",
            call=lambda: self.table.query(**query_kwargs),
            item={
                "KeyConditionExpression": f"testId = {test_id}",
                "ScanIndexForward": False,
                "Limit": 1,
            },
        )
        items = response.get("Items", [])
        if not items:
            raise RepositoryNotFoundException(
                f"PublishedTestEntity for test '{test_id}' was not found",
            )
        return self._deserialize(items[0])

    def get_version(self, test_id: str, version: int) -> PublishedTestEntity:
        key = self._key(test_id, version)
        self._log_operation_debug(operation="GetItem", key=key)
        response = self._call_dynamodb(
            operation="GetItem",
            call=lambda: self.table.get_item(Key=key),
            key=key,
        )
        item = response.get("Item")
        if item is None:
            raise RepositoryNotFoundException(
                f"PublishedTestEntity version '{version}' for test '{test_id}' was not found",
            )
        return self._deserialize(item)

    def get_latest_version_number(self, test_id: str) -> int:
        try:
            return self.get_latest(test_id).version
        except RepositoryNotFoundException:
            return 0

    def publish_snapshot(self, entity: PublishedTestEntity) -> PublishedTestEntity:
        logger.info(
            "Publishing snapshot transaction for test '%s' version '%s'",
            entity.test_id,
            entity.version,
        )
        item = self._serialize(entity)
        key = self._key(entity.test_id, entity.version)
        updated_at = entity.published_at.isoformat()
        request = {
            "TransactItems": [
                {
                    "Put": {
                        "TableName": self.table.name,
                        "Item": item,
                        "ConditionExpression": "attribute_not_exists(version)",
                    }
                },
                {
                    "Update": {
                        "TableName": self.tests_table_name,
                        "Key": {"testId": entity.test_id, "SK": "META"},
                        "UpdateExpression": "SET #status = :published, updated_at = :updated_at",
                        "ConditionExpression": "attribute_exists(testId) AND #status = :draft",
                        "ExpressionAttributeNames": {
                            "#status": "status",
                        },
                        "ExpressionAttributeValues": {
                            ":published": "published",
                            ":draft": "draft",
                            ":updated_at": updated_at,
                        },
                    }
                },
            ]
        }
        self._log_operation_debug(
            operation="TransactWriteItems",
            key=key,
            item=item,
            condition_expression="snapshot version absent and test status draft",
        )
        try:
            self._call_client(
                operation="TransactWriteItems",
                call=lambda: self.dynamodb_client.resource.meta.client.transact_write_items(**request),
                key=key,
                item=item,
            )
        except (BotoCoreError, ClientError) as exc:
            if self._is_conditional_check_failure(exc):
                raise RepositoryConflictException(
                    f"Failed to publish snapshot for test '{entity.test_id}' because the test is no longer draft or the version already exists",
                ) from exc
            logger.exception("Failed to publish PublishedTestEntity transaction")
            raise
        return entity

    def _key(self, test_id: str, version: int) -> dict[str, Any]:
        return {
            self.partition_key_name: test_id,
            self.sort_key_name: version,
        }

    def _serialize(self, entity: PublishedTestEntity) -> dict[str, Any]:
        data = entity.model_dump(mode="python", by_alias=True)
        return self._to_dynamodb_compatible(data)

    def _deserialize(self, item: dict[str, Any]) -> PublishedTestEntity:
        normalized_item = self._from_dynamodb_compatible(item)
        return PublishedTestEntity.model_validate(normalized_item)

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
            logger.exception(
                "DynamoDB %s failed: table=%s region=%s key=%s item=%s",
                operation,
                self.table.name,
                self.dynamodb_client.region_name,
                key,
                item,
            )
            raise
        logger.info(
            "DynamoDB %s completed successfully in %.2f ms: table=%s region=%s retry_attempts=%s",
            operation,
            (perf_counter() - start) * 1000,
            self.table.name,
            self.dynamodb_client.region_name,
            self._retry_attempts(response),
        )
        return response

    def _call_client(
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
            logger.exception(
                "DynamoDB %s failed: table=%s region=%s key=%s item=%s",
                operation,
                self.table.name,
                self.dynamodb_client.region_name,
                key,
                item,
            )
            raise
        logger.info(
            "DynamoDB %s completed successfully in %.2f ms: table=%s region=%s retry_attempts=%s",
            operation,
            (perf_counter() - start) * 1000,
            self.table.name,
            self.dynamodb_client.region_name,
            self._retry_attempts(response),
        )
        return response

    def _log_operation_debug(
        self,
        operation: str,
        key: dict[str, Any] | None = None,
        item: dict[str, Any] | None = None,
        condition_expression: str | None = None,
    ) -> None:
        logger.debug(
            "Preparing DynamoDB %s: table=%s partition_key_name=%s sort_key_name=%s key=%s item=%s condition_expression=%s",
            operation,
            self.table.name,
            self.partition_key_name,
            self.sort_key_name,
            key,
            item,
            condition_expression,
        )

    def _retry_attempts(self, response: Any) -> Any:
        if not isinstance(response, dict):
            return None
        return response.get("ResponseMetadata", {}).get("RetryAttempts")

    def _is_conditional_check_failure(self, exc: Exception) -> bool:
        if not isinstance(exc, ClientError):
            return False
        return exc.response.get("Error", {}).get("Code") in {
            "ConditionalCheckFailedException",
            "TransactionCanceledException",
        }
