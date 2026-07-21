import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '../../components/templates/DashboardLayout'
import { PageHeader } from '../../components/molecules/PageHeader'
import { StatusBadge } from '../../components/molecules/StatusBadge'
import { EmptyState } from '../../components/molecules/EmptyState'
import { Pagination } from '../../components/molecules/Pagination'
import { Modal } from '../../components/molecules/Modal'
import { Card } from '../../components/atoms/Card'
import { Button } from '../../components/atoms/Button'
import { Select } from '../../components/atoms/Select'
import { Textarea } from '../../components/atoms/Textarea'
import { Spinner } from '../../components/atoms/Spinner'
import { ngosApi } from '../../api/ngos'
import { useToast } from '../../store/ToastProvider'
import type { Match, MatchStatus } from '../../types/index'
import { scoreToPercent, formatDate, getApiError } from '../../utils/index'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'proposed', label: 'Proposed' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'expired', label: 'Expired' },
]

export function NGOMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<MatchStatus | ''>('')
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [acting, setActing] = useState<string | null>(null)
  const [triggering, setTriggering] = useState(false)
  const toast = useToast()

  const load = useCallback(() => {
    setLoading(true)
    ngosApi.listMatches(page, 20, statusFilter as MatchStatus || undefined)
      .then(r => {
        setMatches(r.data.data)
        setPages(r.data.pagination.pages)
        setTotal(r.data.pagination.total)
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [page, statusFilter])

  useEffect(() => { load() }, [load])

  function runMatching() {
    setTriggering(true)
    ngosApi.triggerMatching()
      .then(r => {
        toast.success(r.data.message || 'Matching process completed')
        load()
      })
      .catch(err => toast.error(getApiError(err)))
      .finally(() => setTriggering(false))
  }

  function accept(id: string) {
    setActing(id)
    ngosApi.acceptMatch(id)
      .then(() => { load(); toast.success('Match accepted') })
      .catch(() => toast.error('Failed to accept match'))
      .finally(() => setActing(null))
  }

  function submitReject() {
    if (!rejectTarget) return
    setActing(rejectTarget)
    ngosApi.rejectMatch(rejectTarget, rejectReason || undefined)
      .then(() => { setRejectTarget(null); setRejectReason(''); load(); toast.info('Match rejected') })
      .catch(() => toast.error('Failed to reject match'))
      .finally(() => setActing(null))
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Match Inbox"
          subtitle={`${total} match${total !== 1 ? 'es' : ''}`}
          actions={
            <Button loading={triggering} onClick={runMatching} variant="secondary">
              ⚡ Run Matching Engine
            </Button>
          }
        />
        <div className="flex items-center gap-3">
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value as MatchStatus | ''); setPage(1) }}
            className="w-44"
          />
        </div>
        <Card padding="none">
          {loading ? (
            <div className="flex h-48 items-center justify-center"><Spinner /></div>
          ) : matches.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<span className="text-4xl">🤝</span>}
                title="No matches found"
                description="Matches appear when donations fit your demands"
              />
            </div>
          ) : (
            <div className="divide-y divide-da-border">
              {matches.map(m => (
                <div key={m.id} className="flex items-start justify-between px-6 py-4">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-da-text">{scoreToPercent(m.score)} Match</span>
                      <StatusBadge status={m.status} />
                    </div>
                    {m.demand_item_name && (
                      <p className="text-sm font-medium text-da-text">
                        Demand: <span className="text-da-primary">{m.demand_item_name}</span>
                      </p>
                    )}
                    {m.items_summary && (
                      <p className="text-xs text-da-secondary">
                        Items: <span className="text-da-text">{m.items_summary}</span>
                      </p>
                    )}
                    {m.donation_notes && (
                      <p className="text-xs italic text-da-muted">"{m.donation_notes}"</p>
                    )}
                    <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-da-border">
                      <div className="h-1.5 rounded-full bg-da-primary" style={{ width: scoreToPercent(m.score) }} />
                    </div>
                    <p className="text-[11px] text-da-muted">Expires {formatDate(m.expires_at)}</p>
                  </div>
                  {m.status === 'proposed' && (
                    <div className="flex gap-2">
                      <Button size="sm" loading={acting === m.id} onClick={() => accept(m.id)}>Accept</Button>
                      <Button size="sm" variant="danger" loading={acting === m.id} onClick={() => { setRejectTarget(m.id); setRejectReason('') }}>Reject</Button>
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
      <Modal open={rejectTarget !== null} onClose={() => setRejectTarget(null)} title="Reject Match">
        <div className="flex flex-col gap-4">
          <Textarea
            label="Reason (optional)"
            placeholder="Why are you rejecting this match?"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
          <div className="flex gap-3">
            <Button variant="danger" loading={acting !== null} onClick={submitReject}>Confirm Reject</Button>
            <Button variant="ghost" onClick={() => setRejectTarget(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
