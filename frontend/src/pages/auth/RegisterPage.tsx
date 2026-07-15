import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../../components/atoms/Input'
import { Button } from '../../components/atoms/Button'
import { Select } from '../../components/atoms/Select'
import { authApi } from '../../api/auth'
import { useAuth } from '../../hooks/useAuth'

const schema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
  role: z.enum(['donor', 'ngo']),
  org_name: z.string().optional(),
  registration_number: z.string().optional(),
}).refine(d => d.role !== 'ngo' || (d.org_name && d.registration_number), {
  message: 'Organisation name and registration number are required for NGOs',
  path: ['org_name'],
})

type FormData = z.infer<typeof schema>

const roleOptions = [
  { value: 'donor', label: 'Donor' },
  { value: 'ngo',   label: 'NGO Owner' },
]

export function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'donor' },
  })
  const role = watch('role')

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await authApi.register({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        role: data.role,
        org_name: data.org_name,
        registration_number: data.registration_number,
      })
      const user = await login(data.email, data.password)
      if (user.role === 'donor') navigate('/donor')
      else navigate('/ngo')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Registration failed. Please try again.'
      setError(msg)
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0B0F14]">
      {/* Sidebar strip */}
      <aside className="flex w-[132px] flex-shrink-0 flex-col border-r border-white/[0.08] bg-[#11161D]">
        <div className="flex items-center gap-2.5 px-4 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1D8CF8] text-sm font-bold text-white">
            D
          </div>
          <span className="text-sm font-semibold text-white">DonateAI</span>
        </div>
        <nav className="flex-1 py-2 px-2">
          <ul className="flex flex-col gap-0.5">
            {['Home','Scan and catalog','Matches','Tracker','Profile'].map(label => (
              <li key={label}>
                <span className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#A1A8B3]">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-12 items-center justify-between border-b border-white/[0.08] bg-[#0B0F14] px-6">
          <h1 className="text-base font-semibold text-white">Register</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[#A1A8B3] hover:bg-white/[0.06] hover:text-white transition-colors"
            >
              ↪ Sign in
            </button>
            <button
              onClick={() => {
                const html = document.documentElement
                if (html.classList.contains('dark')) {
                  html.classList.remove('dark')
                  html.classList.add('light')
                  localStorage.setItem('theme', 'light')
                } else {
                  html.classList.remove('light')
                  html.classList.add('dark')
                  localStorage.setItem('theme', 'dark')
                }
              }}
              className="rounded-lg p-2 text-[#A1A8B3] hover:bg-white/[0.06] hover:text-white transition-colors"
              title="Toggle light/dark theme"
              aria-label="Toggle theme"
            >
              ⚙
            </button>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#171B22] p-8">
            <h2 className="mb-6 text-xl font-semibold text-white">Create your NGO account</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <Input label="Name" autoComplete="name" error={errors.full_name?.message} {...register('full_name')} />
              <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
              <Input label="Password" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
              <Select label="Role" options={roleOptions} error={errors.role?.message} {...register('role')} />
              {role === 'ngo' && (
                <>
                  <Input label="Organisation name" error={errors.org_name?.message} {...register('org_name')} />
                  <Input label="Registration number" error={errors.registration_number?.message} {...register('registration_number')} />
                </>
              )}
              {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
              <Button type="submit" loading={isSubmitting} className="w-full mt-1">Register</Button>
              <p className="text-center text-sm text-[#A1A8B3]">
                Already have an account?{' '}
                <Link to="/login" className="text-[#1D8CF8] hover:underline">Sign in</Link>
              </p>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
