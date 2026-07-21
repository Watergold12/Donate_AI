import { useState, useEffect } from 'react'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DashboardLayout } from '../../components/templates/DashboardLayout'
import { PageHeader } from '../../components/molecules/PageHeader'
import { StatCard } from '../../components/molecules/StatCard'
import { Card } from '../../components/atoms/Card'
import { Spinner } from '../../components/atoms/Spinner'
import { analyticsApi } from '../../api/analytics'
import type { AdminSummary, TrendPoint, CategoryBreakdown, MatchingRatePoint, PickupStats } from '../../types/index'
import { capitalize } from '../../utils/index'

export function AdminAnalyticsPage() {
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [categories, setCategories] = useState<CategoryBreakdown[]>([])
  const [matchRate, setMatchRate] = useState<MatchingRatePoint[]>([])
  const [pickups, setPickups] = useState<PickupStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      analyticsApi.summary(),
      analyticsApi.trend(30),
      analyticsApi.categories(),
      analyticsApi.matchingRate(30),
      analyticsApi.pickupStats(),
    ]).then(([s, t, c, m, p]) => {
      setSummary(s.data.data as AdminSummary)
      setTrend(t.data.data)
      setCategories(c.data.data)
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
        <PageHeader title="System Analytics" subtitle="Platform-wide metrics" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Total Users"     value={s?.total_users    ?? 0} icon={<span>👥</span>} />
          <StatCard title="Total Donations" value={s?.total_donations ?? 0} icon={<span>📦</span>} />
          <StatCard title="Total Matches"   value={s?.total_matches  ?? 0} icon={<span>🤝</span>} />
          <StatCard title="NGOs"            value={s?.total_ngos     ?? 0} icon={<span>🏢</span>} />
          <StatCard title="Pending Verify"  value={s?.pending_ngo_verifications ?? 0} icon={<span>⏳</span>} />
          <StatCard title="Match Rate"      value={`${Math.round(s?.match_success_rate ?? 0)}%`} icon={<span>📈</span>} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <h2 className="mb-4 font-semibold text-da-text">Donation Trend (30 days)</h2>
            {trend.length === 0 ? <p className="py-8 text-center text-sm text-da-muted">No data yet</p> : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trend} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--da-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--da-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--da-muted)' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--da-card)', borderColor: 'var(--da-border)', color: 'var(--da-text)' }} />
                  <Area type="monotone" dataKey="count" stroke="#1D8CF8" fill="rgba(29,140,248,0.15)" name="Donations" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold text-da-text">Items by Category</h2>
            {categories.length === 0 ? <p className="py-8 text-center text-sm text-da-muted">No data yet</p> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={categories.map(c => ({ ...c, category: capitalize(c.category) }))} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--da-border)" />
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: 'var(--da-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--da-muted)' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--da-card)', borderColor: 'var(--da-border)', color: 'var(--da-text)' }} />
                  <Bar dataKey="count" fill="#1D8CF8" name="Items" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold text-da-text">Match Acceptance Rate (30 days)</h2>
            {matchRate.length === 0 ? <p className="py-8 text-center text-sm text-da-muted">No data yet</p> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={matchRate} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--da-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--da-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--da-muted)' }} allowDecimals={false} unit="%" />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--da-card)', borderColor: 'var(--da-border)', color: 'var(--da-text)' }} />
                  <Line type="monotone" dataKey="rate" stroke="#1D8CF8" strokeWidth={2} dot={false} name="Rate %" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 font-semibold text-da-text">Pickup Statistics</h2>
            <div className="grid grid-cols-3 gap-4">
              <StatCard title="Scheduled"   value={p?.total_scheduled ?? 0} />
              <StatCard title="Completed"   value={p?.completed        ?? 0} />
              <StatCard title="Completion"  value={`${Math.round(p?.completion_rate ?? 0)}%`} />
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
