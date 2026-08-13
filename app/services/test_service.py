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


def _normalize_question_type(raw_type: str | None) -> str:
    if not raw_type or not isinstance(raw_type, str):
        return "MCQ"
    val = raw_type.strip().upper()
    if "COD" in val or "PROGRAM" in val or "ALGO" in val:
        return "CODING"
    if "DESC" in val or "ESSAY" in val or "SUBJECTIVE" in val or "TEXT" in val:
        return "DESCRIPTIVE"
    if "MCQ" in val or "CHOICE" in val or "OBJECTIVE" in val:
        return "MCQ"
    return val


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
        logger.info("Listing all tests with batch resolution")
        entities = self.repository.list()
        if not entities:
            return []

        # 1. Bulk fetch all sections in 1 scan pass
        sections_by_test: dict[str, list[SectionEntity]] = {}
        all_sections: list[SectionEntity] = []
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

        # 2. Gather ALL unique question set IDs across all sections of all tests
        unique_set_ids: set[str] = set()
        for sec in all_sections:
            sid = getattr(sec, "question_set_id", None) or getattr(sec, "questionSetId", None)
            if sid:
                unique_set_ids.add(str(sid))
        for entity in entities:
            qsid = getattr(entity, "question_set_id", None) or getattr(entity, "questionSetId", None)
            if qsid:
                unique_set_ids.add(str(qsid))

        # 3. Bulk pre-fetch all unique question sets concurrently IN ONE SINGLE BATCH
        questions_by_set: dict[str, list[Any]] = {}
        def _fetch_set(set_id: str) -> tuple[str, list[Any]]:
            try:
                return set_id, self.question_bank_client.list_questions(set_id)
            except Exception as e:
                logger.warning("Error batch pre-fetching set '%s': %s", set_id, e)
                return set_id, []

        if unique_set_ids:
            with ThreadPoolExecutor(max_workers=min(len(unique_set_ids), 10)) as executor:
                futures = [executor.submit(_fetch_set, sid) for sid in unique_set_ids]
                for f in futures:
                    sid, q_list = f.result()
                    questions_by_set[sid] = q_list

        # 4. Assemble all test responses in memory instantly
        results = []
        for entity in entities:
            sections = sections_by_test.get(entity.id)
            if sections is None and self.section_repository is not None:
                sections = self.section_repository.list_by_test_id(entity.id)
            elif sections is None:
                sections = []
            
            results.append(self._to_response(entity, sections, questions_by_set=questions_by_set))
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
        questions_by_set: dict[str, list[Any]] | None = None,
    ) -> TestResponse:
        link_id_val = getattr(test_entity, "link_id", None) or getattr(test_entity, "linkId", None)
        test_status_val = getattr(test_entity, "test_status", None) or getattr(test_entity, "testStatus", None) or "Active"

        # Case A: Single-Set Test (created with question_set_id)
        if test_entity.question_set_id is not None and not section_entities:
            raw_questions = []
            if questions_by_set is not None and test_entity.question_set_id in questions_by_set:
                raw_questions = questions_by_set[test_entity.question_set_id]
            else:
                try:
                    raw_questions = self.question_bank_client.list_questions(test_entity.question_set_id)
                except Exception as e:
                    logger.warning("Error fetching questions for single set '%s': %s", test_entity.question_set_id, e)

            # Determine question type from set or questions
            single_set_type = "MCQ"
            try:
                qset = self.question_bank_client.get_question_set(test_entity.question_set_id)
                if isinstance(qset, dict):
                    raw_st = qset.get("questionType") or qset.get("question_type") or qset.get("type")
                    if raw_st:
                        single_set_type = _normalize_question_type(raw_st)
            except Exception:
                pass

            if single_set_type == "MCQ" and raw_questions and isinstance(raw_questions[0], dict):
                first_q = raw_questions[0]
                q_st = first_q.get("questionType") or first_q.get("question_type") or first_q.get("type")
                if q_st:
                    single_set_type = _normalize_question_type(q_st)

            formatted_questions = self._format_questions(
                raw_questions=raw_questions,
                question_type=single_set_type,
            )

            duration = test_entity.duration_minutes or 90
            marks = test_entity.total_marks or (len(formatted_questions) * 2)

            return TestResponse(
                test_id=test_entity.id,
                link_id=link_id_val,
                title=test_entity.title,
                description=test_entity.description,
                status=test_entity.status,
                test_status=test_status_val,
                duration_minutes=duration,
                total_marks=marks,
                total_sections=0,
                total_duration_minutes=duration,
                created_at=test_entity.created_at,
                updated_at=test_entity.updated_at,
                questions=formatted_questions,
                sections=[],
            )

        # Case B: Multi-Section Test
        sorted_sections = sorted(section_entities, key=lambda s: getattr(s, "order", 1))
        
        # Resolve questions for each section
        questions_map: dict[str, list[Any]] = {}
        if sorted_sections:
            if questions_by_set is not None:
                for sec in sorted_sections:
                    questions_map[sec.id] = questions_by_set.get(sec.question_set_id, [])
            else:
                def _fetch_sec_questions(sec: SectionEntity) -> tuple[str, list[Any]]:
                    try:
                        q_list = self.question_bank_client.list_questions(sec.question_set_id)
                        return sec.id, q_list
                    except Exception as e:
                        logger.warning("Error fetching questions for set '%s': %s", sec.question_set_id, e)
                        return sec.id, []

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

            # Dynamic question type resolution
            resolved_sec_type = sec.question_type
            if (not resolved_sec_type or resolved_sec_type == "MCQ") and raw_questions and isinstance(raw_questions[0], dict):
                first_q = raw_questions[0]
                q_t = first_q.get("questionType") or first_q.get("question_type") or first_q.get("type")
                if q_t:
                    resolved_sec_type = _normalize_question_type(q_t)

            resolved_sec_type = _normalize_question_type(resolved_sec_type)

            processed_questions = self._format_questions(
                raw_questions=raw_questions,
                question_type=resolved_sec_type,
            )

            sec_resp = SectionWithQuestionsResponse(
                section_id=sec.id,
                test_id=sec.test_id,
                section_name=sec.section_name,
                question_set_id=sec.question_set_id,
                question_type=resolved_sec_type,
                duration_minutes=sec.duration_minutes,
                marks=sec.marks,
                order=sec.order,
                shuffle_questions=sec.shuffle_questions,
                shuffle_options=sec.shuffle_options,
                created_at=sec.created_at,
                updated_at=sec.updated_at,
                questions=processed_questions,
            )
            section_responses.append(sec_resp)

        return TestResponse(
            test_id=test_entity.id,
            link_id=link_id_val,
            title=test_entity.title,
            description=test_entity.description,
            status=test_entity.status,
            test_status=test_status_val,
            duration_minutes=test_entity.duration_minutes,
            total_marks=test_entity.total_marks or total_marks,
            total_sections=len(sorted_sections),
            total_duration_minutes=total_duration,
            created_at=test_entity.created_at,
            updated_at=test_entity.updated_at,
            questions=None,
            sections=section_responses,
        )

    def _format_questions(
        self,
        raw_questions: list[Any],
        question_type: str,
    ) -> list[dict[str, Any]]:
        questions: list[dict[str, Any]] = []

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

            # Preserve full raw question payload with original deterministic question and option order
            formatted_q = dict(q_dict)

            # Ensure primary keys are populated
            qid = formatted_q.get("questionId") or formatted_q.get("question_id") or formatted_q.get("id", "")
            qtext = formatted_q.get("question") or formatted_q.get("text") or formatted_q.get("title", "")
            qmarks = formatted_q.get("marks", 0)

            # Resolve question's exact type from the question itself or inherited from section
            raw_q_type = formatted_q.get("questionType") or formatted_q.get("question_type") or formatted_q.get("type") or question_type
            resolved_type = _normalize_question_type(raw_q_type)

            formatted_q["questionId"] = qid
            formatted_q["question"] = qtext
            formatted_q["marks"] = qmarks
            formatted_q["type"] = resolved_type
            formatted_q["questionType"] = resolved_type

            questions.append(formatted_q)

        return questions
