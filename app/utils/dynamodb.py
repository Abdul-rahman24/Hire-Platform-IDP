from functools import cached_property, lru_cache

import boto3
from boto3.resources.base import ServiceResource
from botocore.config import Config


class DynamoDBClient:
    """Reusable DynamoDB resource wrapper for repositories with high-concurrency connection pooling."""

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
        # High performance botocore config: 50 pool connections, short timeouts
        boto_config = Config(
            max_pool_connections=50,
            connect_timeout=2,
            read_timeout=3,
            retries={"max_attempts": 2, "mode": "standard"},
        )
        return boto3.resource(
            "dynamodb",
            region_name=self.region_name,
            endpoint_url=self.endpoint_url,
            config=boto_config,
        )

    def table_name(self, base_name: str) -> str:
        return f"{self.table_prefix}-{base_name}"

    @lru_cache
    def get_table(self, base_name: str):
        return self.resource.Table(self.table_name(base_name))
