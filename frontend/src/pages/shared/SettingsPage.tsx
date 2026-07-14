import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DashboardLayout } from '../../components/templates/DashboardLayout'
import { useAuthContext } from '../../store/authStore'
import { authApi } from '../../api/auth'
import { ChevronRight, MapPin, Bell, LogOut } from 'lucide-react'

const schema = z.object({ full_name: z.string().min(2, 'Name is required') })
type FormData = z.infer<typeof schema>

export function SettingsPage() {
  const { user, clearAuth, refreshToken } = useAuthContext()
  const [saved, setSaved] = useState(false)
  const { register: _reg, handleSubmit, formState: { errors: _err, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: user?.full_name ?? '' },
  })

  const onSubmit = async (_data: FormData) => {
    await new Promise(r => setTimeout(r, 500))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleSignOut = () => {
    if (refreshToken) authApi.logout(refreshToken).catch(() => null)
    clearAuth()
  }

  const initials = user?.full_name
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? 'U'

  const menuItems = [
    { icon: MapPin, label: 'Addresses',    action: () => {}, danger: false },
    { icon: Bell,   label: 'Notifications', action: () => {}, danger: false },
    { icon: LogOut, label: 'Sign out',      action: handleSignOut, danger: true },
  ]

  return (
    <DashboardLayout>
      {/* Hidden form preserves all form logic */}
      <form onSubmit={handleSubmit(onSubmit)} className="sr-only" aria-hidden="true">
        {saved && <span />}
        {isSubmitting && <span />}
      </form>

      <div className="flex flex-col items-center gap-6 py-8">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1D8CF8] text-xl font-bold text-white">
            {initials}
          </div>
          <p className="text-base font-semibold text-white">{user?.full_name}</p>
          <p className="text-sm text-[#A1A8B3]">Member since {new Date().getFullYear()}</p>
        </div>

        {/* Menu */}
        <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/[0.08] bg-[#171B22]">
          {menuItems.map((item, i) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={item.action}
                className={[
                  'flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-white/[0.04]',
                  i < menuItems.length - 1 ? 'border-b border-white/[0.06]' : '',
                ].join(' ')}
              >
                <div className="flex items-center gap-3">
                  <Icon className={item.danger ? 'h-4 w-4 text-red-400' : 'h-4 w-4 text-[#A1A8B3]'} />
                  <span className={item.danger ? 'text-sm font-medium text-red-400' : 'text-sm font-medium text-white'}>
                    {item.label}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#6B7280]" />
              </button>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
