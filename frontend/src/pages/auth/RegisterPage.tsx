import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthLayout } from '../../components/templates/AuthLayout'
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
  { value: 'donor', label: 'Donor — I want to donate items' },
  { value: 'ngo',   label: 'NGO — I represent an organisation' },
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
    <AuthLayout title="Create account" subtitle="Join the donation network">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <Input label="Full name" autoComplete="name" error={errors.full_name?.message} {...register('full_name')} />
        <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
        <Select label="I am a" options={roleOptions} error={errors.role?.message} {...register('role')} />
        {role === 'ngo' && (
          <>
            <Input label="Organisation name" error={errors.org_name?.message} {...register('org_name')} />
            <Input label="Registration number" error={errors.registration_number?.message} {...register('registration_number')} />
          </>
        )}
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20">{error}</p>}
        <Button type="submit" loading={isSubmitting} className="w-full mt-2">Create account</Button>
        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-green-600 hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  )
}
