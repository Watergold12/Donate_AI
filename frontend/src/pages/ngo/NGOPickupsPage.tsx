import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '../../components/templates/DashboardLayout'
import { PageHeader } from '../../components/molecules/PageHeader'
import { StatusBadge } from '../../components/molecules/StatusBadge'
import { EmptyState } from '../../components/molecules/EmptyState'
import { Pagination } from '../../components/molecules/Pagination'
import { Card } from '../../components/atoms/Card'
import { Spinner } from '../../components/atoms/Spinner'
import { pickupsApi } from '../../api/pickups'
import type { Pickup, PickupStatus } from '../../types/index'
import { formatDateTime, getApiError } from '../../utils/index'
import { useToast } from '../../store/ToastProvider'
import { NGOVerificationGuard } from '../../components/organisms/NGOVerificationGuard'

const UPDATABLE_STATUSES: PickupStatus[] = ['scheduled', 'confirmed', 'in_transit', 'collected', 'delivered']
const STATUS_OPTIONS: { value: PickupStatus; label: string }[] = [
  { value: 'in_transit', label: 'In Transit' },
  { value: 'collected', label: 'Picked Up' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
]

export function NGOPickupsPage() {
  const [pickups, setPickups] = useState<Pickup[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [updating, setUpdating] = useState<string | null>(null)
  const toast = useToast()

  const load = useCallback(() => {
    setLoading(true)
    pickupsApi.getNgoPickups(page, 20)
      .then(r => {
        setPickups(r.data.data)
        setPages(r.data.pagination.pages)
        setTotal(r.data.pagination.total)
      })
      .catch(err => toast.error(getApiError(err)))
      .finally(() => setLoading(false))
  }, [page, toast])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [load])

  function updateStatus(id: string, status: PickupStatus) {
    setUpdating(id)
    pickupsApi.updateStatus(id, status)
      .then(() => { load(); toast.success('Status updated successfully') })
      .catch(err => toast.error(getApiError(err)))
      .finally(() => setUpdating(null))
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <NGOVerificationGuard />
        <PageHeader title="Pickups" subtitle={`${total} pickup${total !== 1 ? 's' : ''}`} />
        <Card padding="none">
          {loading ? (
            <div className="flex h-48 items-center justify-center"><Spinner /></div>
          ) : pickups.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<span className="text-4xl">🚚</span>} title="No pickups yet" description="Pickups appear here after matches are accepted" />
            </div>
          ) : (
            <div className="divide-y divide-da-border">
              {pickups.map(p => (
                <div key={p.id} className="flex items-start justify-between px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-da-text">{p.pickup_address}</p>
                    <p className="text-xs text-da-secondary">{p.pickup_city}</p>
                    <p className="text-xs text-da-muted">{formatDateTime(p.scheduled_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={p.status} />
                    {UPDATABLE_STATUSES.includes(p.status) && (
                      <select
                        disabled={updating === p.id}
                        className="rounded-lg border border-da-border bg-da-bg px-2 py-1 text-xs text-da-text"
                        value=""
                        onChange={e => { if (e.target.value) updateStatus(p.id, e.target.value as PickupStatus) }}
                      >
                        <option value="">Update status…</option>
                        {STATUS_OPTIONS.map(o => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-da-border px-6">
            <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
