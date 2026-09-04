import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authApi, tokenStorage } from '../api/auth'
import { articlesApi } from '../api/articles'

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

  // 메인 화면이 부르는 기사 API 는 전부 permitAll 이라 토큰이 만료돼도 200 이 온다.
  // 그래서 만료를 감지할 기회가 없어 헤더가 계속 로그인된 상태로 남았다.
  // 앱이 뜰 때 인증이 필요한 요청을 한 번 보내 재발급 또는 로그아웃을 트리거한다.
  useEffect(() => {
    if (!tokenStorage.getAccess()) return
    // 만료 처리는 아래 auth:logout 리스너가 맡는다. 네트워크 오류로는 로그아웃시키지 않는다.
    articlesApi.validateSession().catch(() => {})
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
