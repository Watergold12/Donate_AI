import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DashboardLayout } from '../../components/templates/DashboardLayout'
import { PageHeader } from '../../components/molecules/PageHeader'
import { Card } from '../../components/atoms/Card'
import { Button } from '../../components/atoms/Button'
import { Spinner } from '../../components/atoms/Spinner'
import { EmptyState } from '../../components/molecules/EmptyState'
import { donationsApi } from '../../api/donations'
import { pickupsApi } from '../../api/pickups'
import type { Match } from '../../types/index'
import { scoreToPercent, formatDate, getApiError } from '../../utils/index'
import { useAuthContext } from '../../store/authStore'
import { useToast } from '../../store/ToastProvider'

export function PickupSchedulePage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const donationId = params.get('donationId') ?? ''
  const { user } = useAuthContext()
  const toast = useToast()

  const [matches, setMatches]       = useState<Match[]>([])
  const [loading, setLoading]       = useState(true)
  const [scheduling, setScheduling] = useState(false)
  const [error, setError]           = useState('')
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null)
  const [address, setAddress]       = useState(user?.full_name ? '' : '')
  const [city, setCity]             = useState('')
  const [phone, setPhone]           = useState('')
  const [scheduledAt, setScheduledAt] = useState('')

  useEffect(() => {
    if (!donationId) return
    donationsApi.getMatches(donationId)
      .then(r => setMatches(r.data.data))
      .catch(() => setError('Could not load matches. The matching engine may still be processing.'))
      .finally(() => setLoading(false))
  }, [donationId])

  const schedulePickup = async () => {
    if (!address || !city || !scheduledAt) {
      setError('Please fill in all pickup details.')
      return
    }
    const match = matches.find(m => m.id === selectedMatch) || matches[0]
    setScheduling(true)
    setError('')
    try {
      await pickupsApi.create({
        donation_id: donationId,
        ngo_id: match ? match.ngo_id : '74e25e70-52d2-4506-bb72-07b51ed99965',
        match_id: match ? match.id : undefined,
        scheduled_at: new Date(scheduledAt).toISOString(),
        pickup_address: address,
        pickup_city: city,
        contact_phone: phone || undefined,
      })
      toast.success('Pickup scheduled successfully!')
      navigate('/donor/pickups')
    } catch (err: unknown) {
      const msg = getApiError(err)
      setError(msg)
      toast.error(msg)
    } finally {
      setScheduling(false)
    }
  }

  if (!donationId) {
    return (
      <DashboardLayout>
        <EmptyState title="No donation found" description="Please start from the Camera page." />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl flex flex-col gap-6">
        <PageHeader
          title="Schedule Pickup"
          subtitle="Choose an NGO match and set your pickup details"
        />

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
        )}

        {/* Matches */}
        <Card>
          <h2 className="mb-4 text-sm font-medium text-da-secondary">Matched NGOs</h2>
          {loading ? (
            <div className="flex items-center justify-center py-8"><Spinner /></div>
          ) : matches.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-da-text">No matches yet</p>
              <p className="mt-1 text-xs text-da-secondary">
                The AI matching engine is still finding the best NGO for your donation.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setLoading(true)
                  donationsApi.getMatches(donationId)
                    .then(r => setMatches(r.data.data))
                    .catch(() => null)
                    .finally(() => setLoading(false))
                }}
              >
                Refresh matches
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {matches.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMatch(m.id)}
                  className={[
                    'flex items-center justify-between rounded-xl border p-4 text-left transition-colors',
                    selectedMatch === m.id
                      ? 'border-da-primary bg-da-primary/10'
                      : 'border-da-border bg-da-bg hover:border-da-primary/40',
                  ].join(' ')}
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-da-text">NGO Match</p>
                    <p className="text-xs text-da-secondary">Match strength: {scoreToPercent(m.score)}</p>
                    {m.match_explanation && m.match_explanation.length > 0 && (
                      <ul className="mt-1 space-y-1">
                        {m.match_explanation.slice(0, 2).map(reason => (
                          <li key={reason} className="text-[11px] text-da-muted">
                            {reason}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="text-xs text-da-muted">Expires {formatDate(m.expires_at)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-da-border">
                      <div
                        className="h-1.5 rounded-full bg-da-primary"
                        style={{ width: scoreToPercent(m.score) }}
                      />
                    </div>
                    {selectedMatch === m.id && (
                      <span className="text-xs font-medium text-[#1D8CF8]">✓ Selected</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Pickup details */}
        <Card className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-da-secondary">Pickup Details</h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-da-secondary">Pickup Address</label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g. 123 Main Street"
              className="h-10 w-full rounded-lg border border-da-border bg-da-bg px-3 text-sm text-da-text placeholder:text-da-muted focus:border-da-primary focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-da-secondary">City</label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="e.g. Mumbai"
              className="h-10 w-full rounded-lg border border-da-border bg-da-bg px-3 text-sm text-da-text placeholder:text-da-muted focus:border-da-primary focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-da-secondary">Preferred Pickup Date &amp; Time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="h-10 w-full rounded-lg border border-da-border bg-da-bg px-3 text-sm text-da-text focus:border-da-primary focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-da-secondary">Contact Phone (optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="h-10 w-full rounded-lg border border-da-border bg-da-bg px-3 text-sm text-da-text placeholder:text-da-muted focus:border-da-primary focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              loading={scheduling}
              disabled={!address || !city || !scheduledAt}
              onClick={schedulePickup}
              className="flex-1"
            >
              Confirm Pickup
            </Button>
            <Button variant="ghost" onClick={() => navigate('/donor')}>
              Cancel
            </Button>
          </div>
        </Card>

      </div>
    </DashboardLayout>
  )
}
