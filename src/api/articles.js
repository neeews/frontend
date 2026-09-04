import { BASE, authHeaders, parseResponse } from './client'

async function request(path, options = {}, retry = true) {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders(options), ...options })

  // 401/403 → refresh token으로 재발급 → 원래 요청 재시도
  // (백엔드 Spring Security가 인증 만료 시 401이 아닌 403을 반환함)
  if ((res.status === 401 || res.status === 403) && retry) {
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

  return parseResponse(res)
}

const toList = (data, key) => (Array.isArray(data) ? data : (data?.[key] ?? []))

export const articlesApi = {
  getBreaking: () => request('/articles/breaking').then(d => toList(d, 'articles')),
  getHot: (category) =>
    category && category !== '전체'
      ? request(`/articles?category=${encodeURIComponent(category)}&sort=popular`).then(d => toList(d, 'articles'))
      : request('/articles/hot').then(d => toList(d, 'articles')),
  getLatest: () => request('/articles/latest').then(d => toList(d, 'articles')),
  // AI 요약이 있는 기사 최신 5건 — summary에 aiSummary가 그대로 담겨 온다
  getTodaySummaries: () => request('/articles/today').then(d => toList(d, 'articles')),
  // returns { articles, total, page }
  getByCategory: (category, sort = 'latest', page = 1) =>
    category && category !== '전체'
      ? request(`/articles?category=${encodeURIComponent(category)}&sort=${sort}&page=${page}`)
      : request(`/articles?sort=${sort}&page=${page}`),
  // returns { article, related }
  getById: (id) => request(`/articles/${id}`),
  // returns { total, articles }
  search: (q, { categories = [], sources = [] } = {}, page = 1) => {
    const params = new URLSearchParams({ q, page, limit: 10 })
    categories.forEach(c => params.append('categories', c))
    sources.forEach(s => params.append('sources', s))
    return request(`/search?${params.toString()}`)
  },
  addBookmark: (id) => request(`/articles/${id}/bookmark`, { method: 'POST' }),
  removeBookmark: (id) => request(`/articles/${id}/bookmark`, { method: 'DELETE' }),
  getMyBookmarks: () => request('/users/me/bookmarks').then(d => toList(d, 'articles')),
  getSearchHistory: () => request('/users/me/search-history').then(d => d?.history ?? []),
  clearSearchHistory: () => request('/users/me/search-history', { method: 'DELETE' }),
  getMe: () => request('/auth/me'),
  // 토큰이 아직 유효한지만 확인한다. 응답 본문은 쓰지 않는다.
  // 만료됐으면 request() 가 재발급을 시도하고, 그것도 실패하면 auth:logout 을 쏜다.
  // /auth/me 는 permitAll 이라 토큰 없이도 500 이 떠서 검증에 쓸 수 없다.
  validateSession: () => request('/users/me/search-history'),
  deleteMe: () => request('/users/me', { method: 'DELETE' }),
  submitSuggestion: (title, content) =>
    request('/suggestions', { method: 'POST', body: JSON.stringify({ title, content }) }),
}
