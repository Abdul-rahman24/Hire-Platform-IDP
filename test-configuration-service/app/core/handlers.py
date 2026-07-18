import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette import status

from app.core.exceptions import AppException


def register_exception_handlers(app: FastAPI) -> None:
    def _serialize_validation_errors(errors: list[dict]) -> list[dict]:
        serialized_errors: list[dict] = []
        for error in errors:
            serialized_error = dict(error)
            ctx = serialized_error.get("ctx")
            if isinstance(ctx, dict):
                serialized_error["ctx"] = {
                    key: str(value) if isinstance(value, Exception) else value
                    for key, value in ctx.items()
                }
            serialized_errors.append(serialized_error)
        return serialized_errors

    @app.exception_handler(AppException)
    async def app_exception_handler(_: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "success": False,
                "message": exc.message,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        _: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "message": "Request validation failed",
                "errors": _serialize_validation_errors(exc.errors()),
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(
        _: Request,
        exc: Exception,
    ) -> JSONResponse:
        logging.getLogger(__name__).exception("Unhandled exception", exc_info=exc)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "message": "Internal server error",
            },
        )
