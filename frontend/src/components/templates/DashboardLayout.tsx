import { useState } from 'react'
import type { ReactNode } from 'react'
import { Sidebar } from '../organisms/Sidebar'
import { Navbar } from '../organisms/Navbar'
import { useAuthContext } from '../../store/authStore'
import type { UserRole } from '../../types/index'

interface DashboardLayoutProps { children: ReactNode; title?: string }

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user } = useAuthContext()
  const [collapsed, setCollapsed] = useState(false)
  const role = (user?.role ?? 'donor') as UserRole

  return (
    <div className="flex h-screen overflow-hidden bg-da-bg">
      <Sidebar role={role} collapsed={collapsed} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onToggleSidebar={() => setCollapsed(c => !c)} title={title} />
        <main className="flex-1 overflow-y-auto bg-da-bg p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
