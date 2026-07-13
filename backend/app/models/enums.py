import enum


class UserRole(str, enum.Enum):
    donor = "donor"
    ngo = "ngo"
    admin = "admin"


class ItemCategory(str, enum.Enum):
    clothing = "clothing"
    food = "food"
    electronics = "electronics"
    furniture = "furniture"
    books = "books"
    medical = "medical"
    toys = "toys"
    other = "other"


class ItemCondition(str, enum.Enum):
    new = "new"
    good = "good"
    fair = "fair"
    poor = "poor"


class DonationStatus(str, enum.Enum):
    draft = "draft"
    pending_match = "pending_match"
    matched = "matched"
    scheduled = "scheduled"
    completed = "completed"
    cancelled = "cancelled"


class DemandUrgency(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class MatchStatus(str, enum.Enum):
    proposed = "proposed"
    accepted = "accepted"
    rejected = "rejected"
    expired = "expired"
    completed = "completed"


class PickupStatus(str, enum.Enum):
    scheduled = "scheduled"
    in_transit = "in_transit"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class NotificationType(str, enum.Enum):
    match_found = "match_found"
    match_accepted = "match_accepted"
    match_rejected = "match_rejected"
    pickup_scheduled = "pickup_scheduled"
    pickup_completed = "pickup_completed"
    demand_fulfilled = "demand_fulfilled"
    donation_received = "donation_received"
    ngo_verified = "ngo_verified"
    system = "system"


class AuditAction(str, enum.Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    VERIFY = "VERIFY"
    MATCH = "MATCH"
    ACCEPT = "ACCEPT"
    REJECT = "REJECT"
    CANCEL = "CANCEL"
