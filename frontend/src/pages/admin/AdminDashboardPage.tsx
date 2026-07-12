import { useState, useEffect } from 'react'
import { DashboardLayout } from '../../components/templates/DashboardLayout'
import { PageHeader } from '../../components/molecules/PageHeader'
import { StatCard } from '../../components/molecules/StatCard'
import { Card } from '../../components/atoms/Card'
import { Button } from '../../components/atoms/Button'
import { Spinner } from '../../components/atoms/Spinner'
import { adminApi } from '../../api/admin'
import type { AdminSummary } from '../../types/index'

export function AdminDashboardPage() {
  const [summary, setSummary] = useState<AdminSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)
  const [triggerMsg, setTriggerMsg] = useState<string | null>(null)

  useEffect(() => {
    adminApi.analytics()
      .then(r => setSummary(r.data.data as AdminSummary))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  function triggerMatching() {
    setTriggering(true)
    adminApi.triggerMatching()
      .then(r => {
        setTriggerMsg(r.data.message)
        setTimeout(() => setTriggerMsg(null), 4000)
      })
      .catch(() => null)
      .finally(() => setTriggering(false))
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
        <PageHeader
          title="Admin Dashboard"
          subtitle="System-wide overview"
          actions={
            <Button loading={triggering} onClick={triggerMatching} variant="secondary">
              ⚡ Trigger Matching
            </Button>
          }
        />
        {triggerMsg && (
          <p className="rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
            ✓ {triggerMsg}
          </p>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Users"     value={s?.total_users              ?? 0} icon={<span>👥</span>} />
          <StatCard title="Donors"          value={s?.total_donors             ?? 0} icon={<span>🎁</span>} />
          <StatCard title="NGOs"            value={s?.total_ngos               ?? 0} icon={<span>🏢</span>} />
          <StatCard title="Pending Verify"  value={s?.pending_ngo_verifications ?? 0} icon={<span>⏳</span>} />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title="Total Donations" value={s?.total_donations ?? 0} icon={<span>📦</span>} />
          <StatCard title="Total Matches"   value={s?.total_matches  ?? 0} icon={<span>🤝</span>} />
          <StatCard title="Match Rate"      value={`${Math.round(s?.match_success_rate ?? 0)}%`} icon={<span>📈</span>} />
        </div>
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Use the sidebar to manage users, verify NGOs, and view detailed analytics.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  )
}
