import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '../../components/templates/DashboardLayout'
import { PageHeader } from '../../components/molecules/PageHeader'
import { EmptyState } from '../../components/molecules/EmptyState'
import { Pagination } from '../../components/molecules/Pagination'
import { Card } from '../../components/atoms/Card'
import { Button } from '../../components/atoms/Button'
import { Spinner } from '../../components/atoms/Spinner'
import { adminApi } from '../../api/admin'
import type { NGOProfile } from '../../types/index'
import { formatDate } from '../../utils/index'

export function AdminNGOsPage() {
  const [ngos, setNgos] = useState<NGOProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [actioning, setActioning] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    adminApi.pendingNGOs(page, 20)
      .then(r => {
        setNgos(r.data.data)
        setPages(r.data.pagination.pages)
        setTotal(r.data.pagination.total)
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  function approve(id: string) {
    setActioning(id)
    adminApi.verifyNGO(id, true).then(() => load()).catch(() => null).finally(() => setActioning(null))
  }

  function reject(id: string) {
    setActioning(id)
    adminApi.verifyNGO(id, false).then(() => load()).catch(() => null).finally(() => setActioning(null))
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="NGO Verification"
          subtitle={`${total} pending verification${total !== 1 ? 's' : ''}`}
        />
        <Card padding="none">
          {loading ? (
            <div className="flex h-48 items-center justify-center"><Spinner /></div>
          ) : ngos.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<span className="text-4xl">✅</span>}
                title="No pending NGOs"
                description="All NGOs have been verified"
              />
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {ngos.map(ngo => (
                <div key={ngo.id} className="flex items-start justify-between px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{ngo.org_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reg: {ngo.registration_number}</p>
                    {(ngo.city ?? ngo.state) && (
                      <p className="text-xs text-gray-400">{[ngo.city, ngo.state].filter(Boolean).join(', ')}</p>
                    )}
                    <p className="text-xs text-gray-400">Applied {ngo.created_at ? formatDate(ngo.created_at) : '—'}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" loading={actioning === ngo.id} onClick={() => approve(ngo.id)}>Approve</Button>
                    <Button size="sm" variant="danger" loading={actioning === ngo.id} onClick={() => reject(ngo.id)}>Reject</Button>
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
