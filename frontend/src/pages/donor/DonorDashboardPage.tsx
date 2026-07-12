import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '../../components/templates/DashboardLayout'
import { PageHeader } from '../../components/molecules/PageHeader'
import { StatCard } from '../../components/molecules/StatCard'
import { StatusBadge } from '../../components/molecules/StatusBadge'
import { EmptyState } from '../../components/molecules/EmptyState'
import { Button } from '../../components/atoms/Button'
import { Card } from '../../components/atoms/Card'
import { Spinner } from '../../components/atoms/Spinner'
import { analyticsApi } from '../../api/analytics'
import { donationsApi } from '../../api/donations'
import type { DonorSummary } from '../../types/index'
import type { Donation } from '../../types/index'
import { formatDate } from '../../utils/index'

export function DonorDashboardPage() {
  const [summary, setSummary] = useState<DonorSummary | null>(null)
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      analyticsApi.summary(),
      donationsApi.listMine(1, 5),
    ]).then(([summaryRes, donationsRes]) => {
      setSummary(summaryRes.data.data as DonorSummary)
      setDonations(donationsRes.data.data)
    }).catch(() => null).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center"><Spinner size="lg" /></div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="My Dashboard"
          subtitle="Track your donations and impact"
          actions={<Link to="/donor/donate"><Button>+ New Donation</Button></Link>}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Donations" value={summary?.total_donations ?? 0} icon={<span>🎁</span>} />
          <StatCard title="Completed" value={summary?.completed_donations ?? 0} icon={<span>✅</span>} />
          <StatCard title="In Progress" value={summary?.pending_donations ?? 0} icon={<span>⏳</span>} />
          <StatCard title="Items Donated" value={summary?.total_items_donated ?? 0} icon={<span>📦</span>} />
        </div>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-white">Recent Donations</h2>
            <Link to="/donor/history" className="text-sm text-green-600 hover:underline">View all</Link>
          </div>
          {donations.length === 0 ? (
            <EmptyState
              icon={<span className="text-4xl">🎁</span>}
              title="No donations yet"
              description="Start making a difference by creating your first donation"
              action={<Link to="/donor/donate"><Button size="sm">Create Donation</Button></Link>}
            />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {donations.map(d => (
                <div key={d.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {d.total_items} item{d.total_items !== 1 ? 's' : ''}
                      {d.notes ? ` — ${d.notes}` : ''}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(d.created_at)}</p>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}
