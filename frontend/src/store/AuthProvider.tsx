import { useState, useCallback, useEffect } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from './authStore'
import type { AuthState, AuthContextType } from './authStore'
import { authApi } from '../api/auth'
import type { User } from '../types/index'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: localStorage.getItem('access_token'),
    refreshToken: localStorage.getItem('refresh_token'),
    isAuthenticated: false,
    isLoading: true,
  })

  const setAuth = useCallback((user: User, accessToken: string, refreshToken: string) => {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    setState({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false })
  }, [])

  const clearAuth = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setState({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false })
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }))
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      authApi.me()
        .then(res => {
          const user: User = res.data.data
          setState(prev => ({ ...prev, user, isAuthenticated: true, isLoading: false }))
        })
        .catch(() => {
          clearAuth()
        })
    } else {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [clearAuth])

  const value: AuthContextType = { ...state, setAuth, clearAuth, setLoading }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
