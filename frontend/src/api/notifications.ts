import { apiClient } from './client'
import type { APIResponse, PaginatedAPIResponse, Notification } from '../types/index'

export const notificationsApi = {
  list: (page = 1, size = 20) =>
    apiClient.get<PaginatedAPIResponse<Notification>>('/notifications', {
      params: { page, size },
    }),

  markRead: (id: string) =>
    apiClient.put<APIResponse<Notification>>(`/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.put<APIResponse<{ updated: number }>>('/notifications/read-all'),

  unreadCount: () =>
    apiClient.get<APIResponse<{ unread_count: number }>>('/notifications/unread-count'),
}
