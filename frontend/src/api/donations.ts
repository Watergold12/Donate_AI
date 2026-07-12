import { apiClient } from './client'
import type {
  APIResponse, PaginatedAPIResponse,
  Donation, DonationItem, Match,
  ItemCategory, ItemCondition, DonationStatus,
} from '../types/index'

interface AddItemPayload {
  item_name: string
  category: ItemCategory
  quantity: number
  condition: ItemCondition
  ai_detected?: boolean
  confidence_score?: number
  image_path?: string
}

interface UpdateItemPayload {
  item_name?: string
  category?: ItemCategory
  quantity?: number
  condition?: ItemCondition
  is_confirmed?: boolean
}

export const donationsApi = {
  create: (notes?: string) =>
    apiClient.post<APIResponse<Donation>>('/donations', { notes }),

  update: (id: string, notes: string) =>
    apiClient.put<APIResponse<Donation>>(`/donations/${id}`, { notes }),

  cancel: (id: string) =>
    apiClient.delete<APIResponse<null>>(`/donations/${id}`),

  submit: (id: string) =>
    apiClient.post<APIResponse<Donation>>(`/donations/${id}/submit`),

  getItems: (id: string) =>
    apiClient.get<APIResponse<DonationItem[]>>(`/donations/${id}/items`),

  addItem: (id: string, item: AddItemPayload) =>
    apiClient.post<APIResponse<DonationItem>>(`/donations/${id}/items`, item),

  updateItem: (donationId: string, itemId: string, data: UpdateItemPayload) =>
    apiClient.put<APIResponse<DonationItem>>(`/donations/${donationId}/items/${itemId}`, data),

  removeItem: (donationId: string, itemId: string) =>
    apiClient.delete<APIResponse<null>>(`/donations/${donationId}/items/${itemId}`),

  getMatches: (id: string) =>
    apiClient.get<APIResponse<Match[]>>(`/donations/${id}/match`),

  listMine: (page = 1, size = 20, status?: DonationStatus) =>
    apiClient.get<PaginatedAPIResponse<Donation>>('/donors/donations', {
      params: { page, size, status_filter: status },
    }),

  history: (page = 1, size = 20) =>
    apiClient.get<PaginatedAPIResponse<Donation>>('/donors/history', {
      params: { page, size },
    }),
}
