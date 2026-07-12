import { useCallback } from 'react'
import { notificationsApi } from '../api/notifications'
import { useApiQuery } from './useApiQuery'

export function useUnreadCount() {
  const fetcher = useCallback(
    () => notificationsApi.unreadCount().then(r => r.data.data.unread_count),
    [],
  )
  return useApiQuery<number>(fetcher, [])
}

export function useNotifications(page = 1, size = 20) {
  const fetcher = useCallback(
    () => notificationsApi.list(page, size).then(r => r.data),
    [page, size],
  )
  return useApiQuery(fetcher, [page, size])
}
