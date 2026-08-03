// ── Enums ──────────────────────────────────────────────────────────────────
export type UserRole = 'donor' | 'ngo' | 'admin'
export type ItemCategory = 'clothing' | 'food' | 'electronics' | 'furniture' | 'books' | 'medical' | 'toys' | 'other'
export type ItemCondition = 'new' | 'good' | 'fair' | 'poor'
export type DonationStatus =
  | 'draft' | 'pending' | 'detected'
  | 'pending_match' | 'matched' | 'accepted'
  | 'packaging_notified' | 'acknowledged'
  | 'pickup_scheduled' | 'collected' | 'delivered'
  | 'scheduled' | 'completed' | 'cancelled'
export type DemandUrgency = 'low' | 'medium' | 'high' | 'critical'
export type MatchStatus = 'proposed' | 'accepted' | 'rejected' | 'expired' | 'completed'
export type PickupStatus = 'scheduled' | 'confirmed' | 'in_transit' | 'collected' | 'delivered' | 'completed' | 'failed' | 'cancelled'
export type NotificationType = 'match_found' | 'match_accepted' | 'match_rejected' | 'pickup_scheduled' | 'pickup_completed' | 'demand_fulfilled' | 'donation_received' | 'ngo_verified' | 'system'

// ── API Envelope ───────────────────────────────────────────────────────────
export interface APIResponse<T> {
  success: boolean
  data: T
  message: string
  pagination: null
}

export interface PaginationMeta {
  page: number
  size: number
  total: number
  pages: number
}

export interface PaginatedAPIResponse<T> {
  success: boolean
  data: T[]
  message: string
  pagination: PaginationMeta
}

// ── Auth ───────────────────────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  is_verified: boolean
  created_at?: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  role: UserRole
}

export interface AccessTokenResponse {
  access_token: string
  token_type: string
}

// ── Donor ──────────────────────────────────────────────────────────────────
export interface DonorProfile {
  id: string
  user_id: string
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  total_donations: number
}

// ── Donation ───────────────────────────────────────────────────────────────
export interface DonationItem {
  id: string
  donation_id: string
  item_name: string
  description: string | null
  category: ItemCategory
  quantity: number
  condition: ItemCondition
  ai_detected: boolean
  confidence_score: number | null
  image_path: string | null
  is_confirmed: boolean
}

export interface Donation {
  id: string
  donor_id: string
  status: DonationStatus
  notes: string | null
  total_items: number
  submitted_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  items: DonationItem[]
}

export interface PackagingChecklist {
  donation_id: string
  status: DonationStatus
  acknowledged: boolean
  summary: string
  general_steps: string[]
  item_guidance: string[]
}

// ── NGO ────────────────────────────────────────────────────────────────────
export type NGOVerificationStatus = 'unsubmitted' | 'pending' | 'verified' | 'rejected'

export interface NGOProfile {
  id: string
  user_id: string
  org_name: string
  registration_number: string
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  contact_phone: string | null
  website: string | null
  description: string | null
  service_areas: string[] | null
  verification_status?: NGOVerificationStatus
  verification_doc_path?: string | null
  rejection_reason?: string | null
  verification_submitted_at?: string | null
  is_verified: boolean
  verified_at: string | null
  created_at?: string
}

export interface NGODemand {
  id: string
  ngo_id: string
  item_category: ItemCategory
  item_name: string
  quantity_needed: number
  urgency_level: DemandUrgency
  description: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
}

// ── Match ──────────────────────────────────────────────────────────────────
export interface Match {
  id: string
  donation_id: string
  ngo_demand_id: string | null
  ngo_id: string
  score: number
  status: MatchStatus
  proposed_at: string
  responded_at: string | null
  expires_at: string
  rejection_reason: string | null
  donation_notes?: string | null
  items_summary?: string | null
  demand_item_name?: string | null
  score_breakdown?: Record<string, unknown> | null
  match_explanation?: string[] | null
}

// ── Pickup ─────────────────────────────────────────────────────────────────
export interface Pickup {
  id: string
  donation_id: string
  ngo_id: string
  match_id: string
  status: PickupStatus
  scheduled_at: string
  pickup_address: string
  pickup_city: string
  contact_phone: string | null
  notes: string | null
  completed_at: string | null
  created_at: string
}

// ── Notification ───────────────────────────────────────────────────────────
export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  reference_id: string | null
  reference_type: string | null
  created_at: string
}

// ── Detection ──────────────────────────────────────────────────────────────
export interface BoundingBox {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface DetectionResult {
  name: string
  category: ItemCategory
  confidence: number
  count: number
  bbox: BoundingBox | null
}

export interface DetectionResponse {
  items: DetectionResult[]
  total_detected: number
  image_path: string | null
}

// ── Analytics ─────────────────────────────────────────────────────────────
export interface DonorSummary {
  total_donations: number
  completed_donations: number
  pending_donations: number
  total_items_donated: number
}

export interface NGOSummary {
  total_demands: number
  active_demands: number
  total_matches: number
  accepted_matches: number
  pickups_completed: number
}

export interface AdminSummary {
  total_users: number
  total_donors: number
  total_ngos: number
  pending_ngo_verifications: number
  total_donations: number
  total_matches: number
  match_success_rate: number
}

export interface TrendPoint {
  date: string
  count: number
}

export interface CategoryBreakdown {
  category: ItemCategory
  count: number
  percentage: number
}

export interface MatchingRatePoint {
  date: string
  total_matches: number
  accepted: number
  rate: number
}

export interface PickupStats {
  total_scheduled: number
  completed: number
  failed: number
  completion_rate: number
}
