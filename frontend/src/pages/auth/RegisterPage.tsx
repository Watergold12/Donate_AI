import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../../components/atoms/Input'
import { Button } from '../../components/atoms/Button'
import { PasswordInput } from '../../components/atoms/PasswordInput'
import { Select } from '../../components/atoms/Select'
import { authApi } from '../../api/auth'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../store/ToastProvider'

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
  const toast = useToast()
  const [error, setError] = useState('')
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'donor' },
  })
  // eslint-disable-next-line react-hooks/incompatible-library
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
      toast.success('Account created successfully!')
      if (user.role === 'donor') navigate('/donor')
      else navigate('/ngo')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Registration failed. Please try again.'
      toast.error(msg)
      setError(msg)
    }
  }

  return (
    <div className="flex min-h-screen bg-da-bg">
      {/* Brand strip — logo only, no navigation */}
      <aside className="hidden w-[132px] flex-shrink-0 flex-col items-center border-r border-da-border bg-da-sidebar pt-6 md:flex">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-da-primary text-lg font-bold text-white">
          D
        </div>
        <span className="mt-2 text-xs font-semibold text-da-secondary">DonateAI</span>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-12 items-center justify-between border-b border-da-border bg-da-bg px-6">
          <h1 className="text-base font-semibold text-da-text">Register</h1>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-da-secondary hover:bg-da-border hover:text-da-text transition-colors"
            >
              ↪ Sign in
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl border border-da-border bg-da-card p-8">
            <h2 className="mb-6 text-xl font-semibold text-da-text">Create your account</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <Input label="Name" autoComplete="name" error={errors.full_name?.message} {...register('full_name')} />
              <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
              <PasswordInput label="Password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
              <Select label="Role" options={roleOptions} error={errors.role?.message} {...register('role')} />
              {role === 'ngo' && (
                <>
                  <Input label="Organisation name" error={errors.org_name?.message} {...register('org_name')} />
                  <Input label="Registration number" error={errors.registration_number?.message} {...register('registration_number')} />
                </>
              )}
              {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
              <Button type="submit" loading={isSubmitting} className="w-full mt-1">Register</Button>
              <p className="text-center text-sm text-da-secondary">
                Already have an account?{' '}
                <Link to="/login" className="text-da-primary hover:underline">Sign in</Link>
              </p>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
