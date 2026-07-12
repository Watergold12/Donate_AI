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
import { formatDateTime } from '../../utils/index'

const UPDATABLE_STATUSES: PickupStatus[] = ['scheduled', 'in_transit']
const STATUS_OPTIONS: { value: PickupStatus; label: string }[] = [
  { value: 'in_transit', label: 'In Transit' },
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

  const load = useCallback(() => {
    setLoading(true)
    pickupsApi.getNgoPickups(page, 20)
      .then(r => {
        setPickups(r.data.data)
        setPages(r.data.pagination.pages)
        setTotal(r.data.pagination.total)
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  function updateStatus(id: string, status: PickupStatus) {
    setUpdating(id)
    pickupsApi.updateStatus(id, status)
      .then(() => load())
      .catch(() => null)
      .finally(() => setUpdating(null))
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader title="Pickups" subtitle={`${total} pickup${total !== 1 ? 's' : ''}`} />
        <Card padding="none">
          {loading ? (
            <div className="flex h-48 items-center justify-center"><Spinner /></div>
          ) : pickups.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<span className="text-4xl">🚚</span>} title="No pickups yet" description="Pickups appear here after matches are accepted" />
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {pickups.map(p => (
                <div key={p.id} className="flex items-start justify-between px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{p.pickup_address}</p>
                    <p className="text-xs text-gray-500">{p.pickup_city}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(p.scheduled_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={p.status} />
                    {UPDATABLE_STATUSES.includes(p.status) && (
                      <select
                        disabled={updating === p.id}
                        className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100"
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
          <div className="border-t border-gray-100 px-6 dark:border-gray-800">
            <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
