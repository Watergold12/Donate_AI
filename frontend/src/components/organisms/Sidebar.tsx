import { NavLink } from 'react-router-dom'
import { cn } from '../../utils/index'
import type { UserRole } from '../../types/index'
import {
  Home, ScanLine, Handshake, MapPin, User,
  LayoutDashboard, ClipboardList, Users, CheckSquare, BarChart2, Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface NavItem { label: string; to: string; icon: LucideIcon }

const donorNav: NavItem[] = [
  { label: 'Home',            to: '/donor',           icon: Home },
  { label: 'Scan and catalog',to: '/donor/camera',    icon: ScanLine },
  { label: 'Matches',         to: '/donor/history',   icon: Handshake },
  { label: 'Tracker',         to: '/donor/pickups',   icon: MapPin },
  { label: 'Profile',         to: '/settings',        icon: User },
]

const ngoNav: NavItem[] = [
  { label: 'Dashboard', to: '/ngo',             icon: LayoutDashboard },
  { label: 'Demands',   to: '/ngo/demands',     icon: ClipboardList },
  { label: 'Matches',   to: '/ngo/matches',     icon: Handshake },
  { label: 'Pickups',   to: '/ngo/pickups',     icon: MapPin },
  { label: 'Analytics', to: '/ngo/analytics',   icon: BarChart2 },
  { label: 'Settings',  to: '/settings',        icon: Settings },
]

const adminNav: NavItem[] = [
  { label: 'Dashboard',  to: '/admin',           icon: LayoutDashboard },
  { label: 'Users',      to: '/admin/users',     icon: Users },
  { label: 'NGO Verify', to: '/admin/ngos',      icon: CheckSquare },
  { label: 'Analytics',  to: '/admin/analytics', icon: BarChart2 },
  { label: 'Settings',   to: '/settings',        icon: Settings },
]

const navByRole: Record<UserRole, NavItem[]> = {
  donor: donorNav,
  ngo:   ngoNav,
  admin: adminNav,
}

interface SidebarProps { role: UserRole; collapsed?: boolean }

export function Sidebar({ role, collapsed = false }: SidebarProps) {
  const items = navByRole[role]
  return (
    <aside
      className={cn(
        'flex h-screen flex-col bg-da-sidebar border-r border-da-border transition-all duration-200',
        collapsed ? 'w-16' : 'w-[132px]',
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center gap-2.5 px-4 py-5', collapsed && 'justify-center')}>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-da-primary text-sm font-bold text-white">
          D
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold text-da-text">DonateAI</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        <ul className="flex flex-col gap-0.5">
          {items.map(item => {
            const Icon = item.icon
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end
                  className={({ isActive }) => cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-da-primary text-white'
                      : 'text-da-secondary hover:bg-da-border hover:text-da-text',
                    collapsed && 'justify-center px-2',
                  )}
                >
                <Icon className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
