import { apiClient } from './client'
import type { APIResponse, DonorProfile } from '../types/index'

interface UpdateDonorProfilePayload {
  phone?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
}

export const donorsApi = {
  getProfile: () =>
    apiClient.get<APIResponse<DonorProfile>>('/donors/profile'),

  updateProfile: (data: UpdateDonorProfilePayload) =>
    apiClient.put<APIResponse<DonorProfile>>('/donors/profile', data),
}
