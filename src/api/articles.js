const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

async function request(path, options = {}, retry = true) {
  const accessToken = localStorage.getItem('accessToken')
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
    ...options,
  })

  // 401 → refresh token으로 재발급 → 원래 요청 재시도
  if (res.status === 401 && retry) {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${BASE}/auth/token/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        })
        if (refreshRes.ok) {
          const data = await refreshRes.json()
          localStorage.setItem('accessToken', data.accessToken)
          localStorage.setItem('refreshToken', data.refreshToken)
          if (data.user) localStorage.setItem('user', JSON.stringify(data.user))
          window.dispatchEvent(new CustomEvent('auth:token-refreshed', { detail: data }))
          return request(path, options, false)
        }
      } catch {}
    }
    // refresh 실패 → 로그아웃 처리
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    window.dispatchEvent(new Event('auth:logout'))
    throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.')
  }

  if (!res.ok) {
    const text = await res.text()
    let message = res.statusText
    if (text) {
      try { message = JSON.parse(text).message ?? message } catch { message = text }
    }
    throw new Error(message)
  }
  if (res.status === 204) return null
  const text = await res.text()
  if (!text) return null
  try { return JSON.parse(text) } catch { return null }
}

export const articlesApi = {
  getBreaking: () => request('/articles/breaking'),
  getTrending: () => request('/keywords/trending'),
  getHot: (category) =>
    category && category !== '전체'
      ? request(`/articles?category=${encodeURIComponent(category)}&sort=popular`)
      : request('/articles/hot'),
  getLatest: () => request('/articles/latest'),
  getByCategory: (category, sort = 'latest', page = 1) =>
    request(`/articles?category=${encodeURIComponent(category)}&sort=${sort}&page=${page}`),
  getById: (id) => request(`/articles/${id}`),
  search: (q, page = 1) =>
    request(`/search?q=${encodeURIComponent(q)}&page=${page}&limit=10`),
  addBookmark: (id) => request(`/articles/${id}/bookmark`, { method: 'POST' }),
  removeBookmark: (id) => request(`/articles/${id}/bookmark`, { method: 'DELETE' }),
  getMyBookmarks: () => request('/users/me/bookmarks'),
  getMe: () => request('/auth/me'),
  deleteMe: () => request('/users/me', { method: 'DELETE' }),
}
