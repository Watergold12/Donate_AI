import { useAuthContext } from '../../store/authStore'
import { NotificationBell } from './NotificationBell'
import { authApi } from '../../api/auth'
import { Settings, LogIn, LogOut } from 'lucide-react'

interface NavbarProps { onToggleSidebar?: () => void; title?: string }

export function Navbar({ onToggleSidebar, title }: NavbarProps) {
  const { user, clearAuth, refreshToken, isAuthenticated } = useAuthContext()

  const handleLogout = () => {
    if (refreshToken) authApi.logout(refreshToken).catch(() => null)
    clearAuth()
  }

  return (
    <header className="flex h-12 items-center justify-between border-b border-white/[0.08] bg-da-bg px-6">
      {/* Left: page title (optional) or hamburger on mobile */}
      <div className="flex items-center gap-3">
        {title && (
          <h1 className="text-base font-semibold text-white">{title}</h1>
        )}
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-1.5 text-da-secondary hover:bg-white/[0.06] hover:text-white lg:hidden"
          aria-label="Toggle menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Right controls */}
      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />

        {/* Theme toggle (decorative — wired up for future use) */}
        <button
          className="rounded-lg p-2 text-da-secondary hover:bg-white/[0.06] hover:text-white transition-colors"
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>

        {/* Auth button */}
        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-da-secondary hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        ) : (
          <button
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-da-secondary hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <LogIn className="h-4 w-4" />
            <span>Sign in</span>
          </button>
        )}

        {/* Avatar */}
        {user && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-da-primary text-xs font-bold text-white">
            {user.full_name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
        )}
      </div>
    </header>
  )
}
