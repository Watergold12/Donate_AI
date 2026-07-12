import { Badge } from '../atoms/Badge'
import type { DonationStatus, MatchStatus, PickupStatus } from '../../types/index'

type AnyStatus = DonationStatus | MatchStatus | PickupStatus

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' }> = {
  draft:         { label: 'Draft',         variant: 'default' },
  pending_match: { label: 'Finding Match', variant: 'info' },
  matched:       { label: 'Matched',       variant: 'purple' },
  scheduled:     { label: 'Scheduled',     variant: 'warning' },
  completed:     { label: 'Completed',     variant: 'success' },
  cancelled:     { label: 'Cancelled',     variant: 'danger' },
  proposed:      { label: 'Proposed',      variant: 'info' },
  accepted:      { label: 'Accepted',      variant: 'success' },
  rejected:      { label: 'Rejected',      variant: 'danger' },
  expired:       { label: 'Expired',       variant: 'default' },
  in_transit:    { label: 'In Transit',    variant: 'warning' },
  failed:        { label: 'Failed',        variant: 'danger' },
}

interface StatusBadgeProps { status: AnyStatus; className?: string }

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = statusConfig[status] ?? { label: status, variant: 'default' as const }
  return <Badge variant={cfg.variant} className={className}>{cfg.label}</Badge>
}
