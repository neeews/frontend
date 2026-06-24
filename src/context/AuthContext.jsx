import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authApi, tokenStorage } from '../api/auth'

const AuthContext = createContext({
  user: null,
  token: null,
  isLoggedIn: false,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStorage.getUser())
  const [token, setToken] = useState(() => tokenStorage.getAccess())

  const login = useCallback((data) => {
    tokenStorage.save(data)
    setUser(data.user ?? null)
    setToken(data.accessToken)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout(tokenStorage.getRefresh())
    } catch {}
    tokenStorage.clear()
    setUser(null)
    setToken(null)
  }, [])

  // articles.js가 토큰 갱신/만료 시 CustomEvent로 알려줌
  useEffect(() => {
    const onRefreshed = (e) => {
      setToken(e.detail.accessToken)
      if (e.detail.user) setUser(e.detail.user)
    }
    const onExpired = () => {
      setUser(null)
      setToken(null)
    }
    window.addEventListener('auth:token-refreshed', onRefreshed)
    window.addEventListener('auth:logout', onExpired)
    return () => {
      window.removeEventListener('auth:token-refreshed', onRefreshed)
      window.removeEventListener('auth:logout', onExpired)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn: Boolean(token), login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
