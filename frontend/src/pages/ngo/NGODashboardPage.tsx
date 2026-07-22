import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '../../components/templates/DashboardLayout'
import { PageHeader } from '../../components/molecules/PageHeader'
import { StatCard } from '../../components/molecules/StatCard'
import { StatusBadge } from '../../components/molecules/StatusBadge'
import { EmptyState } from '../../components/molecules/EmptyState'
import { Card } from '../../components/atoms/Card'
import { Button } from '../../components/atoms/Button'
import { Spinner } from '../../components/atoms/Spinner'
import { analyticsApi } from '../../api/analytics'
import { ngosApi } from '../../api/ngos'
import type { NGOSummary, Match } from '../../types/index'
import { scoreToPercent, formatDate } from '../../utils/index'

import { NGOVerificationGuard } from '../../components/organisms/NGOVerificationGuard'

export function NGODashboardPage() {
  const [summary, setSummary] = useState<NGOSummary | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  const loadData = useCallback(() => {
    setLoading(true)
    Promise.all([analyticsApi.summary(), ngosApi.listMatches(1, 5, 'proposed')])
      .then(([s, m]) => {
        setSummary(s.data.data as NGOSummary)
        setMatches(m.data.data)
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadData])

  function accept(id: string) {
    setActing(id)
    ngosApi.acceptMatch(id).then(() => loadData()).catch(() => null).finally(() => setActing(null))
  }

  function reject(id: string) {
    setActing(id)
    ngosApi.rejectMatch(id).then(() => loadData()).catch(() => null).finally(() => setActing(null))
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>
      </DashboardLayout>
    )
  }

  const s = summary

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <NGOVerificationGuard />
        <PageHeader title="NGO Dashboard" subtitle="Manage demands and incoming matches" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title="Total Demands"  value={s?.total_demands     ?? 0} icon={<span>📋</span>} />
          <StatCard title="Active Demands" value={s?.active_demands    ?? 0} icon={<span>✅</span>} />
          <StatCard title="Total Matches"  value={s?.total_matches     ?? 0} icon={<span>🤝</span>} />
          <StatCard title="Accepted"       value={s?.accepted_matches  ?? 0} icon={<span>⭐</span>} />
          <StatCard title="Pickups Done"   value={s?.pickups_completed ?? 0} icon={<span>🚚</span>} />
        </div>
        <Card>
          <h2 className="mb-4 font-semibold text-da-text">Pending Matches</h2>
          {matches.length === 0 ? (
            <EmptyState
              icon={<span className="text-4xl">🤝</span>}
              title="No pending matches"
              description="Matches appear here when donations match your demands"
            />
          ) : (
            <div className="flex flex-col divide-y divide-da-border">
              {matches.map(m => (
                <div key={m.id} className="flex items-center justify-between py-3">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-da-text">Score: {scoreToPercent(m.score)}</span>
                      <StatusBadge status={m.status} />
                    </div>
                    <div className="h-2 w-32 overflow-hidden rounded-full bg-da-border">
                      <div className="h-2 rounded-full bg-da-primary" style={{ width: scoreToPercent(m.score) }} />
                    </div>
                    <p className="text-xs text-da-muted">Expires {formatDate(m.expires_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" loading={acting === m.id} onClick={() => accept(m.id)}>Accept</Button>
                    <Button size="sm" variant="outline" loading={acting === m.id} onClick={() => reject(m.id)}>Reject</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
