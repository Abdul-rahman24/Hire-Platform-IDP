from app.models.base import BaseEntity


class SectionQuestionMappingEntity(BaseEntity):
    section_id: str
    question_set_id: str
    question_ids: list[str]
