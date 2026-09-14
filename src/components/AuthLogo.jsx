import { Link } from 'react-router-dom'
import '../styles/brand.css'

// 로그인·회원가입·비밀번호 찾기 화면 위의 로고. 누르면 메인으로 돌아간다.
export default function AuthLogo() {
  return (
    <Link to="/" className="logo auth-logo" aria-label="neeews 메인으로">
      <img src="/favicon.png" alt="" className="logo-mark" />
      <span className="logo-text">neeews</span>
    </Link>
  )
}
