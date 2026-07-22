import { apiClient } from './client'
import type {
  APIResponse, PaginatedAPIResponse,
  NGOProfile, NGODemand, Match,
  ItemCategory, DemandUrgency, MatchStatus,
} from '../types/index'

interface CreateDemandPayload {
  item_category: ItemCategory
  item_name: string
  quantity_needed: number
  urgency_level: DemandUrgency
  description?: string
  expires_at?: string
}

interface UpdateDemandPayload {
  item_name?: string
  quantity_needed?: number
  urgency_level?: DemandUrgency
  description?: string
  expires_at?: string
  is_active?: boolean
}

interface UpdateProfilePayload {
  org_name?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  contact_phone?: string
  website?: string
  description?: string
  service_areas?: string[]
}

export const ngosApi = {
  getProfile: () =>
    apiClient.get<APIResponse<NGOProfile>>('/ngos/profile'),

  updateProfile: (data: UpdateProfilePayload) =>
    apiClient.put<APIResponse<NGOProfile>>('/ngos/profile', data),

  createDemand: (data: CreateDemandPayload) =>
    apiClient.post<APIResponse<NGODemand>>('/ngos/demands', data),

  listDemands: (page = 1, size = 20, active_only = true) =>
    apiClient.get<PaginatedAPIResponse<NGODemand>>('/ngos/demands', {
      params: { page, size, active_only },
    }),

  updateDemand: (id: string, data: UpdateDemandPayload) =>
    apiClient.put<APIResponse<NGODemand>>(`/ngos/demands/${id}`, data),

  deleteDemand: (id: string) =>
    apiClient.delete<APIResponse<null>>(`/ngos/demands/${id}`),

  listMatches: (page = 1, size = 20, status?: MatchStatus) =>
    apiClient.get<PaginatedAPIResponse<Match>>('/ngos/matches', {
      params: { page, size, status_filter: status },
    }),

  acceptMatch: (id: string) =>
    apiClient.put<APIResponse<Match>>(`/ngos/matches/${id}/accept`),

  rejectMatch: (id: string, reason?: string) =>
    apiClient.put<APIResponse<Match>>(`/ngos/matches/${id}/reject`, {
      rejection_reason: reason,
    }),

  triggerMatching: () =>
    apiClient.post<APIResponse<null>>('/ngos/matches/trigger'),

  uploadVerificationDocs: (formData: FormData) =>
    apiClient.post<APIResponse<NGOProfile>>('/ngos/verification-documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}
