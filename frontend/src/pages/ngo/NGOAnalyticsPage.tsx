import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DashboardLayout } from '../../components/templates/DashboardLayout'
import { PageHeader } from '../../components/molecules/PageHeader'
import { StatCard } from '../../components/molecules/StatCard'
import { Card } from '../../components/atoms/Card'
import { Spinner } from '../../components/atoms/Spinner'
import { analyticsApi } from '../../api/analytics'
import type { NGOSummary, MatchingRatePoint, PickupStats } from '../../types/index'

export function NGOAnalyticsPage() {
  const [summary, setSummary] = useState<NGOSummary | null>(null)
  const [matchRate, setMatchRate] = useState<MatchingRatePoint[]>([])
  const [pickups, setPickups] = useState<PickupStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      analyticsApi.summary(),
      analyticsApi.matchingRate(30),
      analyticsApi.pickupStats(),
    ]).then(([s, m, p]) => {
      setSummary(s.data.data as NGOSummary)
      setMatchRate(m.data.data)
      setPickups(p.data.data)
    }).catch(() => null).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>
      </DashboardLayout>
    )
  }

  const s = summary
  const p = pickups

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader title="NGO Analytics" subtitle="Your performance metrics" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard title="Total Demands"  value={s?.total_demands     ?? 0} icon={<span>📋</span>} />
          <StatCard title="Active Demands" value={s?.active_demands    ?? 0} icon={<span>✅</span>} />
          <StatCard title="Total Matches"  value={s?.total_matches     ?? 0} icon={<span>🤝</span>} />
          <StatCard title="Accepted"       value={s?.accepted_matches  ?? 0} icon={<span>⭐</span>} />
          <StatCard title="Pickups Done"   value={s?.pickups_completed ?? 0} icon={<span>🚚</span>} />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-4 font-semibold text-da-text">Match Acceptance Rate (30 days)</h2>
            {matchRate.length === 0 ? (
              <p className="py-8 text-center text-sm text-da-muted">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={matchRate} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--da-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--da-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--da-muted)' }} unit="%" allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--da-card)', borderColor: 'var(--da-border)', color: 'var(--da-text)' }} />
                  <Line type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={2} dot={false} name="Rate %" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
          <Card>
            <h2 className="mb-4 font-semibold text-da-text">Pickup Statistics</h2>
            <div className="grid grid-cols-3 gap-4">
              <StatCard title="Scheduled"  value={p?.total_scheduled ?? 0} />
              <StatCard title="Completed"  value={p?.completed ?? 0} />
              <StatCard title="Rate"       value={`${Math.round(p?.completion_rate ?? 0)}%`} />
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
