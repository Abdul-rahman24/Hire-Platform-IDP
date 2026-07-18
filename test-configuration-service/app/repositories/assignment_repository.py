from __future__ import annotations

from typing import Any

from boto3.dynamodb.conditions import Attr, Key

from app.core.logging import get_logger
from app.models.assignment import AssignmentEntity
from app.repositories.dynamodb_base import DynamoDBRepository
from app.repositories.interfaces import AssignmentRepositoryInterface
from app.utils.dynamodb import DynamoDBClient

logger = get_logger(__name__)


class AssignmentRepository(
    DynamoDBRepository[AssignmentEntity],
    AssignmentRepositoryInterface[AssignmentEntity],
):
    def __init__(self, dynamodb_client: DynamoDBClient) -> None:
        super().__init__(
            dynamodb_client=dynamodb_client,
            model_class=AssignmentEntity,
            table_name="assignments",
            partition_key_name="assignmentId",
        )
        self.student_id_index_name = "GSI1"
        self.test_id_index_name = "GSI2"

    def list_assignments(
        self,
        student_id: str | None = None,
        test_id: str | None = None,
        status: str | None = None,
    ) -> list[AssignmentEntity]:
        if student_id:
            entities = self.list_by_student_id(student_id, status=status)
            if test_id:
                entities = [entity for entity in entities if entity.test_id == test_id]
            return entities
        if test_id:
            entities = self.list_by_test_id(test_id, status=status)
            return entities

        filter_expression = self._build_filter_expression(status=status)
        if filter_expression is None:
            return super().list()
        return self._scan_items(filter_expression=filter_expression)

    def list_by_student_id(
        self,
        student_id: str,
        status: str | None = None,
    ) -> list[AssignmentEntity]:
        logger.info("Listing assignments by student id '%s' using GSI", student_id)
        return self._query_index(
            index_name=self.student_id_index_name,
            partition_key_name="studentId",
            partition_key_value=student_id,
            status=status,
        )

    def list_by_test_id(
        self,
        test_id: str,
        status: str | None = None,
    ) -> list[AssignmentEntity]:
        logger.info("Listing assignments by test id '%s' using GSI", test_id)
        return self._query_index(
            index_name=self.test_id_index_name,
            partition_key_name="testId",
            partition_key_value=test_id,
            status=status,
        )

    def soft_delete(self, assignment_id: str) -> AssignmentEntity:
        entity = self.get(assignment_id)
        cancelled_entity = entity.model_copy(
            update={
                "status": "cancelled",
            },
        )
        return self.update(assignment_id, cancelled_entity)

    def _query_index(
        self,
        index_name: str,
        partition_key_name: str,
        partition_key_value: str,
        status: str | None = None,
    ) -> list[AssignmentEntity]:
        query_kwargs: dict[str, Any] = {
            "IndexName": index_name,
            "KeyConditionExpression": Key(partition_key_name).eq(partition_key_value),
            "ScanIndexForward": True,
        }
        filter_expression = self._build_filter_expression(status=status)
        if filter_expression is not None:
            query_kwargs["FilterExpression"] = filter_expression

        items: list[dict[str, Any]] = []
        try:
            debug_item = {
                "IndexName": index_name,
                "KeyConditionExpression": f"{partition_key_name} = {partition_key_value}",
                "FilterExpression": self._filter_debug(status),
                "ScanIndexForward": True,
            }
            self._log_operation_debug(operation="Query", item=debug_item)
            response = self._call_dynamodb(
                operation="Query",
                call=lambda: self.table.query(**query_kwargs),
                item=debug_item,
            )
            items.extend(response.get("Items", []))
            while "LastEvaluatedKey" in response:
                exclusive_start_key = response["LastEvaluatedKey"]
                self._log_operation_debug(
                    operation="Query",
                    key=exclusive_start_key,
                    item=debug_item,
                )
                response = self._call_dynamodb(
                    operation="Query",
                    call=lambda: self.table.query(
                        ExclusiveStartKey=exclusive_start_key,
                        **query_kwargs,
                    ),
                    key=exclusive_start_key,
                    item=debug_item,
                )
                items.extend(response.get("Items", []))
        except self._client_errors:
            logger.exception("Failed to query %s using %s", self.model_class.__name__, index_name)
            raise

        return [self._deserialize(item) for item in items]

    def _build_filter_expression(self, status: str | None = None):
        filter_expression = Attr("SK").eq(self.sort_key_value)
        if status is not None:
            filter_expression = filter_expression & Attr("status").eq(status)
        return filter_expression

    def _filter_debug(self, status: str | None) -> str:
        if status is None:
            return "SK = META"
        return f"SK = META AND status = {status}"
