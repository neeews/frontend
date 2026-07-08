import { BASE, jsonHeaders, parseResponse } from './client'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, { headers: jsonHeaders(options), ...options })
  return parseResponse(res)
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

  sendPasswordCode: (email) =>
    request('/auth/password/send-code', { method: 'POST', body: JSON.stringify({ email }) }),

  verifyPasswordCode: (email, code) =>
    request('/auth/password/verify-code', { method: 'POST', body: JSON.stringify({ email, code }) }),

  resetPassword: (email, newPassword) =>
    request('/auth/password/reset', { method: 'PATCH', body: JSON.stringify({ email, newPassword }) }),

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
