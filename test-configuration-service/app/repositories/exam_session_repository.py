from __future__ import annotations

from typing import Any

from boto3.dynamodb.conditions import Attr, Key

from app.core.logging import get_logger
from app.models.exam_session import ExamSessionEntity
from app.repositories.dynamodb_base import DynamoDBRepository
from app.repositories.interfaces import ExamSessionRepositoryInterface
from app.utils.dynamodb import DynamoDBClient

logger = get_logger(__name__)


class ExamSessionRepository(
    DynamoDBRepository[ExamSessionEntity],
    ExamSessionRepositoryInterface[ExamSessionEntity],
):
    def __init__(self, dynamodb_client: DynamoDBClient) -> None:
        super().__init__(
            dynamodb_client=dynamodb_client,
            model_class=ExamSessionEntity,
            table_name="exam-sessions",
            partition_key_name="sessionId",
        )
        self.assignment_id_index_name = "GSI1"
        self.student_id_index_name = "GSI2"

    def _serialize(self, entity: ExamSessionEntity) -> dict[str, Any]:
        item = super()._serialize(entity)
        return {key: value for key, value in item.items() if value is not None}

    def list_sessions(
        self,
        student_id: str | None = None,
        assignment_id: str | None = None,
        status: str | None = None,
    ) -> list[ExamSessionEntity]:
        if assignment_id:
            entities = self.list_by_assignment_id(assignment_id, status=status)
            if student_id is not None:
                entities = [entity for entity in entities if entity.student_id == student_id]
            return entities
        if student_id:
            return self.list_by_student_id(student_id, status=status)
        filter_expression = self._build_filter_expression(status=status)
        return self._scan_items(filter_expression=filter_expression)

    def list_by_assignment_id(
        self,
        assignment_id: str,
        status: str | None = None,
    ) -> list[ExamSessionEntity]:
        logger.info("Listing exam sessions by assignment id '%s' using GSI", assignment_id)
        indexed_entities = self._query_index(
            index_name=self.assignment_id_index_name,
            partition_key_name="assignmentId",
            partition_key_value=assignment_id,
            status=status,
        )
        fallback_entities = self._scan_items(
            filter_expression=self._build_filter_expression(status=status)
            & Attr("assignmentId").eq(assignment_id),
        )
        return self._deduplicate(indexed_entities + fallback_entities)

    def list_by_student_id(
        self,
        student_id: str,
        status: str | None = None,
    ) -> list[ExamSessionEntity]:
        logger.info("Listing exam sessions by student id '%s' using GSI", student_id)
        indexed_entities = self._query_index(
            index_name=self.student_id_index_name,
            partition_key_name="studentId",
            partition_key_value=student_id,
            status=status,
        )
        fallback_entities = self._scan_items(
            filter_expression=self._build_filter_expression(status=status)
            & Attr("studentId").eq(student_id),
        )
        return self._deduplicate(indexed_entities + fallback_entities)

    def _query_index(
        self,
        index_name: str,
        partition_key_name: str,
        partition_key_value: str,
        status: str | None = None,
    ) -> list[ExamSessionEntity]:
        query_kwargs: dict[str, Any] = {
            "IndexName": index_name,
            "KeyConditionExpression": Key(partition_key_name).eq(partition_key_value),
            "ScanIndexForward": True,
        }
        filter_expression = self._build_filter_expression(status=status)
        if filter_expression is not None:
            query_kwargs["FilterExpression"] = filter_expression

        items: list[dict[str, Any]] = []
        debug_item = {
            "IndexName": index_name,
            "KeyConditionExpression": f"{partition_key_name} = {partition_key_value}",
            "FilterExpression": self._filter_debug(status),
            "ScanIndexForward": True,
        }
        try:
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

    def _deduplicate(self, entities: list[ExamSessionEntity]) -> list[ExamSessionEntity]:
        deduped: dict[str, ExamSessionEntity] = {entity.id: entity for entity in entities}
        return sorted(
            deduped.values(),
            key=lambda entity: (
                entity.started_at or entity.created_at,
                entity.id,
            ),
        )
