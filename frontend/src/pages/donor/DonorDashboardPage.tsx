import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '../../components/templates/DashboardLayout'
import { StatusBadge } from '../../components/molecules/StatusBadge'
import { Spinner } from '../../components/atoms/Spinner'
import { analyticsApi } from '../../api/analytics'
import { donationsApi } from '../../api/donations'
import type { DonorSummary } from '../../types/index'
import type { Donation } from '../../types/index'
import { formatDate } from '../../utils/index'
import { useAuthContext } from '../../store/authStore'
export function DonorDashboardPage() {
  const { user } = useAuthContext()
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

  const firstName = user?.full_name?.split(' ')[0] ?? 'there'

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">

        {/* Welcome header */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-[#A1A8B3]">Welcome back</p>
            <h1 className="mt-0.5 text-2xl font-bold text-white">Hi {firstName}</h1>
          </div>
          <Link
            to="/donor/camera"
            className="flex items-center gap-2 rounded-lg bg-[#1D8CF8] px-4 py-2 text-sm font-medium text-white hover:bg-[#3AA0FF] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Donate item
          </Link>
        </div>

        {/* Stat cards — 3 across */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.08] bg-[#171B22] p-5">
            <p className="text-3xl font-bold text-white">{summary?.total_donations ?? 0}</p>
            <p className="mt-1 text-sm text-[#A1A8B3]">Donations</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#171B22] p-5">
            <p className="text-3xl font-bold text-white">{summary?.completed_donations ?? 0}</p>
            <p className="mt-1 text-sm text-[#A1A8B3]">NGOs helped</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#171B22] p-5">
            <p className="text-3xl font-bold text-[#1D8CF8]">
              {summary?.total_donations
                ? `${Math.round((summary.completed_donations / summary.total_donations) * 100)}%`
                : '—'}
            </p>
            <p className="mt-1 text-sm text-[#A1A8B3]">Match accuracy</p>
          </div>
        </div>

        {/* Recent activity */}
        <div>
          <h2 className="mb-3 text-sm font-medium text-[#A1A8B3]">Recent activity</h2>
          <div className="rounded-xl border border-white/[0.08] bg-[#171B22]">
            {donations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm font-medium text-white">No donations yet</p>
                <p className="mt-1 text-xs text-[#A1A8B3]">Start making a difference by creating your first donation</p>
                <Link
                  to="/donor/camera"
                  className="mt-4 rounded-lg bg-[#1D8CF8] px-4 py-2 text-sm font-medium text-white hover:bg-[#3AA0FF] transition-colors"
                >
                  Create Donation
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {donations.map(d => (
                  <div key={d.id} className="flex items-center justify-between px-5 py-3.5">
                    <p className="text-sm text-white">
                      {d.notes
                        ? d.notes
                        : `${d.total_items} item${d.total_items !== 1 ? 's' : ''} donated`}
                    </p>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={d.status} />
                      <span className="text-xs text-[#6B7280]">{formatDate(d.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
