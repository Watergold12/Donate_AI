import { useAuthContext } from '../store/authStore'
import { authApi } from '../api/auth'
import type { User } from '../types/index'

export function useAuth() {
  const ctx = useAuthContext()

  const login = async (email: string, password: string): Promise<User> => {
    const res = await authApi.login(email, password)
    const { access_token, refresh_token } = res.data.data
    const meRes = await authApi.me()
    ctx.setAuth(meRes.data.data, access_token, refresh_token)
    return meRes.data.data
  }

  const logout = async () => {
    if (ctx.refreshToken) {
      await authApi.logout(ctx.refreshToken).catch(() => null)
    }
    ctx.clearAuth()
  }

  return { ...ctx, login, logout }
}
