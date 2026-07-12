import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DashboardLayout } from '../../components/templates/DashboardLayout'
import { PageHeader } from '../../components/molecules/PageHeader'
import { Modal } from '../../components/molecules/Modal'
import { Card } from '../../components/atoms/Card'
import { Button } from '../../components/atoms/Button'
import { Input } from '../../components/atoms/Input'
import { Select } from '../../components/atoms/Select'
import { Textarea } from '../../components/atoms/Textarea'
import { Badge } from '../../components/atoms/Badge'
import { donationsApi } from '../../api/donations'
import type { Donation, ItemCategory, ItemCondition } from '../../types/index'
import { capitalize } from '../../utils/index'

const CATEGORY_OPTIONS = [
  { value: 'clothing', label: 'Clothing' }, { value: 'food', label: 'Food' },
  { value: 'electronics', label: 'Electronics' }, { value: 'furniture', label: 'Furniture' },
  { value: 'books', label: 'Books' }, { value: 'medical', label: 'Medical' },
  { value: 'toys', label: 'Toys' }, { value: 'other', label: 'Other' },
]
const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' }, { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' }, { value: 'poor', label: 'Poor' },
]
const schema = z.object({
  item_name: z.string().min(1, 'Required'),
  category: z.string().min(1, 'Required'),
  quantity: z.number().int().min(1, 'At least 1'),
  condition: z.string().min(1, 'Required'),
})
type ItemFormData = z.infer<typeof schema>
type Step = 'create' | 'items' | 'done'

export function DonationPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('create')
  const [donation, setDonation] = useState<Donation | null>(null)
  const [notes, setNotes] = useState('')
  const [creating, setCreating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [addingItem, setAddingItem] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit: rhfSubmit, reset, formState: { errors } } = useForm<ItemFormData>({
    resolver: zodResolver(schema),
    defaultValues: { condition: 'good', quantity: 1 },
  })

  function createDonation() {
    setCreating(true); setError('')
    donationsApi.create(notes || undefined)
      .then(r => { setDonation(r.data.data); setStep('items') })
      .catch(() => setError('Failed to create donation.'))
      .finally(() => setCreating(false))
  }

  const addItem = async (data: ItemFormData) => {
    if (!donation) return
    setAddingItem(true)
    try {
      const r = await donationsApi.addItem(donation.id, {
        item_name: data.item_name,
        category: data.category as ItemCategory,
        quantity: data.quantity,
        condition: data.condition as ItemCondition,
      })
      setDonation(prev => prev ? { ...prev, items: [...prev.items, r.data.data], total_items: prev.total_items + data.quantity } : prev)
      reset(); setShowModal(false)
    } catch { setError('Failed to add item.') }
    finally { setAddingItem(false) }
  }
  function removeItem(itemId: string, qty: number) {
    if (!donation) return
    donationsApi.removeItem(donation.id, itemId)
      .then(() => setDonation(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== itemId), total_items: Math.max(0, prev.total_items - qty) } : prev))
      .catch(() => setError('Failed to remove item.'))
  }

  function submitDonation() {
    if (!donation) return
    setSubmitting(true)
    donationsApi.submit(donation.id)
      .then(() => setStep('done'))
      .catch(() => setError('Submission failed. Add at least one item first.'))
      .finally(() => setSubmitting(false))
  }

  function cancelDonation() {
    if (!donation) return
    donationsApi.cancel(donation.id)
      .then(() => navigate('/donor'))
      .catch(() => setError('Failed to cancel.'))
  }

  if (step === 'done') {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <span className="text-6xl">🎉</span>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Donation submitted!</h1>
          <p className="text-gray-500">Our AI matching engine is finding the best NGO for your items.</p>
          <Button onClick={() => navigate('/donor')}>Back to Dashboard</Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title={step === 'create' ? 'New Donation' : 'Manage Items'}
          subtitle={step === 'create' ? 'Describe your donation' : `${donation?.total_items ?? 0} item(s) added`}
        />
        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20">{error}</p>}

        {step === 'create' && (
          <Card className="mt-6 flex flex-col gap-4">
            <Textarea label="Notes (optional)" placeholder="Any special instructions..." value={notes} onChange={e => setNotes(e.target.value)} />
            <div className="flex gap-3">
              <Button loading={creating} onClick={createDonation}>Create Donation</Button>
              <Button variant="ghost" onClick={() => navigate('/donor')}>Back</Button>
            </div>
          </Card>
        )}

        {step === 'items' && donation && (
          <div className="mt-6 flex flex-col gap-4">
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900 dark:text-white">Items ({donation.total_items})</h2>
                <Button size="sm" onClick={() => setShowModal(true)}>+ Add Item</Button>
              </div>
              {donation.items.filter(i => i.is_confirmed).length === 0 ? (
                <p className="text-sm text-gray-500">No items yet — click Add Item to start.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {donation.items.filter(i => i.is_confirmed).map(item => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-800">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{item.item_name}</span>
                        <div className="flex gap-2">
                          <Badge variant="info">{capitalize(item.category)}</Badge>
                          <Badge variant="default">×{item.quantity}</Badge>
                          <Badge variant="default">{capitalize(item.condition)}</Badge>
                        </div>
                      </div>
                      <button onClick={() => removeItem(item.id, item.quantity)} className="text-sm text-red-500 hover:text-red-700">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <div className="flex gap-3">
              <Button loading={submitting} disabled={donation.total_items === 0} onClick={submitDonation}>Submit for Matching</Button>
              <Button variant="danger" onClick={cancelDonation}>Cancel</Button>
            </div>
          </div>
        )}

        <Modal open={showModal} onClose={() => { setShowModal(false); reset() }} title="Add Item">
          <form onSubmit={rhfSubmit(addItem)} className="flex flex-col gap-4" noValidate>
            <Input label="Item name" placeholder="e.g. Winter jacket" error={errors.item_name?.message} {...register('item_name')} />
            <Select label="Category" options={CATEGORY_OPTIONS} placeholder="Select category" error={errors.category?.message} {...register('category')} />
            <Input label="Quantity" type="number" min={1} error={errors.quantity?.message} {...register('quantity', { valueAsNumber: true })} />
            <Select label="Condition" options={CONDITION_OPTIONS} error={errors.condition?.message} {...register('condition')} />
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={addingItem}>Add Item</Button>
              <Button type="button" variant="ghost" onClick={() => { setShowModal(false); reset() }}>Cancel</Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
