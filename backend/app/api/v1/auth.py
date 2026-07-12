"""Auth API endpoints."""
from typing import Annotated
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_active_user
from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    AccessTokenResponse, LoginRequest, RefreshRequest,
    RegisterRequest, TokenResponse, UserResponse,
)
from app.schemas.common import APIResponse
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=APIResponse[UserResponse], status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, request: Request, db: Annotated[Session, Depends(get_db)]):
    user = auth_service.register_user(db, payload, request)
    return APIResponse.ok(UserResponse.model_validate(user), "Registration successful")


@router.post("/login", response_model=APIResponse[TokenResponse])
def login(payload: LoginRequest, request: Request, db: Annotated[Session, Depends(get_db)]):
    tokens = auth_service.login_user(db, payload.email, payload.password, request)
    return APIResponse.ok(tokens, "Login successful")


@router.post("/refresh", response_model=APIResponse[AccessTokenResponse])
def refresh(payload: RefreshRequest, db: Annotated[Session, Depends(get_db)]):
    token = auth_service.refresh_access_token(db, payload.refresh_token)
    return APIResponse.ok(token, "Token refreshed")


@router.post("/logout", response_model=APIResponse[None])
def logout(
    payload: RefreshRequest,
    request: Request,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[Session, Depends(get_db)],
):
    auth_service.logout_user(db, payload.refresh_token, current_user.id, request)
    return APIResponse.ok(None, "Logged out successfully")


@router.get("/me", response_model=APIResponse[UserResponse])
def get_me(current_user: Annotated[User, Depends(get_current_active_user)]):
    return APIResponse.ok(UserResponse.model_validate(current_user), "User profile retrieved")
