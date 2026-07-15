import { useState } from 'react'
import type { ReactNode } from 'react'
import { Sidebar } from '../organisms/Sidebar'
import { Navbar } from '../organisms/Navbar'
import { useAuthContext } from '../../store/authStore'
import type { UserRole } from '../../types/index'

interface DashboardLayoutProps { children: ReactNode; title?: string }

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { user } = useAuthContext()
  const [mobileOpen, setMobileOpen] = useState(false)
  const role = (user?.role ?? 'donor') as UserRole

  return (
    <div className="flex h-screen overflow-hidden bg-da-bg">

      {/* Desktop sidebar — always visible on lg+ screens */}
      <div className="hidden lg:block lg:flex-shrink-0">
        <Sidebar role={role} collapsed={false} />
      </div>

      {/* Mobile sidebar — hidden by default, shown as overlay */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer — closes when a nav item is clicked */}
          <div
            className="fixed inset-y-0 left-0 z-50 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <Sidebar role={role} collapsed={false} />
          </div>
        </>
      )}

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Navbar
          onToggleSidebar={() => setMobileOpen(o => !o)}
          title={title}
        />
        <main className="flex-1 overflow-y-auto bg-da-bg p-4 lg:p-6">
          {children}
        </main>
      </div>

    </div>
  )
}
