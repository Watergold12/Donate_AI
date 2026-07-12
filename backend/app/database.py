"""
Database engine and session configuration.
Uses SQLAlchemy 2.0 with connection pooling.
"""
import logging
from typing import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session

from app.config import settings

logger = logging.getLogger(__name__)

# Create the SQLAlchemy engine
# pool_pre_ping=True: test connections before use (handles DB restarts)
# pool_size=10: number of persistent connections
# max_overflow=20: extra connections allowed above pool_size under load
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=settings.db_echo,
)

# Session factory — used throughout the app
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a database session per request.
    Always closes the session in the finally block regardless of exceptions.

    Usage:
        @router.get("/")
        def endpoint(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
