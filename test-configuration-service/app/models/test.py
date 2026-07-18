from app.models.base import BaseEntity


class TestEntity(BaseEntity):
    name: str
    description: str | None = None
    status: str = "draft"

