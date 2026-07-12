"""
FastAPI dependency injection — authentication and role-based access control.
All protected endpoints use these as Depends() arguments.
"""
import logging
from typing import Annotated
from uuid import UUID

from fastapi import Depends, Header
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.orm import Session

from app.core.exceptions import AuthenticationError, AuthorizationError
from app.core.security import decode_access_token
from app.database import get_db
from app.models.enums import UserRole
from app.models.user import User

logger = logging.getLogger(__name__)

# HTTPBearer extracts the token from "Authorization: Bearer <token>"
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """
    Decode the JWT access token and return the authenticated User.
    Raises AuthenticationError on any failure.
    """
    if not credentials:
        raise AuthenticationError("No authentication token provided")

    try:
        payload = decode_access_token(credentials.credentials)
        user_id: str = payload.get("sub")
        if not user_id:
            raise AuthenticationError("Invalid token: missing subject")
    except JWTError as exc:
        raise AuthenticationError(f"Invalid or expired token: {exc}")

    user = db.query(User).filter(
        User.id == user_id,
        User.deleted_at.is_(None),
    ).first()

    if not user:
        raise AuthenticationError("User not found")

    return user


def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """Extends get_current_user — also checks is_active."""
    if not current_user.is_active:
        raise AuthenticationError("Account is disabled")
    return current_user


def require_role(*roles: UserRole):
    """
    Dependency factory for role-based access control.
    Usage: Depends(require_role(UserRole.admin))
           Depends(require_role(UserRole.donor, UserRole.admin))
    """
    def _check_role(
        current_user: Annotated[User, Depends(get_current_active_user)],
    ) -> User:
        if current_user.role not in roles:
            raise AuthorizationError(
                f"This action requires one of: {[r.value for r in roles]}"
            )
        return current_user
    return _check_role


# Pre-built role dependencies for common use
require_donor = require_role(UserRole.donor)
require_ngo = require_role(UserRole.ngo)
require_admin = require_role(UserRole.admin)
require_donor_or_admin = require_role(UserRole.donor, UserRole.admin)
require_ngo_or_admin = require_role(UserRole.ngo, UserRole.admin)
