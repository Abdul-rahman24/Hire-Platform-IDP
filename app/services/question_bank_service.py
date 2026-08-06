from app.core.logging import get_logger
from app.schemas.question_bank import QuestionResponse, QuestionSetResponse
from app.services.interfaces import QuestionBankServiceInterface
from app.utils.question_bank_client import QuestionBankClient

logger = get_logger(__name__)


class QuestionBankService(QuestionBankServiceInterface):
    def __init__(self, client: QuestionBankClient) -> None:
        self.client = client

    def list_question_sets(self) -> list[QuestionSetResponse]:
        logger.info("Listing question sets")
        return self.client.list_question_sets()

    def list_questions(self, question_set_id: str) -> list[QuestionResponse]:
        logger.info("Listing questions for question set '%s'", question_set_id)
        return self.client.list_questions(question_set_id)
