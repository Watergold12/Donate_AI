from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password


ADMIN_EMAIL = "admin.superuser@example.com"
ADMIN_PASSWORD = "Admin@2026!"


def create_admin():
    db: Session = SessionLocal()

    try:
        existing = (
            db.query(User)
            .filter(User.email == ADMIN_EMAIL)
            .first()
        )

        if existing:
            print(f"User already exists: {ADMIN_EMAIL}")

            existing.password_hash = hash_password(ADMIN_PASSWORD)
            existing.role = "admin"
            existing.is_active = True
            existing.is_verified = True
            existing.deleted_at = None

            db.commit()

            print("Existing user has been promoted/reset as admin.")
            return

        admin = User(
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            full_name="System Administrator",
            role="admin",
            is_active=True,
            is_verified=True,
        )

        db.add(admin)
        db.commit()
        db.refresh(admin)

        print("Admin account created successfully.")
        print(f"Email: {ADMIN_EMAIL}")
        print(f"Role: {admin.role}")
        print(f"ID: {admin.id}")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    create_admin()