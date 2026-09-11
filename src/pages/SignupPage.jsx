import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import EyeIcon from '../components/EyeIcon'
import { VERIFY_CODE_DURATION, formatMMSS } from '../utils/time'
import { CONSENT_ITEMS } from '../constants/privacy'
import '../styles/auth.css'

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
  // 개인정보 보호법 제22조는 필수 동의를 다른 항목과 구분해 따로 받도록 하고 있다.
  const [agreedPrivacy, setAgreedPrivacy] = useState(false)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [agreedAge, setAgreedAge] = useState(false)
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
    setTimeLeft(VERIFY_CODE_DURATION)
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
    if (!agreedAge || !agreedTerms || !agreedPrivacy) {
      setError('필수 항목에 모두 동의해주세요.')
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
        <Link to="/" className="auth-back">← 메인으로</Link>
        <h2>회원가입</h2>

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
                    {timeLeft > 0 ? formatMMSS(timeLeft) : '만료'}
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
          <fieldset className="consent-box">
            <legend>약관 동의</legend>

            <label className="consent-row">
              <input
                type="checkbox"
                checked={agreedAge}
                onChange={e => setAgreedAge(e.target.checked)}
              />
              <span><b>[필수]</b> 만 14세 이상입니다.</span>
            </label>
            <label className="consent-row">
              <input
                type="checkbox"
                checked={agreedTerms}
                onChange={e => setAgreedTerms(e.target.checked)}
              />
              <span>
                <b>[필수]</b> 이용약관에 동의합니다.{' '}
                <Link to="/terms" target="_blank" rel="noreferrer">전문 보기</Link>
              </span>
            </label>
            <label className="consent-row">
              <input
                type="checkbox"
                checked={agreedPrivacy}
                onChange={e => setAgreedPrivacy(e.target.checked)}
              />
              <span>
                <b>[필수]</b> 개인정보 수집·이용에 동의합니다.{' '}
                <Link to="/privacy" target="_blank" rel="noreferrer">전문 보기</Link>
              </span>
            </label>

            <p className="consent-caption">개인정보 수집·이용 내역</p>
            <div className="consent-table-scroll">
              <table className="consent-table">
                <thead>
                  <tr>
                    <th>수집 항목</th>
                    <th>이용 목적</th>
                    <th>보유 기간</th>
                  </tr>
                </thead>
                <tbody>
                  {CONSENT_ITEMS.map(row => (
                    <tr key={row.items}>
                      <td>{row.items}</td>
                      <td>{row.purpose}</td>
                      <td>{row.period}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="consent-refusal">
              동의를 거부하실 수 있으나, 위 항목은 서비스 제공에 반드시 필요한 최소한의 정보이므로
              거부 시 회원가입이 제한됩니다.
            </p>
          </fieldset>

          {error && <p className="auth-error">{error}</p>}
          <button
            type="submit"
            className="btn-submit"
            disabled={!emailVerified || !agreedAge || !agreedTerms || !agreedPrivacy || loading}
          >
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
