import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/index'
import type { UserRole } from '../../types/index'

interface NavItem { label: string; to: string; icon: string }

const navByRole: Record<UserRole, NavItem[]> = {
  donor: [
    { label: 'Dashboard',    to: '/donor',           icon: '📊' },
    { label: 'New Donation', to: '/donor/donate',    icon: '🎁' },
    { label: 'My Donations', to: '/donor/history',   icon: '📋' },
    { label: 'Pickups',      to: '/donor/pickups',   icon: '🚚' },
    { label: 'Analytics',    to: '/donor/analytics', icon: '📈' },
    { label: 'Settings',     to: '/settings',        icon: '⚙️' },
  ],
  ngo: [
    { label: 'Dashboard', to: '/ngo',             icon: '📊' },
    { label: 'Demands',   to: '/ngo/demands',     icon: '📋' },
    { label: 'Matches',   to: '/ngo/matches',     icon: '🤝' },
    { label: 'Pickups',   to: '/ngo/pickups',     icon: '🚚' },
    { label: 'Analytics', to: '/ngo/analytics',   icon: '📈' },
    { label: 'Settings',  to: '/settings',        icon: '⚙️' },
  ],
  admin: [
    { label: 'Dashboard',  to: '/admin',           icon: '📊' },
    { label: 'Users',      to: '/admin/users',     icon: '👥' },
    { label: 'NGO Verify', to: '/admin/ngos',      icon: '✅' },
    { label: 'Analytics',  to: '/admin/analytics', icon: '📈' },
    { label: 'Settings',   to: '/settings',        icon: '⚙️' },
  ],
}

interface SidebarProps { role: UserRole; collapsed?: boolean }

export function Sidebar({ role, collapsed = false }: SidebarProps) {
  const items = navByRole[role]
  return (
    <aside className={cn('flex h-full flex-col border-r border-gray-200 bg-white transition-all dark:border-gray-800 dark:bg-gray-900', collapsed ? 'w-16' : 'w-56')}>
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-5 dark:border-gray-800">
        <span className="text-2xl">🌿</span>
        {!collapsed && <span className="font-bold text-gray-900 dark:text-white">DonateAI</span>}
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="flex flex-col gap-1 px-2">
          {items.map(item => (
            <li key={item.to}>
              <NavLink to={item.to} end className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800',
              )}>
                <span className="text-base" aria-hidden="true">{item.icon}</span>
                {!collapsed && item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
