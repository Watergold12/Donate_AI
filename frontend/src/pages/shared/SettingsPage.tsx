import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DashboardLayout } from '../../components/templates/DashboardLayout'
import { PageHeader } from '../../components/molecules/PageHeader'
import { Card } from '../../components/atoms/Card'
import { Input } from '../../components/atoms/Input'
import { Button } from '../../components/atoms/Button'
import { useAuthContext } from '../../store/authStore'

const schema = z.object({ full_name: z.string().min(2, 'Name is required') })
type FormData = z.infer<typeof schema>

export function SettingsPage() {
  const { user } = useAuthContext()
  const [saved, setSaved] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: user?.full_name ?? '' },
  })

  const onSubmit = async (_data: FormData) => {
    await new Promise(r => setTimeout(r, 500))
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader title="Settings" subtitle="Manage your account preferences" />
        <Card className="max-w-lg">
          <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Profile</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Full name" error={errors.full_name?.message} {...register('full_name')} />
            <Input label="Email" value={user?.email ?? ''} disabled />
            <Input label="Role" value={user?.role ?? ''} disabled />
            {saved && <p className="text-sm text-green-600">Changes saved!</p>}
            <Button type="submit" loading={isSubmitting} className="self-start">Save changes</Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  )
}
