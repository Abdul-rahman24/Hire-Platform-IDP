from functools import cached_property
import os
from time import perf_counter

import boto3
from boto3.resources.base import ServiceResource
from botocore.exceptions import BotoCoreError, ClientError

from app.core.logging import get_logger

logger = get_logger(__name__)


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
        logger.info(
            "DynamoDBClient initialized: AWS_REGION=%s AWS_DEFAULT_REGION=%s "
            "DYNAMODB_ENDPOINT_URL=%s AWS_PROFILE=%s table_prefix=%s "
            "resolved_tables=%s",
            os.environ.get("AWS_REGION"),
            os.environ.get("AWS_DEFAULT_REGION"),
            self.endpoint_url,
            os.environ.get("AWS_PROFILE"),
            self.table_prefix,
            {
                "assignments": self.table_name("assignments"),
                "exam-sessions": self.table_name("exam-sessions"),
                "tests": self.table_name("tests"),
                "sections": self.table_name("sections"),
                "section-question-mapping": self.table_name("section-question-mapping"),
                "published-tests": self.table_name("published-tests"),
            },
        )

    @cached_property
    def resource(self) -> ServiceResource:
        session = boto3.Session()
        credentials = session.get_credentials()
        logger.info(
            "Creating DynamoDB boto3 resource: configured_region=%s "
            "session_region=%s credentials_source=%s",
            self.region_name,
            session.region_name,
            credentials.method if credentials else None,
        )

        self._log_caller_identity()
        resource = boto3.resource(
            "dynamodb",
            region_name=self.region_name,
            endpoint_url=self.endpoint_url,
        )
        retry_config = resource.meta.client.meta.config.retries
        logger.info("DynamoDB boto3 retry configuration: %s", retry_config)
        return resource

    def table_name(self, base_name: str) -> str:
        return f"{self.table_prefix}-{base_name}"

    def get_table(self, base_name: str):
        table_name = self.table_name(base_name)
        logger.info(
            "Resolving DynamoDB table resource: base_name=%s table_name=%s region=%s",
            base_name,
            table_name,
            self.region_name,
        )
        return self.resource.Table(table_name)

    def _log_caller_identity(self) -> None:
        start = perf_counter()
        logger.info("Calling STS GetCallerIdentity for DynamoDB diagnostics")
        try:
            identity = boto3.client("sts", region_name=self.region_name).get_caller_identity()
        except (BotoCoreError, ClientError, Exception):
            logger.exception("STS GetCallerIdentity failed during DynamoDB diagnostics")
            return

        duration_ms = (perf_counter() - start) * 1000
        logger.info(
            "STS GetCallerIdentity completed in %.2f ms: account=%s arn=%s user_id=%s",
            duration_ms,
            identity.get("Account"),
            identity.get("Arn"),
            identity.get("UserId"),
        )
