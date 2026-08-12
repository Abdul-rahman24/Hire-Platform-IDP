import random
import secrets
from concurrent.futures import ThreadPoolExecutor
from typing import Any

from app.core.exceptions import QuestionSetNotFoundException, RepositoryNotFoundException, ServiceException
from app.core.logging import get_logger
from app.models.section import SectionEntity
from app.models.test import TestEntity
from app.repositories.interfaces import (
    SectionRepositoryInterface,
    TestRepositoryInterface,
)
from app.schemas.section import SectionWithQuestionsResponse
from app.schemas.test import (
    TestCreateRequest,
    TestResponse,
    TestUpdateRequest,
)
from app.services.interfaces import TestServiceInterface
from app.utils.question_bank_client import QuestionBankClient

logger = get_logger(__name__)


def _generate_6digit_link_id() -> str:
    return str(secrets.randbelow(900000) + 100000)


class TestService(TestServiceInterface):
    def __init__(
        self,
        repository: TestRepositoryInterface[TestEntity],
        section_repository: SectionRepositoryInterface[SectionEntity] | None = None,
        question_bank_client: QuestionBankClient | None = None,
    ) -> None:
        self.repository = repository
        self.section_repository = section_repository
        self.question_bank_client = question_bank_client or QuestionBankClient()

    def _generate_unique_link_id(self) -> str:
        return _generate_6digit_link_id()

    def create_test(self, payload: TestCreateRequest) -> TestResponse:
        title = payload.title
        logger.info("Creating test definition with title '%s'", title)
        
        # If single-set questionSetId is provided, validate with Question Bank Service
        question_set_id = getattr(payload, "question_set_id", None)
        if question_set_id is not None:
            try:
                self.question_bank_client.get_question_set(question_set_id)
            except Exception as e:
                logger.warning("Invalid questionSetId '%s': %s", question_set_id, e)
                if isinstance(e, QuestionSetNotFoundException):
                    raise
                raise QuestionSetNotFoundException(
                    f"Invalid Question Set: '{question_set_id}' does not exist."
                )

        dump = payload.model_dump()
        if not dump.get("link_id"):
            dump["link_id"] = self._generate_unique_link_id()
        
        if not dump.get("test_status") or dump.get("test_status") in ("published", "draft"):
            dump["test_status"] = getattr(payload, "test_status", None) or "Active"
            if dump["test_status"] in ("published", "draft"):
                dump["test_status"] = "Active"

        entity = TestEntity(**dump)
        created_entity = self.repository.create(entity)
        return self._to_response(created_entity, [])

    def get_test(self, test_id: str) -> TestResponse:
        logger.info("Fetching test '%s'", test_id)
        test_entity = self.repository.get(test_id)
        sections = (
            self.section_repository.list_by_test_id(test_id)
            if self.section_repository is not None
            else []
        )
        return self._to_response(test_entity, sections)

    def list_tests(self) -> list[TestResponse]:
        logger.info("Listing all tests")
        entities = self.repository.list()
        if not entities:
            return []

        # High Performance Optimization: Bulk fetch all sections in 1 scan instead of N scans
        sections_by_test: dict[str, list[SectionEntity]] = {}
        if self.section_repository is not None:
            try:
                all_sections = self.section_repository.list()
                for sec in all_sections:
                    tid = getattr(sec, "test_id", None) or getattr(sec, "testId", None)
                    if tid:
                        if tid not in sections_by_test:
                            sections_by_test[tid] = []
                        sections_by_test[tid].append(sec)
            except Exception as e:
                logger.warning("Bulk section pre-fetch fallback: %s", e)

        results = []
        for entity in entities:
            # Get pre-fetched sections if available, else fallback to per-test list
            sections = sections_by_test.get(entity.id)
            if sections is None and self.section_repository is not None:
                sections = self.section_repository.list_by_test_id(entity.id)
            elif sections is None:
                sections = []
            
            results.append(self._to_response(entity, sections))
        return results

    def update_test(self, test_id: str, payload: TestUpdateRequest) -> TestResponse:
        logger.info("Updating test '%s'", test_id)
        existing = self.repository.get(test_id)
        updated_data = existing.model_dump(mode="python")
        update_dict = payload.model_dump(exclude_unset=True)
        updated_data.update(update_dict)

        entity = TestEntity.model_validate(updated_data)
        updated_entity = self.repository.update(test_id, entity)
        sections = (
            self.section_repository.list_by_test_id(test_id)
            if self.section_repository is not None
            else []
        )
        return self._to_response(updated_entity, sections)

    def delete_test(self, test_id: str) -> None:
        logger.info("Deleting test '%s'", test_id)
        if self.section_repository is not None:
            sections = self.section_repository.list_by_test_id(test_id)
            for section in sections:
                self.section_repository.delete(section.id)

        self.repository.delete(test_id)

    def get_complete_test(self, test_id: str) -> TestResponse:
        return self.get_test(test_id)

    def _to_response(
        self,
        test_entity: TestEntity,
        section_entities: list[SectionEntity],
    ) -> TestResponse:
        link_id_val = getattr(test_entity, "link_id", None) or getattr(test_entity, "linkId", None)
        test_status_val = getattr(test_entity, "test_status", None) or getattr(test_entity, "testStatus", None) or "Active"

        # Case A: Single-Set Test (created with question_set_id)
        if test_entity.question_set_id is not None and not section_entities:
            raw_questions = []
            try:
                raw_questions = self.question_bank_client.list_questions(test_entity.question_set_id)
            except Exception as e:
                logger.warning("Error fetching questions for single set '%s': %s", test_entity.question_set_id, e)

            formatted_questions = self._apply_shuffle_and_formatting(
                raw_questions=raw_questions,
                question_type="MCQ",
                shuffle_questions=False,
                shuffle_options=False,
            )

            duration = test_entity.duration_minutes or 90
            marks = test_entity.total_marks or (len(formatted_questions) * 2)

            return TestResponse(
                testId=test_entity.id,
                linkId=link_id_val,
                title=test_entity.title,
                description=test_entity.description,
                status=test_entity.status,
                testStatus=test_status_val,
                durationMinutes=duration,
                totalMarks=marks,
                totalSections=0,
                totalDurationMinutes=duration,
                createdAt=test_entity.created_at,
                updatedAt=test_entity.updated_at,
                questions=formatted_questions,
                sections=[],
            )

        # Case B: Multi-Section Test with Concurrent Fetching
        sorted_sections = sorted(section_entities, key=lambda s: getattr(s, "order", 1))
        
        # Parallel question fetching for sections
        def _fetch_sec_questions(sec: SectionEntity) -> tuple[str, list[Any]]:
            try:
                q_list = self.question_bank_client.list_questions(sec.question_set_id)
                return sec.id, q_list
            except Exception as e:
                logger.warning("Error fetching questions for set '%s': %s", sec.question_set_id, e)
                return sec.id, []

        questions_map: dict[str, list[Any]] = {}
        if sorted_sections:
            with ThreadPoolExecutor(max_workers=min(len(sorted_sections), 5)) as executor:
                futures = [executor.submit(_fetch_sec_questions, sec) for sec in sorted_sections]
                for f in futures:
                    sec_id, q_list = f.result()
                    questions_map[sec_id] = q_list

        section_responses: list[SectionWithQuestionsResponse] = []
        total_duration = 0
        total_marks = 0

        for sec in sorted_sections:
            total_duration += sec.duration_minutes
            total_marks += sec.marks
            raw_questions = questions_map.get(sec.id, [])

            processed_questions = self._apply_shuffle_and_formatting(
                raw_questions=raw_questions,
                question_type=sec.question_type or "MCQ",
                shuffle_questions=sec.shuffle_questions,
                shuffle_options=sec.shuffle_options,
            )

            sec_resp = SectionWithQuestionsResponse(
                sectionId=sec.id,
                testId=sec.test_id,
                sectionName=sec.section_name,
                questionSetId=sec.question_set_id,
                questionType=sec.question_type,
                durationMinutes=sec.duration_minutes,
                marks=sec.marks,
                order=sec.order,
                shuffleQuestions=sec.shuffle_questions,
                shuffleOptions=sec.shuffle_options,
                createdAt=sec.created_at,
                updatedAt=sec.updated_at,
                questions=processed_questions,
            )
            section_responses.append(sec_resp)

        return TestResponse(
            testId=test_entity.id,
            linkId=link_id_val,
            title=test_entity.title,
            description=test_entity.description,
            status=test_entity.status,
            testStatus=test_status_val,
            durationMinutes=test_entity.duration_minutes,
            totalMarks=test_entity.total_marks or total_marks,
            totalSections=len(sorted_sections),
            totalDurationMinutes=total_duration,
            createdAt=test_entity.created_at,
            updatedAt=test_entity.updated_at,
            questions=None,
            sections=section_responses,
        )

    def _apply_shuffle_and_formatting(
        self,
        raw_questions: list[Any],
        question_type: str,
        shuffle_questions: bool,
        shuffle_options: bool,
    ) -> list[dict[str, Any]]:
        questions: list[dict[str, Any]] = []
        q_type_upper = (question_type or "MCQ").upper()

        for q in raw_questions:
            if hasattr(q, "model_dump"):
                q_dict = q.model_dump(mode="python", by_alias=True)
            elif isinstance(q, dict):
                q_dict = dict(q)
            else:
                q_dict = {
                    "questionId": getattr(q, "question_id", str(q)),
                    "question": getattr(q, "question", str(q)),
                    "marks": getattr(q, "marks", 0),
                }

            qid = q_dict.get("questionId", q_dict.get("question_id", ""))
            qtext = q_dict.get("question", "")
            qmarks = q_dict.get("marks", 0)

            # Explicit question type handling
            if q_type_upper in ("MCQ", "MULTIPLE_CHOICE"):
                correct_opt_id = q_dict.get("correctOptionId", q_dict.get("correct_option_id", ""))
                q_type_val = q_dict.get("questionType", q_dict.get("type", "MCQ"))
                formatted_q = {
                    "questionId": qid,
                    "question": qtext,
                    "type": q_type_val,
                    "marks": qmarks,
                    "options": q_dict.get("options", []),
                    "correctOptionId": correct_opt_id,
                }
            elif q_type_upper == "CODING":
                formatted_q = {
                    "questionId": qid,
                    "question": qtext,
                    "marks": qmarks,
                }
            elif q_type_upper == "ESSAY":
                formatted_q = {
                    "questionId": qid,
                    "question": qtext,
                    "marks": qmarks,
                }
            elif q_type_upper in ("TRUE_FALSE", "TRUE_OR_FALSE"):
                formatted_q = {
                    "questionId": qid,
                    "question": qtext,
                    "marks": qmarks,
                }
            elif q_type_upper == "DESCRIPTIVE":
                formatted_q = {
                    "questionId": qid,
                    "question": qtext,
                    "marks": qmarks,
                }
            else:
                formatted_q = {
                    "questionId": qid,
                    "question": qtext,
                    "marks": qmarks,
                }

            questions.append(formatted_q)

        # Shuffle question order if requested (applies to ALL sections)
        if shuffle_questions:
            random.shuffle(questions)

        # Shuffle options ONLY when questionType is MCQ
        if shuffle_options and q_type_upper in ("MCQ", "MULTIPLE_CHOICE"):
            for q in questions:
                if "options" in q and isinstance(q["options"], list):
                    opts = list(q["options"])
                    random.shuffle(opts)
                    q["options"] = opts

        return questions
