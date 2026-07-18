from app.services.question_bank_service import QuestionBankService
from app.utils.question_bank_client import QuestionBankClient


def test_list_question_sets_returns_mock_data() -> None:
    service = QuestionBankService(provider=QuestionBankClient())

    items = service.list_question_sets()

    assert len(items) == 1
    assert items[0].question_set_id == "MOCK_SET_001"
    assert items[0].name == "Mock Question Set"


def test_list_questions_returns_mock_data() -> None:
    service = QuestionBankService(provider=QuestionBankClient())

    items = service.list_questions("MOCK_SET_001")

    assert len(items) == 5
    assert items[0].question_id == "Q001"


def test_get_question_set_returns_mock_data() -> None:
    service = QuestionBankService(provider=QuestionBankClient())

    item = service.get_question_set("MOCK_SET_001")

    assert item.question_set_id == "MOCK_SET_001"
    assert item.description == "Temporary mock question set used for testing"
