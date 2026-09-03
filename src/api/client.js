export const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export function jsonHeaders(options = {}) {
  return { 'Content-Type': 'application/json', ...options.headers }
}

export function authHeaders(options = {}) {
  const accessToken = localStorage.getItem('accessToken')
  return {
    ...jsonHeaders(options),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  }
}

export async function parseResponse(res) {
  if (!res.ok) {
    const text = await res.text()
    // 서버가 본문 없이 상태코드만 주면 statusText 도 비어 있어 메시지가 빈 문자열이 된다.
    // 빈 메시지는 호출부의 `error &&` 검사를 통과하지 못해 오류가 조용히 사라진다.
    let message = res.statusText || `요청 실패 (HTTP ${res.status})`
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
