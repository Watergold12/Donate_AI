import { useState, useEffect } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DashboardLayout } from '../../components/templates/DashboardLayout'
import { PageHeader } from '../../components/molecules/PageHeader'
import { StatCard } from '../../components/molecules/StatCard'
import { Card } from '../../components/atoms/Card'
import { Spinner } from '../../components/atoms/Spinner'
import { analyticsApi } from '../../api/analytics'
import type { DonorSummary, TrendPoint, CategoryBreakdown } from '../../types/index'
import { capitalize } from '../../utils/index'

export function DonorAnalyticsPage() {
  const [summary, setSummary] = useState<DonorSummary | null>(null)
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [categories, setCategories] = useState<CategoryBreakdown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      analyticsApi.summary(),
      analyticsApi.trend(30),
      analyticsApi.categories(),
    ])
      .then(([s, t, c]) => {
        setSummary(s.data.data as DonorSummary)
        setTrend(t.data.data)
        setCategories(c.data.data)
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader title="My Analytics" subtitle="Your donation impact over time" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Donations"  value={summary?.total_donations    ?? 0} icon={<span>🎁</span>} />
          <StatCard title="Completed"        value={summary?.completed_donations ?? 0} icon={<span>✅</span>} />
          <StatCard title="In Progress"      value={summary?.pending_donations   ?? 0} icon={<span>⏳</span>} />
          <StatCard title="Items Donated"    value={summary?.total_items_donated ?? 0} icon={<span>📦</span>} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Donation trend line chart */}
          <Card>
            <h2 className="mb-4 font-semibold text-white">
              Donation Trend (30 days)
            </h2>
            {trend.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#A1A8B3]">No trend data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#1D8CF8" strokeWidth={2} dot={false} name="Donations" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Category breakdown bar chart */}
          <Card>
            <h2 className="mb-4 font-semibold text-white">
              Items by Category
            </h2>
            {categories.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#A1A8B3]">No category data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={categories.map(c => ({ ...c, category: capitalize(c.category) }))}
                  margin={{ top: 4, right: 8, bottom: 4, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#1D8CF8" name="Items" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
