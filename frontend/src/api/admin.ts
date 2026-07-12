import { apiClient } from './client'
import type { APIResponse, PaginatedAPIResponse, User, NGOProfile, UserRole, AdminSummary } from '../types/index'

export const adminApi = {
  listUsers: (page = 1, size = 20, role?: UserRole) =>
    apiClient.get<PaginatedAPIResponse<User>>('/admin/users', {
      params: { page, size, role },
    }),

  getUser: (id: string) =>
    apiClient.get<APIResponse<User>>(`/admin/users/${id}`),

  setUserStatus: (id: string, is_active: boolean) =>
    apiClient.patch<APIResponse<User>>(`/admin/users/${id}/status`, { is_active }),

  pendingNGOs: (page = 1, size = 20) =>
    apiClient.get<PaginatedAPIResponse<NGOProfile>>('/admin/ngos/pending', {
      params: { page, size },
    }),

  verifyNGO: (id: string, approved: boolean) =>
    apiClient.patch<APIResponse<NGOProfile>>(`/admin/ngos/${id}/verify`, { approved }),

  analytics: () =>
    apiClient.get<APIResponse<AdminSummary>>('/admin/analytics'),

  triggerMatching: () =>
    apiClient.post<APIResponse<null>>('/admin/matching/trigger'),
}
