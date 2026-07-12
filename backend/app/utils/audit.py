"""
Audit logging helper.
Every state-changing service operation calls log_action() to write
an immutable record to the audit_logs table.
"""
import logging
from typing import Any, Optional
from uuid import UUID

from fastapi import Request
from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.enums import AuditAction

logger = logging.getLogger(__name__)


def log_action(
    db: Session,
    action: AuditAction,
    entity_type: str,
    entity_id: UUID,
    actor_id: Optional[UUID] = None,
    old_data: Optional[dict[str, Any]] = None,
    new_data: Optional[dict[str, Any]] = None,
    request: Optional[Request] = None,
) -> None:
    """
    Write an audit log entry.
    Called after every state-changing operation.
    Never raises — audit failures are logged but do not abort the request.

    Args:
        db: Active database session (will be committed by the caller).
        action: The AuditAction enum value.
        entity_type: String name of the entity (e.g., 'donation', 'user').
        entity_id: UUID of the affected entity.
        actor_id: UUID of the user performing the action (None for system actions).
        old_data: Snapshot of the entity before the change (None for CREATE).
        new_data: Snapshot of the entity after the change (None for DELETE).
        request: FastAPI Request object for IP/user-agent capture (optional).
    """
    try:
        ip_address: Optional[str] = None
        user_agent: Optional[str] = None

        if request:
            # X-Forwarded-For for proxied environments, fallback to direct client
            forwarded_for = request.headers.get("X-Forwarded-For")
            ip_address = (
                forwarded_for.split(",")[0].strip()
                if forwarded_for
                else (request.client.host if request.client else None)
            )
            user_agent = request.headers.get("User-Agent")

        entry = AuditLog(
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_data=old_data,
            new_data=new_data,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(entry)
        # Note: do NOT commit here — caller's transaction commits everything atomically
    except Exception as exc:
        # Audit failure must never break the main operation
        logger.error("Failed to write audit log: %s", exc)
