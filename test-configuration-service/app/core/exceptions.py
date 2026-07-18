class AppException(Exception):
    """Base exception for controlled application errors."""

    def __init__(self, message: str, status_code: int = 400) -> None:
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class RepositoryException(AppException):
    """Base exception for repository-level failures."""


class RepositoryNotFoundException(RepositoryException):
    """Raised when a repository item does not exist."""

    def __init__(self, message: str) -> None:
        super().__init__(message=message, status_code=404)


class RepositoryConflictException(RepositoryException):
    """Raised when a create operation conflicts with an existing item."""

    def __init__(self, message: str) -> None:
        super().__init__(message=message, status_code=409)


class ServiceException(AppException):
    """Base exception for service-level failures."""


class ExternalServiceException(AppException):
    """Raised when an external service interaction fails."""
