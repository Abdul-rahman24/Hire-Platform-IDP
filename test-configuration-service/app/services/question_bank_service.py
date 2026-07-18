from app.core.logging import get_logger
from app.schemas.question_bank import QuestionResponse, QuestionSetResponse
from app.services.interfaces import (
    QuestionBankProviderInterface,
    QuestionBankServiceInterface,
)

logger = get_logger(__name__)


class QuestionBankService(QuestionBankServiceInterface):
    def __init__(self, provider: QuestionBankProviderInterface) -> None:
        self.provider = provider

    def list_question_sets(self) -> list[QuestionSetResponse]:
        logger.info("Listing question sets")
        return self.provider.list_question_sets()

    def get_question_set(self, question_set_id: str) -> QuestionSetResponse:
        logger.info("Fetching question set '%s'", question_set_id)
        return self.provider.get_question_set(question_set_id)

    def list_questions(self, question_set_id: str) -> list[QuestionResponse]:
        logger.info("Listing questions for question set '%s'", question_set_id)
        return self.provider.list_questions(question_set_id)
