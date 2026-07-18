from boto3.dynamodb.conditions import Key

from app.core.logging import get_logger
from app.models.question import QuestionEntity
from app.repositories.dynamodb_base import DynamoDBRepository
from app.repositories.interfaces import QuestionRepositoryInterface
from app.utils.dynamodb import DynamoDBClient

logger = get_logger(__name__)


class QuestionRepository(
    DynamoDBRepository[QuestionEntity],
    QuestionRepositoryInterface[QuestionEntity],
):
    def __init__(self, dynamodb_client: DynamoDBClient) -> None:
        super().__init__(
            dynamodb_client=dynamodb_client,
            model_class=QuestionEntity,
            table_name="questions",
            partition_key_name="questionId",
        )

    def list_by_question_set_id(self, question_set_id: str) -> list[QuestionEntity]:
        logger.info("Listing questions for question set '%s' using GSI1", question_set_id)
        query_kwargs = {
            "IndexName": "GSI1",
            "KeyConditionExpression": Key("questionSetId").eq(question_set_id),
            "ScanIndexForward": True,
        }
        items: list[dict] = []
        try:
            self._log_operation_debug(
                operation="Query",
                item={
                    "IndexName": "GSI1",
                    "questionSetId": question_set_id,
                    "scan_index_forward": True,
                },
            )
            response = self._call_dynamodb(
                operation="Query",
                call=lambda: self.table.query(**query_kwargs),
                item={
                    "IndexName": "GSI1",
                    "KeyConditionExpression": f"questionSetId = {question_set_id}",
                    "ScanIndexForward": True,
                },
            )
            items.extend(response.get("Items", []))

            while "LastEvaluatedKey" in response:
                exclusive_start_key = response["LastEvaluatedKey"]
                self._log_operation_debug(
                    operation="Query",
                    key=exclusive_start_key,
                    item={
                        "IndexName": "GSI1",
                        "questionSetId": question_set_id,
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
                        "IndexName": "GSI1",
                        "KeyConditionExpression": f"questionSetId = {question_set_id}",
                        "ScanIndexForward": True,
                    },
                )
                items.extend(response.get("Items", []))
        except self._client_errors:
            logger.exception("Failed to query %s by question set id", self.model_class.__name__)
            raise

        return [self._deserialize(item) for item in items]
