import type { AxiosError } from 'axios'

interface ApiErrorDetail {
  detail?: string | { msg: string }[]
  message?: string
}

export function getApiError(err: unknown): string {
  const axiosErr = err as AxiosError<ApiErrorDetail>
  if (axiosErr.response?.data) {
    const data = axiosErr.response.data
    if (typeof data.detail === 'string') return data.detail
    if (Array.isArray(data.detail)) return data.detail.map(d => d.msg).join(', ')
    if (typeof data.message === 'string') return data.message
  }
  if (axiosErr.message) return axiosErr.message
  return 'An unexpected error occurred'
}
