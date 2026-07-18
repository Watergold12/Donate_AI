import { useState, useEffect } from 'react'
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
import { LogOut, Save, User as UserIcon, Building2, MapPin } from 'lucide-react'

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

/* ── Toast Component ─────────────────────────────────────── */

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-[slideUp_0.3s_ease] rounded-xl border border-[#22C55E]/20 bg-[#22C55E]/10 px-5 py-3 text-sm font-medium text-[#22C55E] shadow-lg backdrop-blur-md">
      ✓ {message}
    </div>
  )
}

/* ── Main Component ──────────────────────────────────────── */

export function SettingsPage() {
  const { user, clearAuth, refreshToken, setUser } = useAuthContext()
  const [tab, setTab] = useState<Tab>('account')
  const [toast, setToast] = useState<string | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)

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
      setToast('Account details saved')
    } catch {
      setToast('Failed to save account details')
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
      setToast('Address details saved')
    } catch {
      setToast('Failed to save details')
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
      setToast('Organisation details saved')
    } catch {
      setToast('Failed to save details')
    }
  }

  /* ── Load role-specific profile on mount ────────────────── */
  useEffect(() => {
    if (!user) return
    setLoadingProfile(true)
    if (user.role === 'donor') {
      donorsApi.getProfile()
        .then(r => {
          resetDonor({
            phone: r.data.data.phone ?? '',
            address: r.data.data.address ?? '',
            city: r.data.data.city ?? '',
            state: r.data.data.state ?? '',
            pincode: r.data.data.pincode ?? '',
          })
        })
        .catch(() => null)
        .finally(() => setLoadingProfile(false))
    } else if (user.role === 'ngo') {
      ngosApi.getProfile()
        .then(r => {
          resetNgo({
            org_name: r.data.data.org_name ?? '',
            address: r.data.data.address ?? '',
            city: r.data.data.city ?? '',
            state: r.data.data.state ?? '',
            pincode: r.data.data.pincode ?? '',
            contact_phone: r.data.data.contact_phone ?? '',
            website: r.data.data.website ?? '',
            description: r.data.data.description ?? '',
          })
        })
        .catch(() => null)
        .finally(() => setLoadingProfile(false))
    } else {
      setLoadingProfile(false)
    }
  }, [user, resetDonor, resetNgo])

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
              <h1 className="text-xl font-bold text-white">{user?.full_name}</h1>
              <Badge variant={roleBadgeVariant}>{user?.role?.toUpperCase()}</Badge>
            </div>
            <p className="text-sm text-[#A1A8B3]">{user?.email}</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 rounded-xl border border-white/[0.08] bg-da-card p-1">
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
                    : 'text-[#A1A8B3] hover:bg-white/[0.04] hover:text-white',
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
              <div className="flex items-center gap-2 border-b border-white/[0.06] pb-4">
                <UserIcon className="h-5 w-5 text-[#1D8CF8]" />
                <h2 className="text-base font-semibold text-white">Account Information</h2>
              </div>

              <Input
                label="Full Name"
                placeholder="Your full name"
                error={errAccount.full_name?.message}
                {...regAccount('full_name')}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-da-secondary">Email</label>
                <div className="flex h-10 items-center rounded-lg border border-white/10 bg-[#0B0F14]/50 px-3 text-sm text-[#6B7280]">
                  {user?.email}
                </div>
                <p className="text-xs text-da-muted">Email cannot be changed</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-da-secondary">Role</label>
                <div className="flex h-10 items-center rounded-lg border border-white/10 bg-[#0B0F14]/50 px-3 text-sm text-[#6B7280]">
                  {user?.role === 'donor' ? 'Donor' : user?.role === 'ngo' ? 'NGO' : 'Admin'}
                </div>
              </div>

              <div className="flex justify-end border-t border-white/[0.06] pt-4">
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
            ) : user?.role === 'donor' ? (
              /* ─── Donor Details ─────────────────────────── */
              <form onSubmit={handleDonor(saveDonor)} className="flex flex-col gap-5">
                <div className="flex items-center gap-2 border-b border-white/[0.06] pb-4">
                  <MapPin className="h-5 w-5 text-[#1D8CF8]" />
                  <h2 className="text-base font-semibold text-white">Address &amp; Contact</h2>
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

                <div className="flex justify-end border-t border-white/[0.06] pt-4">
                  <Button type="submit" loading={savingDonor}>
                    <Save className="h-4 w-4" />
                    Save Details
                  </Button>
                </div>
              </form>
            ) : user?.role === 'ngo' ? (
              /* ─── NGO Details ──────────────────────────── */
              <form onSubmit={handleNgo(saveNgo)} className="flex flex-col gap-5">
                <div className="flex items-center gap-2 border-b border-white/[0.06] pb-4">
                  <Building2 className="h-5 w-5 text-[#1D8CF8]" />
                  <h2 className="text-base font-semibold text-white">Organisation Details</h2>
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

                <div className="flex justify-end border-t border-white/[0.06] pt-4">
                  <Button type="submit" loading={savingNgo}>
                    <Save className="h-4 w-4" />
                    Save Details
                  </Button>
                </div>
              </form>
            ) : (
              /* ─── Admin — no profile to edit ───────────── */
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <p className="text-sm text-[#A1A8B3]">Admin accounts do not have profile details to edit.</p>
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
              <span className="text-xs text-[#6B7280]">End your session on this device</span>
            </div>
          </button>
        </Card>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </DashboardLayout>
  )
}
