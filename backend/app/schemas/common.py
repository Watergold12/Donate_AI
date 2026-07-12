"""Standard API response envelopes used by every endpoint."""
from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Single-item response envelope."""
    success: bool = True
    data: Optional[T] = None
    message: str = "Success"
    pagination: None = None

    @classmethod
    def ok(cls, data: T, message: str = "Success") -> "APIResponse[T]":
        return cls(success=True, data=data, message=message)

    @classmethod
    def error(cls, message: str, data: Any = None) -> "APIResponse":
        return cls(success=False, data=data, message=message)


class PaginationMeta(BaseModel):
    page: int
    size: int
    total: int
    pages: int


class PaginatedAPIResponse(BaseModel, Generic[T]):
    """Paginated list response envelope."""
    success: bool = True
    data: List[T]
    message: str = "Success"
    pagination: PaginationMeta
