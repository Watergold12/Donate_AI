import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DashboardLayout } from '../../components/templates/DashboardLayout'
import { PageHeader } from '../../components/molecules/PageHeader'
import { EmptyState } from '../../components/molecules/EmptyState'
import { Pagination } from '../../components/molecules/Pagination'
import { Modal } from '../../components/molecules/Modal'
import { Card } from '../../components/atoms/Card'
import { Button } from '../../components/atoms/Button'
import { Input } from '../../components/atoms/Input'
import { Select } from '../../components/atoms/Select'
import { Textarea } from '../../components/atoms/Textarea'
import { Badge } from '../../components/atoms/Badge'
import { Spinner } from '../../components/atoms/Spinner'
import { ngosApi } from '../../api/ngos'
import { useToast } from '../../store/ToastProvider'
import type { NGODemand, ItemCategory, DemandUrgency } from '../../types/index'
import { capitalize, formatDate, getApiError } from '../../utils/index'

const CATEGORY_OPTIONS = [
  { value: 'clothing', label: 'Clothing' }, { value: 'food', label: 'Food' },
  { value: 'electronics', label: 'Electronics' }, { value: 'furniture', label: 'Furniture' },
  { value: 'books', label: 'Books' }, { value: 'medical', label: 'Medical' },
  { value: 'toys', label: 'Toys' }, { value: 'other', label: 'Other' },
]
const URGENCY_OPTIONS = [
  { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' },
]
const URGENCY_VARIANTS: Record<string, 'default' | 'info' | 'warning' | 'danger'> = {
  low: 'default', medium: 'info', high: 'warning', critical: 'danger',
}
const schema = z.object({
  item_name: z.string().min(1, 'Required'),
  item_category: z.string().min(1, 'Required'),
  quantity_needed: z.number().int().min(1, 'At least 1'),
  urgency_level: z.string().min(1, 'Required'),
  description: z.string().optional(),
})
type FormData = z.infer<typeof schema>
export function NGODemandsPage() {
  const [demands, setDemands] = useState<NGODemand[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const toast = useToast()

  const { register, handleSubmit: rhfSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { urgency_level: 'medium', quantity_needed: 1 },
  })

  const load = useCallback(() => {
    setLoading(true)
    ngosApi.listDemands(page, 20)
      .then(r => {
        setDemands(r.data.data)
        setPages(r.data.pagination.pages)
        setTotal(r.data.pagination.total)
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [page])

  useEffect(() => { load() }, [load])

  const onSubmit = async (data: FormData) => {
    setSubmitting(true)
    try {
      await ngosApi.createDemand({
        item_name: data.item_name,
        item_category: data.item_category as ItemCategory,
        quantity_needed: data.quantity_needed,
        urgency_level: data.urgency_level as DemandUrgency,
        description: data.description,
      })
      reset(); setShowModal(false); setPage(1); load()
      toast.success('Demand created')
    } catch (err: unknown) {
      toast.error(getApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  function deleteDemand(id: string) {
    setDeleting(id)
    ngosApi.deleteDemand(id)
      .then(() => { load(); toast.success('Demand deleted') })
      .catch(() => toast.error('Failed to delete demand'))
      .finally(() => setDeleting(null))
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Demand Management"
          subtitle={`${total} active demand${total !== 1 ? 's' : ''}`}
          actions={<Button onClick={() => setShowModal(true)}>+ Add Demand</Button>}
        />
        <Card padding="none">
          {loading ? (
            <div className="flex h-48 items-center justify-center"><Spinner /></div>
          ) : demands.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<span className="text-4xl">📋</span>}
                title="No active demands"
                description="Add a demand to start receiving matched donations"
                action={<Button size="sm" onClick={() => setShowModal(true)}>Add Demand</Button>}
              />
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {demands.map(d => (
                <div key={d.id} className="flex items-start justify-between px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium text-white">{d.item_name}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="info">{capitalize(d.item_category)}</Badge>
                      <Badge variant={URGENCY_VARIANTS[d.urgency_level] ?? 'default'}>{capitalize(d.urgency_level)}</Badge>
                      <Badge variant="default">Qty {d.quantity_needed}</Badge>
                    </div>
                    <p className="text-xs text-[#6B7280]">Added {formatDate(d.created_at)}</p>
                  </div>
                  <Button size="sm" variant="danger" loading={deleting === d.id} onClick={() => deleteDemand(d.id)}>
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="border-t border-white/[0.08] px-6">
            <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </div>
        </Card>
      </div>
      <Modal open={showModal} onClose={() => { setShowModal(false); reset() }} title="Add Demand">
        <form onSubmit={rhfSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Input label="Item name" error={errors.item_name?.message} {...register('item_name')} />
          <Select label="Category" options={CATEGORY_OPTIONS} placeholder="Select category" error={errors.item_category?.message} {...register('item_category')} />
          <Input label="Quantity needed" type="number" min={1} error={errors.quantity_needed?.message} {...register('quantity_needed', { valueAsNumber: true })} />
          <Select label="Urgency" options={URGENCY_OPTIONS} error={errors.urgency_level?.message} {...register('urgency_level')} />
          <Textarea label="Description (optional)" {...register('description')} />
          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={submitting}>Create Demand</Button>
            <Button type="button" variant="ghost" onClick={() => { setShowModal(false); reset() }}>Cancel</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
