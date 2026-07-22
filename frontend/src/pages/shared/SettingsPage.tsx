import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DashboardLayout } from '../../components/templates/DashboardLayout'
import { Card } from '../../components/atoms/Card'
import { Input } from '../../components/atoms/Input'
import { Textarea } from '../../components/atoms/Textarea'
import { Button } from '../../components/atoms/Button'
import { Badge } from '../../components/atoms/Badge'
import { Spinner } from '../../components/atoms/Spinner'
import { useAuthContext } from '../../store/authStore'
import { authApi } from '../../api/auth'
import { donorsApi } from '../../api/donors'
import { ngosApi } from '../../api/ngos'
import { LogOut, Save, User as UserIcon, Building2, MapPin, ShieldCheck, Globe2 } from 'lucide-react'
import { useToast } from '../../store/ToastProvider'

/* ── Schemas ─────────────────────────────────────────────── */

const accountSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
})
type AccountForm = z.infer<typeof accountSchema>

const donorSchema = z.object({
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
})
type DonorForm = z.infer<typeof donorSchema>

const ngoSchema = z.object({
  org_name: z.string().min(1, 'Organisation name required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  contact_phone: z.string().optional(),
  website: z.string().optional(),
  description: z.string().optional(),
})
type NGOForm = z.infer<typeof ngoSchema>

/* ── Tabs ────────────────────────────────────────────────── */

type Tab = 'account' | 'details'

const TAB_ITEMS: { key: Tab; icon: typeof UserIcon; label: string }[] = [
  { key: 'account', icon: UserIcon, label: 'Account' },
  { key: 'details', icon: MapPin, label: 'Details' },
]

/* ── Main Component ──────────────────────────────────────── */

export function SettingsPage() {
  const { user, clearAuth, refreshToken, setUser } = useAuthContext()
  const [tab, setTab] = useState<Tab>('account')
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [profileReady, setProfileReady] = useState(false)
  const toast = useToast()

  /* ── Account form ───────────────────────────────────────── */
  const {
    register: regAccount,
    handleSubmit: handleAccount,
    formState: { errors: errAccount, isSubmitting: savingAccount },
  } = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: { full_name: user?.full_name ?? '' },
  })

  const saveAccount = async (data: AccountForm) => {
    try {
      const res = await authApi.updateMe({ full_name: data.full_name })
      if (res.data.data) setUser(res.data.data)
      toast.success('Account details saved')
    } catch {
      toast.error('Failed to save account details')
    }
  }

  /* ── Donor form ─────────────────────────────────────────── */
  const {
    register: regDonor,
    handleSubmit: handleDonor,
    reset: resetDonor,
    formState: { errors: errDonor, isSubmitting: savingDonor },
  } = useForm<DonorForm>({
    resolver: zodResolver(donorSchema),
  })

  const saveDonor = async (data: DonorForm) => {
    try {
      await donorsApi.updateProfile(data)
      toast.success('Address details saved')
    } catch {
      toast.error('Failed to save details')
    }
  }

  /* ── NGO form ───────────────────────────────────────────── */
  const {
    register: regNgo,
    handleSubmit: handleNgo,
    reset: resetNgo,
    formState: { errors: errNgo, isSubmitting: savingNgo },
  } = useForm<NGOForm>({
    resolver: zodResolver(ngoSchema),
  })

  const saveNgo = async (data: NGOForm) => {
    try {
      await ngosApi.updateProfile(data)
      toast.success('Organisation details saved')
    } catch {
      toast.error('Failed to save details')
    }
  }

  /* ── Load role-specific profile on mount ────────────────── */
  useEffect(() => {
    let isMounted = true

    const loadProfile = async () => {
      if (!user) {
        if (isMounted) setProfileReady(false)
        return
      }

      try {
        if (user.role === 'donor') {
          const response = await donorsApi.getProfile()
          if (!isMounted) return
          resetDonor({
            phone: response.data.data.phone ?? '',
            address: response.data.data.address ?? '',
            city: response.data.data.city ?? '',
            state: response.data.data.state ?? '',
            pincode: response.data.data.pincode ?? '',
          })
        } else if (user.role === 'ngo') {
          const response = await ngosApi.getProfile()
          if (!isMounted) return
          resetNgo({
            org_name: response.data.data.org_name ?? '',
            address: response.data.data.address ?? '',
            city: response.data.data.city ?? '',
            state: response.data.data.state ?? '',
            pincode: response.data.data.pincode ?? '',
            contact_phone: response.data.data.contact_phone ?? '',
            website: response.data.data.website ?? '',
            description: response.data.data.description ?? '',
          })
        }
      } catch {
        if (isMounted) toast.error('Unable to load profile details right now')
      } finally {
        if (isMounted) {
          setLoadingProfile(false)
          setProfileReady(true)
        }
      }
    }

    const timer = window.setTimeout(() => {
      void loadProfile()
    }, 0)

    return () => {
      isMounted = false
      window.clearTimeout(timer)
    }
  }, [user, resetDonor, resetNgo, toast])

  /* ── Sign out ───────────────────────────────────────────── */
  const handleSignOut = () => {
    if (refreshToken) authApi.logout(refreshToken).catch(() => null)
    clearAuth()
  }

  /* ── Avatar initials ────────────────────────────────────── */
  const initials = user?.full_name
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'U'

  const roleBadgeVariant = user?.role === 'donor' ? 'info' : user?.role === 'ngo' ? 'purple' : 'warning'
  const profileSummary = useMemo(() => {
    if (user?.role === 'donor') return 'Keep your contact details up to date so pickups and follow-ups are smoother.'
    if (user?.role === 'ngo') return 'Share accurate organisation details so donors can trust and reach your team.'
    return 'Manage your account information and access for the platform.'
  }, [user?.role])

  return (
    <DashboardLayout>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-6">
        {/* Header with avatar */}
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1D8CF8] text-xl font-bold text-white shadow-lg shadow-[#1D8CF8]/20">
            {initials}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-da-text">{user?.full_name}</h1>
              <Badge variant={roleBadgeVariant}>{user?.role?.toUpperCase()}</Badge>
            </div>
            <p className="text-sm text-da-secondary">{user?.email}</p>
            <p className="text-sm text-da-muted">{profileSummary}</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 rounded-xl border border-da-border bg-da-card p-1">
          {TAB_ITEMS.map(t => {
            const Icon = t.icon
            const active = tab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={[
                  'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-[#1D8CF8] text-white shadow-md shadow-[#1D8CF8]/20'
                    : 'text-da-secondary hover:bg-da-border hover:text-da-text',
                ].join(' ')}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* ── Account Tab ────────────────────────────────── */}
        {tab === 'account' && (
          <Card>
            <form onSubmit={handleAccount(saveAccount)} className="flex flex-col gap-5">
              <div className="flex items-center gap-2 border-b border-da-border pb-4">
                <UserIcon className="h-5 w-5 text-[#1D8CF8]" />
                <h2 className="text-base font-semibold text-da-text">Account Information</h2>
              </div>

              <div className="rounded-lg border border-da-border bg-da-bg/60 p-3 text-sm text-da-secondary">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#1D8CF8]" />
                  <span>Keep your display name and account contact details aligned with your identity.</span>
                </div>
              </div>

              <Input
                label="Full Name"
                placeholder="Your full name"
                error={errAccount.full_name?.message}
                {...regAccount('full_name')}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-da-secondary">Email</label>
                <div className="flex h-10 items-center rounded-lg border border-da-border bg-da-bg px-3 text-sm text-da-muted">
                  {user?.email}
                </div>
                <p className="text-xs text-da-muted">Email cannot be changed</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-da-secondary">Role</label>
                <div className="flex h-10 items-center rounded-lg border border-da-border bg-da-bg px-3 text-sm text-da-muted">
                  {user?.role === 'donor' ? 'Donor' : user?.role === 'ngo' ? 'NGO' : 'Admin'}
                </div>
              </div>

              <div className="flex justify-end border-t border-da-border pt-4">
                <Button type="submit" loading={savingAccount}>
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* ── Details Tab ────────────────────────────────── */}
        {tab === 'details' && (
          <Card>
            {loadingProfile ? (
              <div className="flex h-48 items-center justify-center"><Spinner /></div>
            ) : !profileReady ? (
              <div className="flex h-48 items-center justify-center text-sm text-da-muted">Preparing your profile…</div>
            ) : user?.role === 'donor' ? (
              /* ─── Donor Details ─────────────────────────── */
              <form onSubmit={handleDonor(saveDonor)} className="flex flex-col gap-5">
                <div className="flex items-center gap-2 border-b border-da-border pb-4">
                  <MapPin className="h-5 w-5 text-[#1D8CF8]" />
                  <h2 className="text-base font-semibold text-da-text">Address &amp; Contact</h2>
                </div>

                <div className="rounded-lg border border-da-border bg-da-bg/60 p-3 text-sm text-da-secondary">
                  <div className="flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-[#1D8CF8]" />
                    <span>These details help donors and NGOs coordinate pickups and drop-offs without confusion.</span>
                  </div>
                </div>

                <Input
                  label="Phone"
                  placeholder="+91 XXXXX XXXXX"
                  error={errDonor.phone?.message}
                  {...regDonor('phone')}
                />

                <Input
                  label="Address"
                  placeholder="House / Street"
                  error={errDonor.address?.message}
                  {...regDonor('address')}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Input
                    label="City"
                    placeholder="Enter City"
                    error={errDonor.city?.message}
                    {...regDonor('city')}
                  />
                  <Input
                    label="State"
                    placeholder="Enter State"
                    error={errDonor.state?.message}
                    {...regDonor('state')}
                  />
                  <Input
                    label="PIN Code"
                    placeholder="Enter PIN Code"
                    error={errDonor.pincode?.message}
                    {...regDonor('pincode')}
                  />
                </div>

                <div className="flex justify-end border-t border-da-border pt-4">
                  <Button type="submit" loading={savingDonor}>
                    <Save className="h-4 w-4" />
                    Save Details
                  </Button>
                </div>
              </form>
            ) : user?.role === 'ngo' ? (
              /* ─── NGO Details ──────────────────────────── */
              <form onSubmit={handleNgo(saveNgo)} className="flex flex-col gap-5">
                <div className="flex items-center gap-2 border-b border-da-border pb-4">
                  <Building2 className="h-5 w-5 text-[#1D8CF8]" />
                  <h2 className="text-base font-semibold text-da-text">Organisation Details</h2>
                </div>

                <div className="rounded-lg border border-da-border bg-da-bg/60 p-3 text-sm text-da-secondary">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#1D8CF8]" />
                    <span>Accurate organisation details help donors discover and trust your cause.</span>
                  </div>
                </div>

                <Input
                  label="Organisation Name"
                  placeholder="My NGO"
                  error={errNgo.org_name?.message}
                  {...regNgo('org_name')}
                />

                <Input
                  label="Contact Phone"
                  placeholder="+91 98765 43210"
                  error={errNgo.contact_phone?.message}
                  {...regNgo('contact_phone')}
                />

                <Input
                  label="Website"
                  placeholder="https://myorg.org"
                  error={errNgo.website?.message}
                  {...regNgo('website')}
                />

                <Input
                  label="Address"
                  placeholder="Office address"
                  error={errNgo.address?.message}
                  {...regNgo('address')}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Input
                    label="City"
                    placeholder="Mumbai"
                    error={errNgo.city?.message}
                    {...regNgo('city')}
                  />
                  <Input
                    label="State"
                    placeholder="Maharashtra"
                    error={errNgo.state?.message}
                    {...regNgo('state')}
                  />
                  <Input
                    label="PIN Code"
                    placeholder="400001"
                    error={errNgo.pincode?.message}
                    {...regNgo('pincode')}
                  />
                </div>

                <Textarea
                  label="Description"
                  placeholder="Tell donors what your organisation does..."
                  error={errNgo.description?.message}
                  {...regNgo('description')}
                />

                <div className="flex justify-end border-t border-da-border pt-4">
                  <Button type="submit" loading={savingNgo}>
                    <Save className="h-4 w-4" />
                    Save Details
                  </Button>
                </div>
              </form>
            ) : (
              /* ─── Admin — no profile to edit ───────────── */
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <p className="text-sm text-da-secondary">Admin accounts do not have profile details to edit.</p>
              </div>
            )}
          </Card>
        )}

        {/* Sign out card */}
        <Card>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 text-left transition-colors hover:opacity-80"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10">
              <LogOut className="h-4 w-4 text-red-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-red-400">Sign Out</span>
              <span className="text-xs text-da-muted">End your session on this device</span>
            </div>
          </button>
        </Card>
      </div>
    </DashboardLayout>
  )
}
