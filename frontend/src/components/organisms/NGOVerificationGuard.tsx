import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ngosApi } from '../../api/ngos'
import type { NGOProfile } from '../../types/index'

interface NGOVerificationGuardProps {
  onStatusLoaded?: (profile: NGOProfile) => void
}

export function NGOVerificationGuard({ onStatusLoaded }: NGOVerificationGuardProps) {
  const [profile, setProfile] = useState<NGOProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ngosApi.getProfile()
      .then(r => {
        if (mounted) {
          setProfile(r.data.data)
          if (onStatusLoaded) onStatusLoaded(r.data.data)
        }
      })
      .catch(() => null)
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [onStatusLoaded])

  if (loading || !profile || profile.is_verified) {
    return null
  }

  const status = profile.verification_status || 'unsubmitted'

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 backdrop-blur-md">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <span className="text-xl">⚠️</span>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amber-200">
              {status === 'pending'
                ? 'Verification Pending Review'
                : status === 'rejected'
                ? 'Verification Application Rejected'
                : 'NGO Verification Required'}
            </h4>
            <p className="mt-1 text-xs text-amber-200/80 leading-relaxed">
              {status === 'pending'
                ? 'Your verification documents have been submitted and are under review by an administrator. Feature access (demands & matches) is temporarily restricted.'
                : status === 'rejected'
                ? `Your verification was rejected: ${profile.rejection_reason || 'Please upload updated registration documentation.'}`
                : 'Your NGO account is unverified. You must upload registration and verification documents to unlock demand creation and matching.'}
            </p>
          </div>
        </div>

        <Link
          to="/ngo/verification"
          className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-semibold text-slate-950 transition-all hover:bg-amber-400 active:scale-95 shadow-md shadow-amber-500/20"
        >
          <span>{status === 'rejected' ? 'Re-submit Documents' : status === 'pending' ? 'View Document Status' : 'Upload Verification Docs'}</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  )
}
