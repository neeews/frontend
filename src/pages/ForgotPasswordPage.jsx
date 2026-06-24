import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import '../styles/auth.css'

const VERIFY_DURATION = 180

function formatTime(s) {
  const m = String(Math.floor(s / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return `${m}:${sec}`
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [codeVerified, setCodeVerified] = useState(false)
  const [verifyCode, setVerifyCode] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [sentAt, setSentAt] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [codeError, setCodeError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const sendCode = async () => {
    if (!email) return
    setError('')
    setCodeError('')
    setCodeSent(true)
    setCodeVerified(false)
    setVerifyCode('')
    setTimeLeft(VERIFY_DURATION)
    setSentAt(Date.now())
    try {
      await authApi.sendPasswordCode(email)
    } catch (err) {
      setError(err.message || '인증 코드 발송에 실패했습니다.')
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
      await authApi.verifyPasswordCode(email, verifyCode)
      setCodeVerified(true)
    } catch (err) {
      setCodeError(err.message || '인증 코드가 올바르지 않습니다.')
    }
  }

  const submit = async e => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirm) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword(email, newPassword)
      navigate('/login')
    } catch (err) {
      setError(err.message || '비밀번호 변경에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-form-wrap">
        <h2>비밀번호 찾기 🔑</h2>
        <p className="auth-subtitle">가입한 이메일로 인증 후 비밀번호를 재설정하세요</p>

        <form onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="fp-email">이메일</label>
            <div className="email-verify-row">
              <input
                id="fp-email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  if (codeSent) { setCodeSent(false); setVerifyCode(''); setCodeVerified(false) }
                }}
                required
                disabled={codeVerified}
              />
              <button
                type="button"
                className="btn-send-code"
                onClick={sendCode}
                disabled={!email || codeVerified}
              >
                {codeSent ? '재발송' : '인증 발송'}
              </button>
            </div>

            {codeVerified && (
              <p className="verify-success">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                이메일 인증이 완료되었습니다
              </p>
            )}

            {codeSent && !codeVerified && (
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

          {codeVerified && (
            <>
              <div className="form-group">
                <label htmlFor="fp-new-password">새 비밀번호</label>
                <input
                  id="fp-new-password"
                  type="password"
                  placeholder="8자 이상 입력하세요"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                />
              </div>
              <div className="form-group">
                <label htmlFor="fp-confirm">비밀번호 확인</label>
                <input
                  id="fp-confirm"
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </>
          )}

          {error && <p className="auth-error">{error}</p>}

          {codeVerified && (
            <button
              type="submit"
              className="btn-submit"
              disabled={!newPassword || !confirm || loading}
            >
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
          )}
        </form>

        <p className="auth-switch">
          <Link to="/login">← 로그인으로 돌아가기</Link>
        </p>
      </div>
    </div>
  )
}
