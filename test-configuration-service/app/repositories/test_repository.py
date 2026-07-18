from app.models.test import TestEntity
from app.repositories.dynamodb_base import DynamoDBRepository
from app.repositories.interfaces import TestRepositoryInterface
from app.utils.dynamodb import DynamoDBClient


class TestRepository(DynamoDBRepository[TestEntity], TestRepositoryInterface[TestEntity]):
    def __init__(self, dynamodb_client: DynamoDBClient) -> None:
        super().__init__(
            dynamodb_client=dynamodb_client,
            model_class=TestEntity,
            table_name="tests",
            partition_key_name="testId",
        )
