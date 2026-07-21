import { useState, useEffect } from 'react'
import { notificationsApi } from '../../api/notifications'
import type { Notification } from '../../types/index'
import { formatDateTime, cn } from '../../utils/index'

export function NotificationBell() {
  const [count, setCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])

  useEffect(() => {
    notificationsApi.unreadCount().then(r => setCount(r.data.data.unread_count)).catch(() => null)
  }, [])

  const handleOpen = () => {
    setOpen(o => !o)
    if (!open) {
      notificationsApi.list(1, 10).then(r => setItems(r.data.data)).catch(() => null)
    }
  }

  const markRead = (id: string) => {
    notificationsApi.markRead(id).then(() => {
      setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      setCount(c => Math.max(0, c - 1))
    }).catch(() => null)
  }

  const markAll = () => {
    notificationsApi.markAllRead().then(() => {
      setItems(prev => prev.map(n => ({ ...n, is_read: true })))
      setCount(0)
    }).catch(() => null)
  }

  return (
    <div className="relative">
      <button onClick={handleOpen} className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800" aria-label="Notifications">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">{count > 9 ? '9+' : count}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-da-border bg-da-card shadow-lg">
          <div className="flex items-center justify-between border-b border-da-border px-4 py-3">
            <p className="font-semibold text-da-text">Notifications</p>
            {count > 0 && <button onClick={markAll} className="text-xs text-green-600 hover:underline">Mark all read</button>}
          </div>
          <ul className="max-h-72 overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-6 text-center text-sm text-da-muted">No notifications</li>}
            {items.map(n => (
              <li key={n.id} className={cn('cursor-pointer px-4 py-3 hover:bg-da-border/30 transition-colors', !n.is_read && 'bg-green-500/10')} onClick={() => !n.is_read && markRead(n.id)}>
                <p className="text-sm font-medium text-da-text">{n.title}</p>
                <p className="text-xs text-da-secondary">{n.message}</p>
                <p className="mt-1 text-xs text-da-muted">{formatDateTime(n.created_at)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
