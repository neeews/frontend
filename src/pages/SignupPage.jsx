import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import '../styles/auth.css'

const VERIFY_DURATION = 180

function EyeIcon({ open }) {
  return open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function formatTime(s) {
  const m = String(Math.floor(s / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return `${m}:${sec}`
}

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [emailSent, setEmailSent] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [verifyCode, setVerifyCode] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [sentAt, setSentAt] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [codeError, setCodeError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleEmailChange = e => {
    handle(e)
    if (emailSent) {
      setEmailSent(false)
      setVerifyCode('')
      setEmailVerified(false)
    }
  }

  const sendCode = async () => {
    if (!form.email) return
    setError('')
    setCodeError('')
    setEmailSent(true)
    setEmailVerified(false)
    setVerifyCode('')
    setTimeLeft(VERIFY_DURATION)
    setSentAt(Date.now())
    try {
      await authApi.sendEmailCode(form.email)
    } catch (err) {
      setError(err.message || '인증 코드 발송에 실패했습니다. 이메일을 확인해주세요.')
    }
  }

  useEffect(() => {
    if (!sentAt) return
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(id); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [sentAt])

  const confirmCode = async () => {
    setCodeError('')
    try {
      await authApi.verifyEmailCode(form.email, verifyCode)
      setEmailVerified(true)
    } catch (err) {
      setCodeError(err.message || '인증 코드가 올바르지 않습니다.')
    }
  }

  const submit = async e => {
    e.preventDefault()
    setError('')
    if (!emailVerified) {
      setError('이메일 인증을 완료해주세요.')
      return
    }
    if (form.password !== form.confirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    setLoading(true)
    try {
      const data = await authApi.signup(form.name, form.email, form.password)
      login(data)
      navigate('/')
    } catch (err) {
      setError(err.message || '회원가입에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-form-wrap">
        <h2>시작해볼까요? 🚀</h2>
        <p className="auth-subtitle">무료로 가입하고 맞춤 뉴스를 받아보세요</p>

        <form onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="name">이름</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="홍길동"
              value={form.name}
              onChange={handle}
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <div className="email-verify-row">
              <input
                id="email"
                name="email"
                type="email"
                placeholder="example@email.com"
                value={form.email}
                onChange={handleEmailChange}
                autoComplete="email"
                required
                disabled={emailVerified}
              />
              <button
                type="button"
                className="btn-send-code"
                onClick={sendCode}
                disabled={!form.email || emailVerified}
              >
                {emailSent ? '재발송' : '인증 발송'}
              </button>
            </div>

            {emailVerified && (
              <p className="verify-success">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                이메일 인증이 완료되었습니다
              </p>
            )}

            {emailSent && !emailVerified && (
              <>
                <p className="verify-sent-msg">인증 코드가 이메일로 발송되었습니다.</p>
                <div className="verify-code-row">
                  <input
                    type="text"
                    className="code-input"
                    placeholder="인증 코드 6자리"
                    value={verifyCode}
                    onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                  />
                  <button
                    type="button"
                    className="btn-confirm-code"
                    onClick={confirmCode}
                    disabled={verifyCode.length !== 6 || timeLeft === 0}
                  >
                    확인
                  </button>
                  <span className={`verify-timer${timeLeft === 0 ? ' expired' : ''}`}>
                    {timeLeft > 0 ? formatTime(timeLeft) : '만료'}
                  </span>
                </div>
                {codeError && <p className="auth-error">{codeError}</p>}
              </>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <div className="password-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="8자 이상 입력하세요"
                value={form.password}
                onChange={handle}
                autoComplete="new-password"
                required
                minLength={8}
              />
              <button type="button" className="btn-eye" onClick={() => setShowPassword(v => !v)}>
                <EyeIcon open={showPassword} />
              </button>
            </div>
            <ul className="pw-rules">
              <li className={form.password.length >= 8 ? 'met' : ''}>최소 8자 이상</li>
              <li className={/[A-Za-z]/.test(form.password) ? 'met' : ''}>영문 포함</li>
              <li className={/[0-9]/.test(form.password) ? 'met' : ''}>숫자 포함</li>
            </ul>
          </div>
          <div className="form-group">
            <label htmlFor="confirm">비밀번호 확인</label>
            <div className="password-wrap">
              <input
                id="confirm"
                name="confirm"
                type={showConfirm ? 'text' : 'password'}
                placeholder="비밀번호를 다시 입력하세요"
                value={form.confirm}
                onChange={handle}
                autoComplete="new-password"
                required
              />
              <button type="button" className="btn-eye" onClick={() => setShowConfirm(v => !v)}>
                <EyeIcon open={showConfirm} />
              </button>
            </div>
          </div>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="btn-submit" disabled={!emailVerified || loading}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="auth-switch">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  )
}
