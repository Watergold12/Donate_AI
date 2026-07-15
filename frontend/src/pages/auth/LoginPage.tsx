import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '../../components/atoms/Input'
import { Button } from '../../components/atoms/Button'
import { useAuth } from '../../hooks/useAuth'
import { Sidebar } from '../../components/organisms/Sidebar'

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
      {/* Sidebar-style left panel matching the screenshot */}
      <aside className="flex w-[132px] flex-shrink-0 flex-col border-r border-white/[0.08] bg-[#11161D]">
        <Sidebar role="donor" />
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        {/* Topbar */}
        <header className="flex h-12 items-center justify-between border-b border-white/[0.08] bg-[#0B0F14] px-6">
          <h1 className="text-base font-semibold text-white">Login</h1>
          <div className="flex items-center gap-2">
            <button className="rounded-lg px-3 py-1.5 text-sm text-[#A1A8B3] hover:bg-white/[0.06]">
              ↪ Sign in
            </button>
            <button className="rounded-lg p-2 text-[#A1A8B3] hover:bg-white/[0.06]">⚙</button>
          </div>
        </header>

        {/* Centered card */}
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#171B22] p-8">
            <h2 className="mb-6 text-xl font-semibold text-white">Sign in to DonateAI</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
              <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
              <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
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
