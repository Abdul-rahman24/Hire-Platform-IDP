from boto3.dynamodb.conditions import Attr, Key

from app.core.logging import get_logger
from app.models.section import SectionEntity
from app.repositories.dynamodb_base import DynamoDBRepository
from app.repositories.interfaces import SectionRepositoryInterface
from app.utils.dynamodb import DynamoDBClient

logger = get_logger(__name__)


class SectionRepository(
    DynamoDBRepository[SectionEntity],
    SectionRepositoryInterface[SectionEntity],
):
    def __init__(self, dynamodb_client: DynamoDBClient) -> None:
        super().__init__(
            dynamodb_client=dynamodb_client,
            model_class=SectionEntity,
            table_name="sections",
            partition_key_name="sectionId",
        )
        self.test_id_index_name = "GSI1"

    def _serialize(self, entity: SectionEntity) -> dict:
        item = super()._serialize(entity)
        if "displayOrder" in item and item["displayOrder"] is not None:
            item["displayOrder"] = str(item["displayOrder"])
        return item

    def _deserialize(self, item: dict) -> SectionEntity:
        normalized_item = self._from_dynamodb_compatible(item)
        if "displayOrder" in normalized_item and normalized_item["displayOrder"] is not None:
            normalized_item["displayOrder"] = int(normalized_item["displayOrder"])
        if "id" not in normalized_item and self.partition_key_name in normalized_item:
            normalized_item["id"] = normalized_item[self.partition_key_name]
        return self.model_class.model_validate(normalized_item)

    def list_by_test_id(self, test_id: str) -> list[SectionEntity]:
        logger.info("Listing sections by test id '%s' using GSI", test_id)
        query_kwargs = {
            "IndexName": self.test_id_index_name,
            "KeyConditionExpression": Key("testId").eq(test_id),
            "FilterExpression": Attr("SK").eq(self.sort_key_value),
            "ScanIndexForward": True,
        }

        try:
            self._log_operation_debug(
                operation="Query",
                item={
                    "index_name": self.test_id_index_name,
                    "testId": test_id,
                    "scan_index_forward": True,
                },
            )
            response = self._call_dynamodb(
                operation="Query",
                call=lambda: self.table.query(**query_kwargs),
                item={
                    "IndexName": self.test_id_index_name,
                    "KeyConditionExpression": f"testId = {test_id}",
                    "FilterExpression": "SK = META",
                    "ScanIndexForward": True,
                },
            )
            items = response.get("Items", [])

            while "LastEvaluatedKey" in response:
                exclusive_start_key = response["LastEvaluatedKey"]
                self._log_operation_debug(
                    operation="Query",
                    key=exclusive_start_key,
                    item={
                        "index_name": self.test_id_index_name,
                        "testId": test_id,
                        "scan_index_forward": True,
                    },
                )
                response = self._call_dynamodb(
                    operation="Query",
                    call=lambda: self.table.query(
                        ExclusiveStartKey=exclusive_start_key,
                        **query_kwargs,
                    ),
                    key=exclusive_start_key,
                    item={
                        "IndexName": self.test_id_index_name,
                        "KeyConditionExpression": f"testId = {test_id}",
                        "FilterExpression": "SK = META",
                        "ScanIndexForward": True,
                    },
                )
                items.extend(response.get("Items", []))
        except self._client_errors:
            logger.exception("Failed to query %s by test id", self.model_class.__name__)
            raise

        entities = [self._deserialize(item) for item in items]
        return sorted(entities, key=lambda entity: (entity.display_order, entity.id))
