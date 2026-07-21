import { useState } from 'react'
import { useAuthContext } from '../../store/authStore'
import { NotificationBell } from './NotificationBell'
import { authApi } from '../../api/auth'
import { Sun, Moon, LogIn, LogOut } from 'lucide-react'

interface NavbarProps { onToggleSidebar?: () => void; title?: string }

export function Navbar({ onToggleSidebar, title }: NavbarProps) {
  const { user, clearAuth, refreshToken, isAuthenticated } = useAuthContext()
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

  const handleLogout = () => {
    if (refreshToken) authApi.logout(refreshToken).catch(() => null)
    clearAuth()
  }

  const toggleTheme = () => {
    const html = document.documentElement
    if (html.classList.contains('dark')) {
      html.classList.remove('dark')
      html.classList.add('light')
      localStorage.setItem('theme', 'light')
      setIsDark(false)
    } else {
      html.classList.remove('light')
      html.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDark(true)
    }
  }

  return (
    <header className="flex h-12 items-center justify-between border-b border-da-border bg-da-bg px-6">
      {/* Left: page title (optional) or hamburger on mobile */}
      <div className="flex items-center gap-3">
        {title && (
          <h1 className="text-base font-semibold text-da-text">{title}</h1>
        )}
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-1.5 text-da-secondary hover:bg-da-border hover:text-da-text transition-colors lg:hidden"
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

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-da-secondary hover:bg-da-border hover:text-da-text transition-colors"
          aria-label="Toggle theme"
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-500" />
          )}
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
