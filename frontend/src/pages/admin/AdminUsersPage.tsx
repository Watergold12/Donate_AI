import { useState, useEffect, useCallback } from 'react'
import { DashboardLayout } from '../../components/templates/DashboardLayout'
import { PageHeader } from '../../components/molecules/PageHeader'
import { EmptyState } from '../../components/molecules/EmptyState'
import { Pagination } from '../../components/molecules/Pagination'
import { Card } from '../../components/atoms/Card'
import { Button } from '../../components/atoms/Button'
import { Badge } from '../../components/atoms/Badge'
import { Select } from '../../components/atoms/Select'
import { Spinner } from '../../components/atoms/Spinner'
import { adminApi } from '../../api/admin'
import type { User, UserRole } from '../../types/index'
import { capitalize, formatDate } from '../../utils/index'

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'donor', label: 'Donor' },
  { value: 'ngo', label: 'NGO' },
  { value: 'admin', label: 'Admin' },
]

const ROLE_VARIANTS: Record<string, 'default' | 'info' | 'purple' | 'warning'> = {
  donor: 'info', ngo: 'purple', admin: 'warning',
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [toggling, setToggling] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    adminApi.listUsers(page, 20, roleFilter as UserRole || undefined)
      .then(r => {
        setUsers(r.data.data)
        setPages(r.data.pagination.pages)
        setTotal(r.data.pagination.total)
      })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [page, roleFilter])

  useEffect(() => { load() }, [load])

  function toggleStatus(user: User) {
    setToggling(user.id)
    adminApi.setUserStatus(user.id, !user.is_active)
      .then(() => load())
      .catch(() => null)
      .finally(() => setToggling(null))
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader title="User Management" subtitle={`${total} total users`} />
        <div className="flex items-center gap-3">
          <Select
            options={ROLE_OPTIONS}
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value as UserRole | ''); setPage(1) }}
            className="w-40"
          />
        </div>
        <Card padding="none">
          {loading ? (
            <div className="flex h-48 items-center justify-center"><Spinner /></div>
          ) : users.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={<span className="text-4xl">👥</span>} title="No users found" description="Try adjusting your filter" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.08] text-left text-xs font-semibold uppercase tracking-wide text-[#6B7280]">
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Joined</th>
                    <th className="px-6 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{u.full_name}</td>
                      <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                      <td className="px-6 py-3"><Badge variant={ROLE_VARIANTS[u.role] ?? 'default'}>{capitalize(u.role)}</Badge></td>
                      <td className="px-6 py-3"><Badge variant={u.is_active ? 'success' : 'danger'}>{u.is_active ? 'Active' : 'Inactive'}</Badge></td>
                      <td className="px-6 py-3 text-gray-500">{formatDate(u.id)}</td>
                      <td className="px-6 py-3">
                        <Button size="sm" variant={u.is_active ? 'danger' : 'secondary'} loading={toggling === u.id} onClick={() => toggleStatus(u)}>
                          {u.is_active ? 'Disable' : 'Enable'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="border-t border-gray-100 px-6 dark:border-gray-800">
            <Pagination page={page} pages={pages} total={total} onPageChange={setPage} />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
