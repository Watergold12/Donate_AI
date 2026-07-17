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

const PIPELINE: { status: PickupStatus; label: string }[] = [
  { status: 'scheduled',  label: 'Scheduled' },
  { status: 'confirmed',  label: 'Confirmed' },
  { status: 'in_transit', label: 'En Route' },
  { status: 'collected',  label: 'Collected' },
  { status: 'delivered',  label: 'Delivered' },
  { status: 'completed',  label: 'Done' },
]

const PIPELINE_IDX: Record<string, number> = Object.fromEntries(
  PIPELINE.map((p, i) => [p.status, i])
)

function PipelineTimeline({ status }: { status: PickupStatus }) {
  if (status === 'cancelled' || status === 'failed') {
    return (
      <div className="mt-3 flex items-center gap-2">
        <StatusBadge status={status} />
        <span className="text-xs text-[#6B7280]">
          {status === 'cancelled' ? 'Pickup was cancelled' : 'Pickup failed'}
        </span>
      </div>
    )
  }
  const cur = PIPELINE_IDX[status] ?? 0
  return (
    <div className="mt-3 flex items-center overflow-x-auto pb-1">
      {PIPELINE.map((step, i) => {
        const done   = i < cur
        const active = i === cur
        return (
          <div key={step.status} className="flex items-center">
            <div className="flex flex-col items-center gap-1 min-w-[3rem]">
              <div className={[
                'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold',
                done   ? 'bg-[#22C55E] text-white' : '',
                active ? 'bg-[#1D8CF8] text-white ring-2 ring-[#1D8CF8]/30' : '',
                !done && !active ? 'bg-white/10 text-[#6B7280]' : '',
              ].join(' ')}>
                {done ? '✓' : i + 1}
              </div>
              <span className={[
                'text-[9px] text-center leading-tight',
                done || active ? 'text-white' : 'text-[#6B7280]',
              ].join(' ')}>
                {step.label}
              </span>
            </div>
            {i < PIPELINE.length - 1 && (
              <div className={[
                'h-0.5 w-6 mb-4 flex-shrink-0',
                i < cur ? 'bg-[#22C55E]' : 'bg-white/10',
              ].join(' ')} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export function DonorPickupsPage() {
  const [pickups, setPickups]   = useState<Pickup[]>([])
  const [loading, setLoading]   = useState(true)
  const [page, setPage]         = useState(1)
  const [pages, setPages]       = useState(1)
  const [total, setTotal]       = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)

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
        <PageHeader
          title="My Pickups"
          subtitle={`${total} pickup${total !== 1 ? 's' : ''} — tap a row to track the journey`}
        />
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
                <div key={p.id} className="px-6 py-4">
                  <button
                    className="flex w-full items-start justify-between gap-4 text-left"
                    onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="truncate text-sm font-medium text-white">{p.pickup_address}</p>
                      <p className="text-xs text-[#A1A8B3]">{p.pickup_city}</p>
                      <p className="text-xs text-[#6B7280]">{formatDateTime(p.scheduled_at)}</p>
                      {p.contact_phone && (
                        <p className="text-xs text-[#A1A8B3]">📞 {p.contact_phone}</p>
                      )}
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2 pt-0.5">
                      <StatusBadge status={p.status} />
                      <span className="text-xs text-[#6B7280]">{expanded === p.id ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {expanded === p.id && (
                    <div className="mt-3">
                      <PipelineTimeline status={p.status} />
                      {p.completed_at && (
                        <p className="mt-2 text-xs text-[#6B7280]">
                          Completed: {formatDateTime(p.completed_at)}
                        </p>
                      )}
                      {p.notes && (
                        <p className="mt-1 text-xs text-[#A1A8B3]">Note: {p.notes}</p>
                      )}
                    </div>
                  )}
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
