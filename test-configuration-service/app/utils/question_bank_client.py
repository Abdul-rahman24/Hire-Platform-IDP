from app.core.exceptions import RepositoryNotFoundException
from app.core.logging import get_logger
from app.schemas.question_bank import QuestionResponse, QuestionSetResponse
from app.services.interfaces import QuestionBankProviderInterface

logger = get_logger(__name__)


class QuestionBankClient(QuestionBankProviderInterface):
    """Temporary in-memory Question Bank provider for end-to-end testing."""

    def __init__(self) -> None:
        self._question_sets = {
            "MOCK_SET_001": QuestionSetResponse(
                questionSetId="MOCK_SET_001",
                name="Mock Question Set",
                description="Temporary mock question set used for testing",
                status="active",
            )
        }
        self._questions_by_set = {
            "MOCK_SET_001": [
                QuestionResponse(
                    questionId="Q001",
                    questionSetId="MOCK_SET_001",
                    questionText="Which AWS service is primarily used to store objects at massive scale?",
                    questionType="MCQ",
                    options=["Amazon S3", "Amazon RDS", "Amazon EC2", "Amazon VPC"],
                    correctAnswer="Amazon S3",
                    marks=1,
                ),
                QuestionResponse(
                    questionId="Q002",
                    questionSetId="MOCK_SET_001",
                    questionText="What does IAM stand for in AWS?",
                    questionType="MCQ",
                    options=[
                        "Identity and Access Management",
                        "Internet Access Monitor",
                        "Integrated Application Model",
                        "Internal Audit Mechanism",
                    ],
                    correctAnswer="Identity and Access Management",
                    marks=1,
                ),
                QuestionResponse(
                    questionId="Q003",
                    questionSetId="MOCK_SET_001",
                    questionText="Which Python keyword is used to define a function?",
                    questionType="MCQ",
                    options=["func", "define", "def", "lambda"],
                    correctAnswer="def",
                    marks=1,
                ),
                QuestionResponse(
                    questionId="Q004",
                    questionSetId="MOCK_SET_001",
                    questionText="Which AWS database service is a fully managed NoSQL key-value store?",
                    questionType="MCQ",
                    options=["Amazon Aurora", "Amazon DynamoDB", "Amazon Redshift", "Amazon ElastiCache"],
                    correctAnswer="Amazon DynamoDB",
                    marks=1,
                ),
                QuestionResponse(
                    questionId="Q005",
                    questionSetId="MOCK_SET_001",
                    questionText="What is the output type of the expression 3 < 5 in Python?",
                    questionType="MCQ",
                    options=["int", "str", "bool", "float"],
                    correctAnswer="bool",
                    marks=1,
                ),
            ]
        }

    def list_question_sets(self) -> list[QuestionSetResponse]:
        logger.info("Fetching mock question sets from Question Bank")
        return list(self._question_sets.values())

    def get_question_set(self, question_set_id: str) -> QuestionSetResponse:
        logger.info("Fetching mock question set '%s' from Question Bank", question_set_id)
        question_set = self._question_sets.get(question_set_id)
        if question_set is None:
            raise RepositoryNotFoundException(
                f"Question set '{question_set_id}' was not found",
            )
        return question_set

    def list_questions(self, question_set_id: str) -> list[QuestionResponse]:
        logger.info("Fetching mock questions for question set '%s'", question_set_id)
        if question_set_id not in self._questions_by_set:
            raise RepositoryNotFoundException(
                f"Question set '{question_set_id}' was not found",
            )
        return self._questions_by_set[question_set_id]
