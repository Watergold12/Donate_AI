import { useCallback } from 'react'
import { analyticsApi } from '../api/analytics'
import { useApiQuery } from './useApiQuery'

export function useSummary() {
  const fetcher = useCallback(
    () => analyticsApi.summary().then(r => r.data.data),
    [],
  )
  return useApiQuery(fetcher, [])
}

export function useTrend(days = 30) {
  const fetcher = useCallback(
    () => analyticsApi.trend(days).then(r => r.data.data),
    [days],
  )
  return useApiQuery(fetcher, [days])
}

export function useCategories() {
  const fetcher = useCallback(
    () => analyticsApi.categories().then(r => r.data.data),
    [],
  )
  return useApiQuery(fetcher, [])
}

export function usePickupStats() {
  const fetcher = useCallback(
    () => analyticsApi.pickupStats().then(r => r.data.data),
    [],
  )
  return useApiQuery(fetcher, [])
}
