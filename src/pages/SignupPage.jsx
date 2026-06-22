import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/auth.css'

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const submit = e => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      alert('비밀번호가 일치하지 않습니다.')
      return
    }
    // TODO: 회원가입 로직 연결
    alert(`회원가입 시도: ${form.email}`)
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
              placeholder="8자 이상 입력하세요"
              value={form.password}
              onChange={handle}
              autoComplete="new-password"
              required
              minLength={8}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm">비밀번호 확인</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              value={form.confirm}
              onChange={handle}
              autoComplete="new-password"
              required
            />
          </div>
          <button type="submit" className="btn-submit">
            회원가입
          </button>
        </form>

        <p className="auth-switch">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  )
}
