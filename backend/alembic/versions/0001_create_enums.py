"""create enums

Revision ID: 0001
Revises:
Create Date: 2024-01-01 00:00:00.000000
"""
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE TYPE user_role AS ENUM ('donor', 'ngo', 'admin')")
    op.execute("""CREATE TYPE item_category AS ENUM (
        'clothing','food','electronics','furniture','books','medical','toys','other'
    )""")
    op.execute("CREATE TYPE item_condition AS ENUM ('new','good','fair','poor')")
    op.execute("""CREATE TYPE donation_status AS ENUM (
        'draft','pending_match','matched','scheduled','completed','cancelled'
    )""")
    op.execute("CREATE TYPE demand_urgency AS ENUM ('low','medium','high','critical')")
    op.execute("""CREATE TYPE match_status AS ENUM (
        'proposed','accepted','rejected','expired','completed'
    )""")
    op.execute("""CREATE TYPE pickup_status AS ENUM (
        'scheduled','in_transit','completed','failed','cancelled'
    )""")
    op.execute("""CREATE TYPE notification_type AS ENUM (
        'match_found','match_accepted','match_rejected','pickup_scheduled',
        'pickup_completed','demand_fulfilled','donation_received','ngo_verified','system'
    )""")
    op.execute("""CREATE TYPE audit_action AS ENUM (
        'CREATE','UPDATE','DELETE','LOGIN','LOGOUT','VERIFY','MATCH','ACCEPT','REJECT','CANCEL'
    )""")


def downgrade() -> None:
    for t in ["audit_action","notification_type","pickup_status","match_status",
              "demand_urgency","donation_status","item_condition","item_category","user_role"]:
        op.execute(f"DROP TYPE IF EXISTS {t}")
