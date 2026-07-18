import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../../components/atoms/Input'
import { Button } from '../../components/atoms/Button'
import { PasswordInput } from '../../components/atoms/PasswordInput'
import { useAuth } from '../../hooks/useAuth'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      const user = await login(data.email, data.password)
      if (user.role === 'donor') navigate('/donor')
      else if (user.role === 'ngo') navigate('/ngo')
      else navigate('/admin')
    } catch {
      setError('Invalid email or password')
    }
  }

  return (
    <div className="flex min-h-screen bg-[#0B0F14]">
      {/* Brand strip — logo only, no navigation */}
      <aside className="hidden w-[132px] flex-shrink-0 flex-col items-center border-r border-white/[0.08] bg-[#11161D] pt-6 md:flex">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1D8CF8] text-lg font-bold text-white">
          D
        </div>
        <span className="mt-2 text-xs font-semibold text-[#A1A8B3]">DonateAI</span>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-12 items-center justify-between border-b border-white/[0.08] bg-[#0B0F14] px-6">
          <h1 className="text-base font-semibold text-white">Login</h1>
          <div className="flex items-center gap-2">
            <Link to="/register" className="rounded-lg px-3 py-1.5 text-sm text-[#A1A8B3] hover:bg-white/[0.06] hover:text-white transition-colors">
              ↪ Register
            </Link>
          </div>
        </header>

        {/* Centered card */}
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#171B22] p-8">
            <h2 className="mb-6 text-xl font-semibold text-white">Sign in to DonateAI</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
              <PasswordInput label="Password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
              {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}
              <Button type="submit" loading={isSubmitting} className="w-full mt-1">Sign in</Button>
              <p className="text-center text-sm text-[#A1A8B3]">
                Don't have an account?{' '}
                <Link to="/register" className="text-[#1D8CF8] hover:underline">Register</Link>
              </p>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
