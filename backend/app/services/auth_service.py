"""Authentication service — register, login, refresh, logout."""
import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID
from sqlalchemy.orm import Session
from app.config import settings
from app.core.exceptions import AuthenticationError, ConflictError, BusinessLogicError
from app.core.security import create_access_token, create_refresh_token, hash_password, hash_token, verify_password
from app.models.auth import RefreshToken
from app.models.donor import DonorProfile
from app.models.enums import AuditAction, UserRole
from app.models.ngo import NGOProfile
from app.models.user import User
from app.schemas.auth import AccessTokenResponse, RegisterRequest, TokenResponse
from app.utils.audit import log_action

logger = logging.getLogger(__name__)


def register_user(db: Session, payload: RegisterRequest, request=None) -> User:
    existing = db.query(User).filter(User.email == payload.email, User.deleted_at.is_(None)).first()
    if existing:
        raise ConflictError("Email address is already registered")
    if payload.role == UserRole.ngo:
        if not payload.org_name or not payload.registration_number:
            raise BusinessLogicError("NGOs must provide org_name and registration_number")
        if db.query(NGOProfile).filter(NGOProfile.registration_number == payload.registration_number).first():
            raise ConflictError("Registration number already in use")
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        is_active=True,
        is_verified=(payload.role == UserRole.donor),
    )
    db.add(user)
    db.flush()
    if payload.role == UserRole.donor:
        db.add(DonorProfile(user_id=user.id))
    elif payload.role == UserRole.ngo:
        db.add(NGOProfile(
            user_id=user.id,
            org_name=payload.org_name,
            registration_number=payload.registration_number,
            is_verified=False,
        ))
    log_action(db, AuditAction.CREATE, "user", user.id, request=request,
               new_data={"email": user.email, "role": user.role})
    db.commit()
    db.refresh(user)
    logger.info("Registered new user: %s (%s)", user.email, user.role)
    return user


def login_user(db: Session, email: str, password: str, request=None) -> TokenResponse:
    user = db.query(User).filter(User.email == email, User.deleted_at.is_(None)).first()
    if not user or not verify_password(password, user.password_hash):
        raise AuthenticationError("Invalid email or password")
    if not user.is_active:
        raise AuthenticationError("Account has been disabled")
    access_token = create_access_token({"sub": str(user.id), "role": user.role})
    raw_refresh = create_refresh_token()
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    db.add(RefreshToken(user_id=user.id, token_hash=hash_token(raw_refresh), expires_at=expires_at))
    log_action(db, AuditAction.LOGIN, "user", user.id, actor_id=user.id, request=request)
    db.commit()
    return TokenResponse(access_token=access_token, refresh_token=raw_refresh, role=user.role)


def refresh_access_token(db: Session, raw_refresh_token: str) -> AccessTokenResponse:
    token_hash = hash_token(raw_refresh_token)
    now = datetime.now(timezone.utc)
    record = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.revoked.is_(False),
        RefreshToken.expires_at > now,
    ).first()
    if not record:
        raise AuthenticationError("Invalid or expired refresh token")
    user = db.query(User).filter(User.id == record.user_id, User.is_active.is_(True), User.deleted_at.is_(None)).first()
    if not user:
        raise AuthenticationError("User not found or disabled")
    # Rotate: revoke old refresh token
    record.revoked = True
    record.revoked_at = datetime.now(timezone.utc)
    # Issue new refresh token
    new_raw_refresh = create_refresh_token()
    new_expires_at = datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days)
    db.add(RefreshToken(user_id=user.id, token_hash=hash_token(new_raw_refresh), expires_at=new_expires_at))
    db.commit()
    return AccessTokenResponse(
        access_token=create_access_token({"sub": str(user.id), "role": user.role}),
        refresh_token=new_raw_refresh,
    )


def logout_user(db: Session, raw_refresh_token: str, actor_id: UUID, request=None) -> None:
    record = db.query(RefreshToken).filter(
        RefreshToken.token_hash == hash_token(raw_refresh_token),
        RefreshToken.revoked.is_(False),
    ).first()
    if record:
        record.revoked = True
        record.revoked_at = datetime.now(timezone.utc)
    log_action(db, AuditAction.LOGOUT, "user", actor_id, actor_id=actor_id, request=request)
    db.commit()
