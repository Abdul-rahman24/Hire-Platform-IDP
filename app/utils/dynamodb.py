from functools import cached_property

import boto3
from boto3.resources.base import ServiceResource


class DynamoDBClient:
    """Reusable DynamoDB resource wrapper for repositories."""

    def __init__(
        self,
        region_name: str,
        table_prefix: str,
        endpoint_url: str | None = None,
    ) -> None:
        self.region_name = region_name
        self.endpoint_url = endpoint_url
        self.table_prefix = table_prefix

    @cached_property
    def resource(self) -> ServiceResource:
        return boto3.resource(
            "dynamodb",
            region_name=self.region_name,
            endpoint_url=self.endpoint_url,
        )

    def table_name(self, base_name: str) -> str:
        return f"{self.table_prefix}-{base_name}"

    def get_table(self, base_name: str):
        return self.resource.Table(self.table_name(base_name))

