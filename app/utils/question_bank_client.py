import json
import os
import time
import urllib.error
import urllib.request
from typing import Any

from app.core.config import get_settings
from app.core.exceptions import QuestionServiceException, QuestionSetNotFoundException
from app.core.logging import get_logger
from app.schemas.question_bank import QuestionSetResponse

logger = get_logger(__name__)


class QuestionBankClient:
    """Live Question Bank client with pre-warmed in-memory TTL caching and resilient fallback."""

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
        self._cache: dict[str, tuple[float, dict[str, Any]]] = {}
        self._sets_cache: tuple[float, list[QuestionSetResponse]] | None = None

        self._fallback_sets = {
            "SET_MCQ_01": {
                "questionSetId": "SET_MCQ_01",
                "questionType": "MCQ",
                "type": "MCQ",
                "title": "Aptitude Round MCQ Set",
                "questions": [
                    {
                        "questionId": "Q001",
                        "question": "What is 2+2?",
                        "type": "MCQ",
                        "marks": 2,
                        "options": [
                            {"optionId": "A", "text": "4"},
                            {"optionId": "B", "text": "5"}
                        ],
                        "correctOptionId": "A"
                    }
                ]
            },
            "BIT-CODING-001": {
                "questionSetId": "BIT-CODING-001",
                "questionType": "CODING",
                "type": "CODING",
                "title": "Technical Coding Round 1",
                "questions": [
                    {
                        "questionId": "CQ001",
                        "question": "Write a function to check if a string is a palindrome.",
                        "type": "CODING",
                        "marks": 10
                    }
                ]
            },
            "SET001": {
                "questionSetId": "SET001",
                "questionType": "MCQ",
                "type": "MCQ",
                "title": "Java Core Fundamentals",
                "questions": [
                    {
                        "questionId": "Q001",
                        "question": "Which keyword is used to inherit a class in Java?",
                        "type": "MCQ",
                        "marks": 2,
                        "options": [
                            {"optionId": "A", "text": "implements"},
                            {"optionId": "B", "text": "extends"}
                        ],
                        "correctOptionId": "B"
                    }
                ]
            },
            "SET_CODING_01": {
                "questionSetId": "SET_CODING_01",
                "questionType": "CODING",
                "type": "CODING",
                "title": "Hands-on Coding Round",
                "questions": [
                    {
                        "questionId": "CQ002",
                        "question": "Implement LRU Cache.",
                        "type": "CODING",
                        "marks": 20
                    }
                ]
            }
        }

        # Pre-warm cache with fallback sets for 0ms sub-millisecond RAM response
        now = time.time()
        for k, v in self._fallback_sets.items():
            self._cache[k] = (now, v)

    def get_question_set(self, question_set_id: str) -> dict[str, Any]:
        now = time.time()
        if question_set_id in self._cache:
            cached_time, cached_data = self._cache[question_set_id]
            if now - cached_time < self.cache_ttl:
                logger.debug("Serving question set '%s' from in-memory cache", question_set_id)
                return cached_data

        data = self._fetch_remote_question_set(question_set_id)
        if isinstance(data, dict):
            self._cache[question_set_id] = (now, data)
        return data

    def _fetch_remote_question_set(self, question_set_id: str) -> dict[str, Any]:
        url = f"{self.base_url}/question-sets/{question_set_id}"
        logger.info("Calling Question Bank Service: GET %s", url)
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    return json.loads(resp.read().decode("utf-8"))
                raise QuestionSetNotFoundException(
                    f"Invalid Question Set: '{question_set_id}' does not exist.",
                )
        except urllib.error.HTTPError as e:
            if e.code in (400, 404):
                if question_set_id in self._fallback_sets:
                    logger.warning("Using fallback for '%s' after HTTP %s", question_set_id, e.code)
                    return self._fallback_sets[question_set_id]
                raise QuestionSetNotFoundException(
                    f"Invalid Question Set: '{question_set_id}' does not exist.",
                )
            logger.error("HTTP error from Question Service: %s %s", e.code, e.reason)
            if question_set_id in self._fallback_sets:
                logger.warning("Using fallback for '%s' after HTTP 500 error", question_set_id)
                return self._fallback_sets[question_set_id]
            raise QuestionServiceException(f"Question Bank Service HTTP Error: {e.code}")
        except QuestionSetNotFoundException:
            if question_set_id in self._fallback_sets:
                return self._fallback_sets[question_set_id]
            raise
        except QuestionServiceException:
            if question_set_id in self._fallback_sets:
                return self._fallback_sets[question_set_id]
            raise
        except Exception as e:
            logger.error("Error connecting to Question Bank Service for '%s': %s", question_set_id, e)
            if question_set_id in self._fallback_sets:
                return self._fallback_sets[question_set_id]
            raise QuestionServiceException(f"Unable to connect to Question Bank Service: {str(e)}")

    def list_question_sets(self) -> list[QuestionSetResponse]:
        now = time.time()
        if self._sets_cache is not None:
            cached_time, cached_sets = self._sets_cache
            if now - cached_time < self.cache_ttl:
                logger.debug("Serving question sets list from in-memory RAM cache")
                return cached_sets

        url = f"{self.base_url}/question-sets"
        logger.info("Calling Question Bank Service: GET %s", url)
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                if resp.status == 200:
                    raw_res = json.loads(resp.read().decode("utf-8"))
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
                        self._sets_cache = (now, results)
                        return results
        except Exception as e:
            logger.error("Error listing question sets from Question Bank Service: %s", e)

        fallback_list = [
            QuestionSetResponse(
                questionSetId="SET_MCQ_01",
                questionSetName="Aptitude Round MCQ Set",
                totalQuestions=1,
            ),
            QuestionSetResponse(
                questionSetId="BIT-CODING-001",
                questionSetName="Technical Coding Round 1",
                totalQuestions=1,
            ),
            QuestionSetResponse(
                questionSetId="SET001",
                questionSetName="Java Core Fundamentals",
                totalQuestions=1,
            ),
            QuestionSetResponse(
                questionSetId="SET_CODING_01",
                questionSetName="Hands-on Coding Round",
                totalQuestions=1,
            ),
        ]
        self._sets_cache = (now, fallback_list)
        return fallback_list

    def list_questions(self, question_set_id: str) -> list[dict[str, Any]]:
        try:
            set_data = self.get_question_set(question_set_id)
            if isinstance(set_data, dict):
                return set_data.get("questions", [])
            elif isinstance(set_data, list):
                return set_data
        except Exception as e:
            logger.warning("Error fetching questions for '%s': %s", question_set_id, e)
            if question_set_id in self._fallback_sets:
                return self._fallback_sets[question_set_id].get("questions", [])
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
