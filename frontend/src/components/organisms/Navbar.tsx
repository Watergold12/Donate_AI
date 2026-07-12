import { useAuthContext } from '../../store/authStore'
import { NotificationBell } from './NotificationBell'
import { authApi } from '../../api/auth'

interface NavbarProps { onToggleSidebar?: () => void }

export function Navbar({ onToggleSidebar }: NavbarProps) {
  const { user, clearAuth, refreshToken } = useAuthContext()

  const handleLogout = () => {
    if (refreshToken) authApi.logout(refreshToken).catch(() => null)
    clearAuth()
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
      <button onClick={onToggleSidebar} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden" aria-label="Toggle menu">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="ml-auto flex items-center gap-3">
        <NotificationBell />
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {user?.full_name?.charAt(0).toUpperCase() ?? 'U'}
        </div>
        <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-300 sm:block">{user?.full_name}</span>
        <button onClick={handleLogout} className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">Sign out</button>
      </div>
    </header>
  )
}
