import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '../../components/templates/DashboardLayout'
import { PageHeader } from '../../components/molecules/PageHeader'
import { StatusBadge } from '../../components/molecules/StatusBadge'
import { EmptyState } from '../../components/molecules/EmptyState'
import { Pagination } from '../../components/molecules/Pagination'
import { Card } from '../../components/atoms/Card'
import { Spinner } from '../../components/atoms/Spinner'
import { Select } from '../../components/atoms/Select'
import { donationsApi } from '../../api/donations'
import type { Donation, DonationStatus } from '../../types/index'
import { formatDate, capitalize } from '../../utils/index'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_match', label: 'Pending Match' },
  { value: 'matched', label: 'Matched' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function DonationHistoryPage() {
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState<DonationStatus | ''>('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    donationsApi.listMine(page, 20, status || undefined)
      .then(r => {
        setDonations(r.data.data)
        setPages(r.data.pagination.pages)
        setTotal(r.data.pagination.total)
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [page, status])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [load])

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader title="Donation History" subtitle="All your donations in one place" />

        <div className="flex items-center gap-3">
          <Select
            options={STATUS_OPTIONS}
            value={status}
            onChange={e => { setStatus(e.target.value as DonationStatus | ''); setPage(1) }}
            className="w-48"
          />
        </div>

        <Card padding="none">
          {loading ? (
            <div className="flex h-48 items-center justify-center"><Spinner /></div>
          ) : donations.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<span className="text-4xl">📋</span>} title="No donations found" description="Try adjusting your filter" />
            </div>
          ) : (
            <div className="divide-y divide-da-border">
              {donations.map(d => (
                <div key={d.id}>
                  <button
                    className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-da-border/30 transition-colors"
                    onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-da-text">
                        {d.total_items} item{d.total_items !== 1 ? 's' : ''}
                        {d.notes ? ` — ${d.notes}` : ''}
                      </span>
                      <span className="text-xs text-da-secondary">{formatDate(d.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={d.status} />
                      {!['completed', 'cancelled', 'pickup_scheduled', 'collected', 'delivered'].includes(d.status) && (
                        <Link
                          to={`/donor/pickup-schedule?donationId=${d.id}`}
                          onClick={e => e.stopPropagation()}
                          className="rounded-lg bg-da-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-da-hover transition-colors"
                        >
                          Schedule Pickup
                        </Link>
                      )}
                      <span className="text-da-muted">{expanded === d.id ? '▲' : '▼'}</span>
                    </div>
                  </button>
                  {expanded === d.id && d.items.length > 0 && (
                    <div className="border-t border-da-border bg-da-bg px-6 py-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-da-secondary">Items</p>
                      <div className="flex flex-col gap-1">
                        {d.items.map(item => (
                          <div key={item.id} className="flex flex-col gap-0.5 text-sm text-da-text">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.item_name}</span>
                              <span className="text-gray-400">·</span>
                              <span>{capitalize(item.category)}</span>
                              <span className="text-gray-400">·</span>
                              <span>Qty {item.quantity}</span>
                              <span className="text-gray-400">·</span>
                              <span>{capitalize(item.condition)}</span>
                            </div>
                            {item.description && (
                              <span className="text-xs text-da-secondary">Description: {item.description}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
