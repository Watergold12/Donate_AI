import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '../../components/templates/DashboardLayout'
import { PageHeader } from '../../components/molecules/PageHeader'
import { EmptyState } from '../../components/molecules/EmptyState'
import { Pagination } from '../../components/molecules/Pagination'
import { Card } from '../../components/atoms/Card'
import { Button } from '../../components/atoms/Button'
import { Badge } from '../../components/atoms/Badge'
import { Spinner } from '../../components/atoms/Spinner'
import { Modal } from '../../components/molecules/Modal'
import { adminApi } from '../../api/admin'
import { useToast } from '../../store/ToastProvider'
import type { NGOProfile, NGOVerificationStatus } from '../../types/index'
import { formatDate } from '../../utils/index'

export function AdminNGOsPage() {
  const [ngos, setNgos] = useState<NGOProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [actioning, setActioning] = useState<string | null>(null)
  
  // Rejection Modal state
  const [rejectingTarget, setRejectingTarget] = useState<NGOProfile | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const toast = useToast()

  const load = useCallback(() => {
    setLoading(true)
    const filter = statusFilter === 'all' ? undefined : statusFilter
    adminApi.pendingNGOs(page, 20, filter)
      .then(r => {
        setNgos(r.data.data)
        setPages(r.data.pagination.pages)
        setTotal(r.data.pagination.total)
      })
      .catch(() => toast.error('Failed to load NGO verification list'))
      .finally(() => setLoading(false))
  }, [page, statusFilter, toast])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [load])

  function approve(id: string) {
    setActioning(id)
    adminApi.verifyNGO(id, true)
      .then(() => { load(); toast.success('NGO verification approved successfully!') })
      .catch(() => toast.error('Failed to approve NGO'))
      .finally(() => setActioning(null))
  }

  function handleConfirmReject() {
    if (!rejectingTarget) return
    setActioning(rejectingTarget.id)
    adminApi.verifyNGO(rejectingTarget.id, false, rejectionReason || 'Document verification failed')
      .then(() => {
        load()
        toast.info('NGO verification application rejected')
        setRejectingTarget(null)
        setRejectionReason('')
      })
      .catch(() => toast.error('Failed to reject NGO application'))
      .finally(() => setActioning(null))
  }

  const renderBadge = (ngo: NGOProfile) => {
    const st: NGOVerificationStatus = ngo.verification_status || (ngo.is_verified ? 'verified' : 'unsubmitted')
    if (st === 'verified' || ngo.is_verified) return <Badge variant="success">Verified</Badge>
    if (st === 'pending') return <Badge variant="warning">Pending Review</Badge>
    if (st === 'rejected') return <Badge variant="danger">Rejected</Badge>
    return <Badge variant="info">Unsubmitted</Badge>
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 max-w-6xl mx-auto">
        <PageHeader
          title="NGO Document Verification"
          subtitle="Review official registration documents and manage NGO verification approvals."
        />

        {/* ── Status Filter Tabs ─────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 border-b border-da-border/60 pb-3">
          {[
            { id: 'pending', label: 'Pending Review' },
            { id: 'verified', label: 'Verified NGOs' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'all', label: 'All NGOs' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id)
                setPage(1)
              }}
              className={[
                'rounded-xl px-4 py-2 text-xs font-semibold transition-all',
                statusFilter === tab.id
                  ? 'bg-[#1D8CF8] text-white shadow-md shadow-[#1D8CF8]/20'
                  : 'text-da-secondary hover:bg-da-surface hover:text-da-text',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── NGO List Card ───────────────────────────────────────── */}
        <Card padding="none" className="border border-da-border/60">
          {loading ? (
            <div className="flex h-48 items-center justify-center"><Spinner /></div>
          ) : ngos.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<span className="text-4xl">📋</span>}
                title={`No ${statusFilter === 'all' ? '' : statusFilter} NGOs found`}
                description="There are currently no NGO applications matching this status filter."
              />
            </div>
          ) : (
            <div className="divide-y divide-da-border/50">
              {ngos.map(ngo => (
                <div key={ngo.id} className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-col gap-2 max-w-xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="text-base font-bold text-da-text">{ngo.org_name}</h4>
                      {renderBadge(ngo)}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-da-secondary">
                      <p><strong className="text-da-text">Reg #:</strong> {ngo.registration_number}</p>
                      {ngo.contact_phone && <p><strong className="text-da-text">Phone:</strong> {ngo.contact_phone}</p>}
                      {(ngo.city || ngo.state) && (
                        <p><strong className="text-da-text">Location:</strong> {[ngo.city, ngo.state].filter(Boolean).join(', ')}</p>
                      )}
                      {ngo.website && (
                        <p>
                          <strong className="text-da-text">Website:</strong>{' '}
                          <a href={ngo.website.startsWith('http') ? ngo.website : `https://${ngo.website}`} target="_blank" rel="noopener noreferrer" className="text-[#1D8CF8] hover:underline">
                            {ngo.website}
                          </a>
                        </p>
                      )}
                      <p><strong className="text-da-text">Registered:</strong> {ngo.created_at ? formatDate(ngo.created_at) : '—'}</p>
                      {ngo.verification_submitted_at && (
                        <p><strong className="text-da-text">Docs Submitted:</strong> {formatDate(ngo.verification_submitted_at)}</p>
                      )}
                    </div>

                    {/* Rejection Note display */}
                    {ngo.rejection_reason && (
                      <div className="mt-1 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-300">
                        <strong>Rejection Reason:</strong> {ngo.rejection_reason}
                      </div>
                    )}
                  </div>

                  {/* Right Side: Document Link & Action Buttons */}
                  <div className="flex flex-wrap items-center gap-3">
                    {ngo.verification_doc_path ? (
                      <a
                        href={`http://localhost:8000${ngo.verification_doc_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#1D8CF8]/30 bg-[#1D8CF8]/10 px-3.5 py-2 text-xs font-semibold text-[#1D8CF8] hover:bg-[#1D8CF8]/20 transition-all"
                      >
                        <span>📄 View Document</span>
                        <span>↗</span>
                      </a>
                    ) : (
                      <span className="text-xs text-da-muted italic px-2">No Document Uploaded</span>
                    )}

                    {!ngo.is_verified && (
                      <Button
                        size="sm"
                        loading={actioning === ngo.id}
                        onClick={() => approve(ngo.id)}
                      >
                        Approve NGO
                      </Button>
                    )}

                    {ngo.verification_status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="danger"
                        loading={actioning === ngo.id}
                        onClick={() => {
                          setRejectingTarget(ngo)
                          setRejectionReason('')
                        }}
                      >
                        {ngo.is_verified ? 'Revoke Access' : 'Reject'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {pages > 1 && (
            <div className="border-t border-da-border px-6 py-3">
              <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
            </div>
          )}
        </Card>

        {/* ── Rejection Reason Modal ──────────────────────────────── */}
        {rejectingTarget && (
          <Modal
            open={true}
            onClose={() => setRejectingTarget(null)}
            title={`Reject Verification: ${rejectingTarget.org_name}`}
          >
            <div className="flex flex-col gap-4">
              <p className="text-xs text-da-secondary">
                Please specify a reason for rejecting this NGO application. This feedback will be displayed to the NGO so they can re-submit valid documentation.
              </p>

              <div>
                <label className="text-xs font-medium text-da-text mb-1 block">Rejection Reason</label>
                <textarea
                  rows={4}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="e.g. Uploaded document is illegible, registration number mismatch, or 80G certificate expired."
                  className="w-full rounded-xl border border-da-border bg-da-bg px-3.5 py-2.5 text-xs text-da-text focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setRejectingTarget(null)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  loading={actioning === rejectingTarget.id}
                  onClick={handleConfirmReject}
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  )
}
