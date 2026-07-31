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
    draft             = "draft"
    pending           = "pending"          # submitted, awaiting detection
    detected          = "detected"         # AI detection completed
    pending_match     = "pending_match"    # submitted to matching engine
    matched           = "matched"          # NGO match proposed
    accepted          = "accepted"         # NGO accepted the match
    pickup_scheduled  = "pickup_scheduled" # pickup date confirmed
    collected         = "collected"        # items picked up from donor
    delivered         = "delivered"        # items delivered to NGO
    completed         = "completed"        # full workflow done
    scheduled         = "scheduled"        # legacy alias (kept for compat)
    cancelled         = "cancelled"


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
    scheduled  = "scheduled"
    confirmed  = "confirmed"   # NGO confirmed the pickup date
    in_transit = "in_transit"  # driver en route to donor
    collected  = "collected"   # items picked up from donor
    delivered  = "delivered"   # items delivered to NGO
    completed  = "completed"   # fully done
    failed     = "failed"
    cancelled  = "cancelled"


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


class NotificationChannel(str, enum.Enum):
    in_app = "in_app"
    email = "email"
    sms = "sms"
    whatsapp = "whatsapp"


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
