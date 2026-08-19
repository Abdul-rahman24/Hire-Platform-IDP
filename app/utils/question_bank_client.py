import json
import os
import time
from typing import Any
import urllib3

from app.core.config import get_settings
from app.core.exceptions import QuestionServiceException, QuestionSetNotFoundException
from app.core.logging import get_logger
from app.schemas.question_bank import QuestionSetResponse

logger = get_logger(__name__)

# Shared persistent connection pool & in-memory cache across Lambda invocations and local runs
_http_pool = urllib3.PoolManager(
    maxsize=30,
    timeout=urllib3.Timeout(connect=2.0, read=5.0),
    retries=urllib3.Retry(total=2, backoff_factor=0.2),
)
_global_sets_cache: dict[str, tuple[float, dict[str, Any]]] = {}
_global_list_cache: tuple[float, list[QuestionSetResponse]] | None = None


class QuestionBankClient:
    """Live Question Bank client with high-concurrency connection pooling and in-memory TTL caching."""

    def __init__(self, base_url: str | None = None, timeout: float = 10.0, cache_ttl: float = 300.0) -> None:
        try:
            settings = get_settings()
            default_url = getattr(
                settings,
                "question_service_url",
                "https://yee9ggnjni.execute-api.ap-southeast-1.amazonaws.com/default",
            )
        except Exception:
            default_url = "https://yee9ggnjni.execute-api.ap-southeast-1.amazonaws.com/default"

        self.base_url = (base_url or os.getenv("QUESTION_SERVICE_URL") or default_url).rstrip("/")
        self.timeout = timeout
        self.cache_ttl = cache_ttl
        self.http = _http_pool

    def get_question_set(self, question_set_id: str) -> dict[str, Any]:
        global _global_sets_cache
        now = time.time()
        if question_set_id in _global_sets_cache:
            cached_time, cached_data = _global_sets_cache[question_set_id]
            if now - cached_time < self.cache_ttl:
                logger.debug("Serving question set '%s' from in-memory cache", question_set_id)
                return cached_data

        data = self._fetch_remote_question_set(question_set_id)
        if isinstance(data, dict):
            _global_sets_cache[question_set_id] = (now, data)
        return data

    def _fetch_remote_question_set(self, question_set_id: str) -> dict[str, Any]:
        url = f"{self.base_url}/question-sets/{question_set_id}"
        logger.info("Calling Question Bank Service: GET %s", url)
        try:
            resp = self.http.request("GET", url, headers={"Accept": "application/json"})
            if resp.status == 200:
                return json.loads(resp.data.decode("utf-8"))
            if resp.status in (400, 404):
                raise QuestionSetNotFoundException(
                    f"Invalid Question Set: '{question_set_id}' does not exist.",
                )
            logger.error("HTTP error from Question Service: %s", resp.status)
            raise QuestionServiceException(f"Question Bank Service HTTP Error: {resp.status}")
        except QuestionSetNotFoundException:
            raise
        except QuestionServiceException:
            raise
        except Exception as e:
            logger.error("Error connecting to Question Bank Service for '%s': %s", question_set_id, e)
            raise QuestionServiceException(f"Unable to connect to Question Bank Service: {str(e)}")

    def list_question_sets(self) -> list[QuestionSetResponse]:
        global _global_list_cache
        now = time.time()
        if _global_list_cache is not None:
            cached_time, cached_sets = _global_list_cache
            if now - cached_time < self.cache_ttl:
                logger.debug("Serving question sets list from in-memory RAM cache")
                return cached_sets

        url = f"{self.base_url}/question-sets"
        logger.info("Calling Question Bank Service: GET %s", url)
        try:
            resp = self.http.request("GET", url, headers={"Accept": "application/json"})
            if resp.status == 200:
                raw_res = json.loads(resp.data.decode("utf-8"))
                items_list = raw_res.get("data", raw_res) if isinstance(raw_res, dict) else raw_res
                results = []
                for item in items_list:
                    if isinstance(item, dict):
                        results.append(
                            QuestionSetResponse(
                                questionSetId=item.get("questionSetId", item.get("id", "SET001")),
                                questionSetName=item.get("title", item.get("questionSetName", "Question Set")),
                                totalQuestions=item.get("totalQuestions", len(item.get("questions", []))),
                            )
                        )
                if results:
                    _global_list_cache = (now, results)
                    return results
        except Exception as e:
            logger.error("Error listing question sets from Question Bank Service: %s", e)

        return []

    def list_questions(self, question_set_id: str) -> list[dict[str, Any]]:
        try:
            set_data = self.get_question_set(question_set_id)
            if isinstance(set_data, dict):
                return set_data.get("questions", [])
            elif isinstance(set_data, list):
                return set_data
        except Exception as e:
            logger.warning("Error fetching questions for '%s': %s", question_set_id, e)
        return []

    def validate_question_ids(
        self,
        question_set_id: str,
        question_ids: list[str],
    ) -> None:
        questions = self.list_questions(question_set_id)
        available_ids = {q.get("questionId") for q in questions if isinstance(q, dict)}
        invalid_ids = [qid for qid in question_ids if qid not in available_ids]
        if invalid_ids:
            raise QuestionSetNotFoundException(
                f"Invalid question ids for question set '{question_set_id}': {', '.join(invalid_ids)}",
            )
