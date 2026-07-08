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
