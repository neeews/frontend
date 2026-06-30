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

export const adminApi = {
  getSuggestions: () => request('/admin/suggestions'),
  updateSuggestionStatus: (id, status) =>
    request(`/admin/suggestions/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteSuggestion: (id) => request(`/admin/suggestions/${id}`, { method: 'DELETE' }),
}
