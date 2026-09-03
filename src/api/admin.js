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

  // ── 중요도 라벨링 ──
  // 서버는 아직 내가 매기지 않은 기사만 내려준다. 기존 라벨·AI 예측은 응답에 담기지 않는데,
  // 숫자를 먼저 보면 판단이 끌려가 독립적인 정답지가 되지 않기 때문이다.
  getLabelingQueue: ({ size = 20, round = 0, filter = 'ALL' } = {}) =>
    request(`/admin/labeling/next?${new URLSearchParams({ size, round, filter })}`),
  labelArticle: (articleId, label, round = 0) =>
    request(`/admin/labeling/${articleId}`, {
      method: 'POST',
      body: JSON.stringify({ label, round }),
    }),
  getLabelingStats: () => request('/admin/labeling/stats'),
}
