from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class SectionCreateRequest(BaseModel):
    question_set_id: str = Field(alias="questionSetId", min_length=1)
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    duration: int = Field(ge=1, le=1440)
    display_order: int = Field(alias="displayOrder", ge=0)
    status: Literal["draft", "active", "published", "archived"] = "draft"

    model_config = ConfigDict(populate_by_name=True)


class SectionUpdateRequest(BaseModel):
    question_set_id: str = Field(alias="questionSetId", min_length=1)
    name: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)
    duration: int = Field(ge=1, le=1440)
    display_order: int = Field(alias="displayOrder", ge=0)
    status: Literal["draft", "active", "published", "archived"]

    model_config = ConfigDict(populate_by_name=True)


class SectionResponse(BaseModel):
    id: str
    test_id: str = Field(alias="testId")
    question_set_id: str | None = Field(default=None, alias="questionSetId")
    name: str
    description: str | None = None
    duration: int
    display_order: int = Field(alias="displayOrder")
    status: str
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    model_config = ConfigDict(populate_by_name=True)


class SectionListResponse(BaseModel):
    items: list[SectionResponse]
    count: int
