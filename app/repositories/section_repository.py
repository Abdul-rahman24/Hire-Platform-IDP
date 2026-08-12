from boto3.dynamodb.conditions import Attr

from app.models.section import SectionEntity
from app.repositories.dynamodb_base import DynamoDBRepository
from app.repositories.interfaces import SectionRepositoryInterface
from app.utils.dynamodb import DynamoDBClient


class SectionRepository(
    DynamoDBRepository[SectionEntity],
    SectionRepositoryInterface[SectionEntity],
):
    def __init__(self, dynamodb_client: DynamoDBClient) -> None:
        super().__init__(
            dynamodb_client=dynamodb_client,
            model_class=SectionEntity,
            table_name="sections",
            id_field="sectionId",
            sort_key_field="SK",
            sort_key_value="METADATA",
        )

    def list_by_test_id(self, test_id: str) -> list[SectionEntity]:
        filter_expr = Attr("test_id").eq(test_id) | Attr("testId").eq(test_id)
        items = self._scan_items(filter_expression=filter_expr)
        return sorted(items, key=lambda s: getattr(s, "order", 1))
