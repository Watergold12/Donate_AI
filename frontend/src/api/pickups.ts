import { apiClient } from './client'
import type { APIResponse, PaginatedAPIResponse, Pickup, PickupStatus } from '../types/index'

interface CreatePickupPayload {
  donation_id: string
  ngo_id: string
  match_id: string
  scheduled_at: string
  pickup_address: string
  pickup_city: string
  contact_phone?: string
  notes?: string
}

export const pickupsApi = {
  create: (data: CreatePickupPayload) =>
    apiClient.post<APIResponse<Pickup>>('/pickups', data),

  getDonorPickups: (page = 1, size = 20) =>
    apiClient.get<PaginatedAPIResponse<Pickup>>('/pickups/donor', {
      params: { page, size },
    }),

  getNgoPickups: (page = 1, size = 20) =>
    apiClient.get<PaginatedAPIResponse<Pickup>>('/pickups/ngo', {
      params: { page, size },
    }),

  getPickup: (id: string) =>
    apiClient.get<APIResponse<Pickup>>(`/pickups/${id}`),

  updateStatus: (id: string, status: PickupStatus) =>
    apiClient.put<APIResponse<Pickup>>(`/pickups/${id}/status`, { status }),
}
