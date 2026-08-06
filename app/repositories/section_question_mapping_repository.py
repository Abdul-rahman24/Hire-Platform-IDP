from app.core.exceptions import RepositoryNotFoundException
from app.models.section_question_mapping import SectionQuestionMappingEntity
from app.repositories.dynamodb_base import DynamoDBRepository
from app.repositories.interfaces import SectionQuestionMappingRepositoryInterface
from app.utils.dynamodb import DynamoDBClient


class SectionQuestionMappingRepository(
    DynamoDBRepository[SectionQuestionMappingEntity],
    SectionQuestionMappingRepositoryInterface[SectionQuestionMappingEntity],
):
    def __init__(self, dynamodb_client: DynamoDBClient) -> None:
        super().__init__(
            dynamodb_client=dynamodb_client,
            model_class=SectionQuestionMappingEntity,
            table_name="section-question-mappings",
        )

    def get_by_section_id(self, section_id: str) -> SectionQuestionMappingEntity:
        mappings = self.list_by_attribute("section_id", section_id)
        if not mappings:
            raise RepositoryNotFoundException(
                f"SectionQuestionMappingEntity for section '{section_id}' was not found",
            )
        return mappings[0]

    def delete_by_section_id(self, section_id: str) -> None:
        mapping = self.get_by_section_id(section_id)
        self.delete(mapping.id)
