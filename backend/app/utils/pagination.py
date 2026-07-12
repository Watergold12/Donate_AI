"""
Pagination utilities for list endpoints.
All list responses use PaginationParams and return PaginatedResponse.
"""
from typing import Any, Generic, List, Optional, TypeVar

from fastapi import Query
from pydantic import BaseModel
from sqlalchemy.orm import Query as SAQuery

T = TypeVar("T")

DEFAULT_PAGE = 1
DEFAULT_SIZE = 20
MAX_SIZE = 100


class PaginationParams:
    """
    FastAPI dependency for pagination query params.
    Usage: params: PaginationParams = Depends()
    """
    def __init__(
        self,
        page: int = Query(default=DEFAULT_PAGE, ge=1, description="Page number (1-based)"),
        size: int = Query(default=DEFAULT_SIZE, ge=1, le=MAX_SIZE, description="Items per page"),
    ):
        self.page = page
        self.size = size

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.size


def paginate(query: SAQuery, params: PaginationParams) -> tuple[list, int]:
    """
    Apply pagination to a SQLAlchemy query.
    Returns (items, total_count).
    Executes two queries: one for count, one for the page slice.
    """
    total = query.count()
    items = query.offset(params.offset).limit(params.size).all()
    return items, total


class PaginationMeta(BaseModel):
    page: int
    size: int
    total: int
    pages: int


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response wrapper."""
    success: bool = True
    data: List[T]
    message: str = "Success"
    pagination: PaginationMeta

    @classmethod
    def create(
        cls,
        items: List[T],
        total: int,
        params: PaginationParams,
        message: str = "Success",
    ) -> "PaginatedResponse[T]":
        import math
        return cls(
            data=items,
            message=message,
            pagination=PaginationMeta(
                page=params.page,
                size=params.size,
                total=total,
                pages=max(1, math.ceil(total / params.size)) if total > 0 else 1,
            ),
        )
