from __future__ import annotations

from datetime import UTC, datetime

from boto3.dynamodb.conditions import Key

from app.core.exceptions import RepositoryConflictException, RepositoryNotFoundException
from app.core.logging import get_logger
from app.models.section_question_mapping import SectionQuestionMappingEntity
from app.repositories.dynamodb_base import DynamoDBRepository
from app.repositories.interfaces import SectionQuestionMappingRepositoryInterface
from app.utils.dynamodb import DynamoDBClient

logger = get_logger(__name__)


class SectionQuestionMappingRepository(
    DynamoDBRepository[SectionQuestionMappingEntity],
    SectionQuestionMappingRepositoryInterface[SectionQuestionMappingEntity],
):
    def __init__(self, dynamodb_client: DynamoDBClient) -> None:
        super().__init__(
            dynamodb_client=dynamodb_client,
            model_class=SectionQuestionMappingEntity,
            table_name="section-question-mapping",
            partition_key_name="sectionId",
            entity_id_field="section_id",
            sort_key_name="questionId",
            sort_key_value="",
        )

    def create(self, entity: SectionQuestionMappingEntity) -> SectionQuestionMappingEntity:
        item = self._serialize(entity)
        key = self._mapping_key(entity.section_id, entity.question_id)
        item = {**item, **key}
        condition_expression = "attribute_not_exists(questionId)"

        try:
            self._log_table_metadata_once()
            self._log_operation_debug(
                operation="PutItem",
                key=key,
                item=item,
                condition_expression=condition_expression,
            )
            self._call_dynamodb(
                operation="PutItem",
                call=lambda: self.table.put_item(
                    Item=item,
                    ConditionExpression=condition_expression,
                ),
                key=key,
                item=item,
            )
        except self._client_errors as exc:
            if self._is_conditional_check_failure(exc):
                raise RepositoryConflictException(
                    "SectionQuestionMappingEntity already exists for this section/question pair",
                ) from exc
            logger.exception("Failed to create %s", self.model_class.__name__)
            raise

        return self._deserialize(item)

    def get(self, entity_id: str) -> SectionQuestionMappingEntity:
        section_id, question_id = self._split_mapping_id(entity_id)
        return self.get_mapping(section_id, question_id)

    def list(self) -> list[SectionQuestionMappingEntity]:
        return super().list()

    def update(
        self,
        entity_id: str,
        entity: SectionQuestionMappingEntity,
    ) -> SectionQuestionMappingEntity:
        section_id, question_id = self._split_mapping_id(entity_id)
        return self.update_mapping(section_id, question_id, entity)

    def delete(self, entity_id: str) -> None:
        section_id, question_id = self._split_mapping_id(entity_id)
        self.delete_mapping(section_id, question_id)

    def get_mapping(self, section_id: str, question_id: str) -> SectionQuestionMappingEntity:
        key = self._mapping_key(section_id, question_id)
        try:
            self._log_operation_debug(operation="GetItem", key=key)
            response = self._call_dynamodb(
                operation="GetItem",
                call=lambda: self.table.get_item(Key=key),
                key=key,
            )
        except self._client_errors:
            logger.exception("Failed to get %s", self.model_class.__name__)
            raise

        item = response.get("Item")
        if item is None:
            raise RepositoryNotFoundException(
                f"SectionQuestionMappingEntity with section '{section_id}' and question '{question_id}' was not found",
            )

        return self._deserialize(item)

    def list_by_section_id(self, section_id: str) -> list[SectionQuestionMappingEntity]:
        logger.info("Listing question mappings for section '%s'", section_id)
        query_kwargs = {
            "KeyConditionExpression": Key("sectionId").eq(section_id),
            "ScanIndexForward": True,
        }

        items: list[dict] = []
        try:
            self._log_operation_debug(
                operation="Query",
                item={"sectionId": section_id, "scan_index_forward": True},
            )
            response = self._call_dynamodb(
                operation="Query",
                call=lambda: self.table.query(**query_kwargs),
                item={"KeyConditionExpression": f"sectionId = {section_id}", "ScanIndexForward": True},
            )
            items.extend(response.get("Items", []))

            while "LastEvaluatedKey" in response:
                exclusive_start_key = response["LastEvaluatedKey"]
                self._log_operation_debug(
                    operation="Query",
                    key=exclusive_start_key,
                    item={"sectionId": section_id, "scan_index_forward": True},
                )
                response = self._call_dynamodb(
                    operation="Query",
                    call=lambda: self.table.query(
                        ExclusiveStartKey=exclusive_start_key,
                        **query_kwargs,
                    ),
                    key=exclusive_start_key,
                    item={"KeyConditionExpression": f"sectionId = {section_id}", "ScanIndexForward": True},
                )
                items.extend(response.get("Items", []))
        except self._client_errors:
            logger.exception("Failed to query %s by section id", self.model_class.__name__)
            raise

        entities = [self._deserialize(item) for item in items]
        return sorted(entities, key=lambda entity: (entity.display_order, entity.question_id))

    def update_mapping(
        self,
        section_id: str,
        question_id: str,
        entity: SectionQuestionMappingEntity,
    ) -> SectionQuestionMappingEntity:
        existing_entity = self.get_mapping(section_id, question_id)
        updated_entity = entity.model_copy(
            update={
                "id": self._mapping_id(section_id, question_id),
                "section_id": section_id,
                "question_id": question_id,
                "created_at": existing_entity.created_at,
                "updated_at": datetime.now(UTC),
            },
        )
        item = self._serialize(updated_entity)
        key = self._mapping_key(section_id, question_id)
        item = {**item, **key}
        condition_expression = "attribute_exists(questionId)"

        try:
            self._log_table_metadata_once()
            self._log_operation_debug(
                operation="PutItem",
                key=key,
                item=item,
                condition_expression=condition_expression,
            )
            self._call_dynamodb(
                operation="PutItem",
                call=lambda: self.table.put_item(
                    Item=item,
                    ConditionExpression=condition_expression,
                ),
                key=key,
                item=item,
            )
        except self._client_errors as exc:
            if self._is_conditional_check_failure(exc):
                raise RepositoryNotFoundException(
                    f"SectionQuestionMappingEntity with section '{section_id}' and question '{question_id}' was not found",
                ) from exc
            logger.exception("Failed to update %s", self.model_class.__name__)
            raise

        return self._deserialize(item)

    def delete_mapping(self, section_id: str, question_id: str) -> None:
        key = self._mapping_key(section_id, question_id)
        condition_expression = "attribute_exists(questionId)"

        try:
            self._log_operation_debug(
                operation="DeleteItem",
                key=key,
                condition_expression=condition_expression,
            )
            self._call_dynamodb(
                operation="DeleteItem",
                call=lambda: self.table.delete_item(
                    Key=key,
                    ConditionExpression=condition_expression,
                ),
                key=key,
            )
        except self._client_errors as exc:
            if self._is_conditional_check_failure(exc):
                raise RepositoryNotFoundException(
                    f"SectionQuestionMappingEntity with section '{section_id}' and question '{question_id}' was not found",
                ) from exc
            logger.exception("Failed to delete %s", self.model_class.__name__)
            raise

    def delete_by_section_id(self, section_id: str) -> None:
        mappings = self.list_by_section_id(section_id)
        if not mappings:
            raise RepositoryNotFoundException(
                f"SectionQuestionMappingEntity with section '{section_id}' was not found",
            )
        for mapping in mappings:
            self.delete_mapping(section_id, mapping.question_id)

    def _serialize(self, entity: SectionQuestionMappingEntity) -> dict:
        item = super()._serialize(entity)
        item.pop("sectionId", None)
        item.pop("questionId", None)
        return item

    def _deserialize(self, item: dict) -> SectionQuestionMappingEntity:
        normalized_item = self._from_dynamodb_compatible(item)
        normalized_item["id"] = self._mapping_id(
            normalized_item["sectionId"],
            normalized_item["questionId"],
        )
        return self.model_class.model_validate(normalized_item)

    def _mapping_key(self, section_id: str, question_id: str) -> dict[str, str]:
        return {
            self.partition_key_name: section_id,
            self.sort_key_name: question_id,
        }

    def _mapping_id(self, section_id: str, question_id: str) -> str:
        return f"{section_id}#{question_id}"

    def _split_mapping_id(self, entity_id: str) -> tuple[str, str]:
        try:
            section_id, question_id = entity_id.split("#", 1)
        except ValueError as exc:
            raise RepositoryNotFoundException(
                f"Invalid mapping id '{entity_id}'",
            ) from exc
        return section_id, question_id
