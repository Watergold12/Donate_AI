import { useState } from 'react'
import type { ReactNode } from 'react'
import { Sidebar } from '../organisms/Sidebar'
import { Navbar } from '../organisms/Navbar'
import { useAuthContext } from '../../store/authStore'
import type { UserRole } from '../../types/index'

interface DashboardLayoutProps { children: ReactNode }

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuthContext()
  const [collapsed, setCollapsed] = useState(false)
  const role = (user?.role ?? 'donor') as UserRole
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar role={role} collapsed={collapsed} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setCollapsed(c => !c)} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}
