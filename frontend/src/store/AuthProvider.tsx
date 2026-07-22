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

  const setUser = useCallback((user: User) => {
    setState(prev => ({ ...prev, user }))
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const token = localStorage.getItem('access_token')

      if (!token) {
        setState(prev => ({ ...prev, isLoading: false }))
        return
      }

      let isMounted = true

      authApi.me()
        .then(res => {
          if (!isMounted) return
          const user: User = res.data.data
          setState(prev => ({ ...prev, user, isAuthenticated: true, isLoading: false }))
        })
        .catch(() => {
          if (!isMounted) return
          clearAuth()
        })

      return () => {
        isMounted = false
      }
    }, 0)

    return () => window.clearTimeout(timer)
  }, [clearAuth])

  const value: AuthContextType = { ...state, setAuth, clearAuth, setLoading, setUser }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
