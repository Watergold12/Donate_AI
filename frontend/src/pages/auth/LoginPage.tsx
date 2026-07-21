import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../../components/atoms/Input'
import { Button } from '../../components/atoms/Button'
import { PasswordInput } from '../../components/atoms/PasswordInput'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../store/ToastProvider'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const user = await login(data.email, data.password)
      toast.success(`Welcome back, ${user.full_name}!`)
      if (user.role === 'donor') navigate('/donor')
      else if (user.role === 'ngo') navigate('/ngo')
      else navigate('/admin')
    } catch {
      toast.error('Invalid email or password')
      setError('Invalid email or password')
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

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-12 items-center justify-between border-b border-da-border bg-da-bg px-6">
          <h1 className="text-base font-semibold text-da-text">Login</h1>
          <div className="flex items-center gap-2">
            <Link to="/register" className="rounded-lg px-3 py-1.5 text-sm text-da-secondary hover:bg-da-border hover:text-da-text transition-colors">
              ↪ Register
            </Link>
          </div>
        </header>

        {/* Centered card */}
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl border border-da-border bg-da-card p-8">
            <h2 className="mb-6 text-xl font-semibold text-da-text">Sign in to DonateAI</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
              <PasswordInput label="Password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
              {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
              <Button type="submit" loading={isSubmitting} className="w-full mt-1">Sign in</Button>
              <p className="text-center text-sm text-da-secondary">
                Don't have an account?{' '}
                <Link to="/register" className="text-da-primary hover:underline">Register</Link>
              </p>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
