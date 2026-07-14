import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '../../components/templates/DashboardLayout'
import { PageHeader } from '../../components/molecules/PageHeader'
import { StatusBadge } from '../../components/molecules/StatusBadge'
import { EmptyState } from '../../components/molecules/EmptyState'
import { Pagination } from '../../components/molecules/Pagination'
import { Card } from '../../components/atoms/Card'
import { Spinner } from '../../components/atoms/Spinner'
import { pickupsApi } from '../../api/pickups'
import type { Pickup } from '../../types/index'
import { formatDateTime } from '../../utils/index'

export function DonorPickupsPage() {
  const [pickups, setPickups] = useState<Pickup[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    pickupsApi.getDonorPickups(page, 20)
      .then(r => {
        setPickups(r.data.data)
        setPages(r.data.pagination.pages)
        setTotal(r.data.pagination.total)
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader title="My Pickups" subtitle="Track your scheduled pickups" />
        <Card padding="none">
          {loading ? (
            <div className="flex h-48 items-center justify-center"><Spinner /></div>
          ) : pickups.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<span className="text-4xl">🚚</span>}
                title="No pickups yet"
                description="Pickups appear here once an NGO accepts your donation"
              />
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {pickups.map(p => (
                <div key={p.id} className="flex items-start justify-between px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-white">{p.pickup_address}</p>
                    <p className="text-xs text-[#A1A8B3]">{p.pickup_city}</p>
                    <p className="text-xs text-[#6B7280]">{formatDateTime(p.scheduled_at)}</p>
                    {p.contact_phone && (
                      <p className="text-xs text-[#A1A8B3]">📞 {p.contact_phone}</p>
                    )}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-white/[0.08] px-6">
            <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
