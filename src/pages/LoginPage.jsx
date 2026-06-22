import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/auth.css'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const submit = e => {
    e.preventDefault()
    // TODO: 로그인 로직 연결
    alert(`로그인 시도: ${form.email}`)
  }

  return (
    <div className="auth-page">
      <div className="auth-form-wrap">
        <h2>다시 만나서 반가워요 👋</h2>
        <p className="auth-subtitle">로그인하고 오늘의 뉴스를 확인하세요</p>

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
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={form.password}
              onChange={handle}
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn-submit">
            로그인
          </button>
        </form>

        <p className="auth-switch">
          계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </div>
    </div>
  )
}
