import { useCallback } from 'react'
import { donationsApi } from '../api/donations'
import { useApiQuery } from './useApiQuery'
import type { Donation, DonationStatus, PaginatedAPIResponse } from '../types/index'

export function useDonations(page = 1, size = 20, status?: DonationStatus) {
  const fetcher = useCallback(
    () => donationsApi.listMine(page, size, status).then(r => r.data),
    [page, size, status],
  )
  return useApiQuery<PaginatedAPIResponse<Donation>>(fetcher, [page, size, status])
}

export function useDonationHistory(page = 1, size = 20) {
  const fetcher = useCallback(
    () => donationsApi.history(page, size).then(r => r.data),
    [page, size],
  )
  return useApiQuery<PaginatedAPIResponse<Donation>>(fetcher, [page, size])
}
