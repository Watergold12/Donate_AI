import { apiClient } from './client'
import type { APIResponse, User, TokenResponse, AccessTokenResponse } from '../types/index'

interface RegisterPayload {
  email: string
  password: string
  full_name: string
  role: 'donor' | 'ngo'
  org_name?: string
  registration_number?: string
}

export const authApi = {
  register: (data: RegisterPayload) =>
    apiClient.post<APIResponse<User>>('/auth/register', data),

  login: (email: string, password: string) =>
    apiClient.post<APIResponse<TokenResponse>>('/auth/login', { email, password }),

  refresh: (refresh_token: string) =>
    apiClient.post<APIResponse<AccessTokenResponse>>('/auth/refresh', { refresh_token }),

  logout: (refresh_token: string) =>
    apiClient.post<APIResponse<null>>('/auth/logout', { refresh_token }),

  me: () =>
    apiClient.get<APIResponse<User>>('/auth/me'),

  updateMe: (data: { full_name?: string }) =>
    apiClient.put<APIResponse<User>>('/auth/me', data),
}
