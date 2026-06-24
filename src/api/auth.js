const BASE = import.meta.env.VITE_API_BASE_URL ?? ''

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
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

export const authApi = {
  sendEmailCode: (email) =>
    request('/auth/email/send', { method: 'POST', body: JSON.stringify({ email }) }),

  verifyEmailCode: (email, code) =>
    request('/auth/email/verify', { method: 'POST', body: JSON.stringify({ email, code }) }),

  signup: (name, email, password) =>
    request('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password }) }),

  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  logout: (refreshToken) =>
    request('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),

  refresh: (refreshToken) =>
    request('/auth/token/refresh', { method: 'POST', body: JSON.stringify({ refreshToken }) }),

  getMe: () =>
    request('/auth/me', {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    }),
}

export const tokenStorage = {
  save: ({ accessToken, refreshToken, user }) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    if (user) localStorage.setItem('user', JSON.stringify(user))
  },
  getAccess: () => localStorage.getItem('accessToken'),
  getRefresh: () => localStorage.getItem('refreshToken'),
  getUser: () => {
    try {
      const u = localStorage.getItem('user')
      return u ? JSON.parse(u) : null
    } catch { return null }
  },
  clear: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
  },
}
