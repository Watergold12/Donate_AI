import { apiClient } from './client'
import type {
  APIResponse,
  DonorSummary, NGOSummary, AdminSummary,
  TrendPoint, CategoryBreakdown, MatchingRatePoint, PickupStats,
} from '../types/index'

export type SummaryData = DonorSummary | NGOSummary | AdminSummary

export const analyticsApi = {
  summary: () =>
    apiClient.get<APIResponse<SummaryData>>('/analytics/summary'),

  trend: (days = 30) =>
    apiClient.get<APIResponse<TrendPoint[]>>('/analytics/donations/trend', {
      params: { days },
    }),

  categories: () =>
    apiClient.get<APIResponse<CategoryBreakdown[]>>('/analytics/categories'),

  matchingRate: (days = 30) =>
    apiClient.get<APIResponse<MatchingRatePoint[]>>('/analytics/matching-rate', {
      params: { days },
    }),

  pickupStats: () =>
    apiClient.get<APIResponse<PickupStats>>('/analytics/pickups'),
}
