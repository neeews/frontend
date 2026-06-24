const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

async function request(path, options = {}) {
  const accessToken = localStorage.getItem('accessToken')
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
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
