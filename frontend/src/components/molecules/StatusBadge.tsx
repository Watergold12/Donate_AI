import { Badge } from '../atoms/Badge'
import type { DonationStatus, MatchStatus, PickupStatus } from '../../types/index'

type AnyStatus = DonationStatus | MatchStatus | PickupStatus

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' }> = {
  draft:            { label: 'Draft',             variant: 'default' },
  pending:          { label: 'Pending',            variant: 'info' },
  detected:         { label: 'Detected',           variant: 'info' },
  pending_match:    { label: 'Finding Match',      variant: 'purple' },
  matched:          { label: 'Matched',            variant: 'purple' },
  accepted:         { label: 'Accepted',           variant: 'success' },
  packaging_notified: { label: 'Packaging Ready',  variant: 'info' },
  acknowledged:     { label: 'Acknowledged',       variant: 'success' },
  pickup_scheduled: { label: 'Pickup Scheduled',   variant: 'warning' },
  collected:        { label: 'Collected',          variant: 'warning' },
  delivered:        { label: 'Delivered',          variant: 'success' },
  completed:        { label: 'Completed',          variant: 'success' },
  scheduled:        { label: 'Scheduled',          variant: 'warning' },
  cancelled:        { label: 'Cancelled',          variant: 'danger' },
  proposed:         { label: 'Proposed',           variant: 'info' },
  rejected:         { label: 'Rejected',           variant: 'danger' },
  expired:          { label: 'Expired',            variant: 'default' },
  confirmed:        { label: 'Confirmed',          variant: 'success' },
  in_transit:       { label: 'In Transit',         variant: 'warning' },
  failed:           { label: 'Failed',             variant: 'danger' },
}

interface StatusBadgeProps { status: AnyStatus; className?: string }

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = statusConfig[status] ?? { label: status, variant: 'default' as const }
  return <Badge variant={cfg.variant} className={className}>{cfg.label}</Badge>
}
