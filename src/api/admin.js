import { BASE, authHeaders, parseResponse } from './client'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders(options), ...options })
  return parseResponse(res)
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
