import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import EyeIcon from '../components/EyeIcon'
import AuthLogo from '../components/AuthLogo'
import '../styles/auth.css'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authApi.login(form.email, form.password)
      login(data)
      navigate('/')
    } catch (err) {
      setError(err.message || '이메일 또는 비밀번호가 올바르지 않습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <AuthLogo />
      <div className="auth-form-wrap">
        <h2>로그인</h2>

        <form onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="example@email.com"
              value={form.email}
              onChange={handle}
              autoComplete="email"
              required
            />
          </div>
          <div className="form-group">
            <div className="label-row">
              <label htmlFor="password">비밀번호</label>
              <Link to="/forgot-password" className="label-link">비밀번호 찾기</Link>
            </div>
            <div className="password-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호를 입력하세요"
                value={form.password}
                onChange={handle}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="btn-eye"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>
          {error && <p className="auth-alert" role="alert">{error}</p>}
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="auth-switch">
          계정이 없으신가요?<Link to="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  )
}
