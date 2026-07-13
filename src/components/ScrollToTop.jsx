import { useEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

// SPA 라우트 이동 시 스크롤 위치가 유지되므로 경로가 바뀌면 맨 위로 이동.
// 뒤로/앞으로 가기(POP)는 브라우저의 스크롤 복원에 맡긴다.
export default function ScrollToTop() {
  const { pathname } = useLocation()
  const navigationType = useNavigationType()

  useEffect(() => {
    if (navigationType !== 'POP') window.scrollTo(0, 0)
  }, [pathname, navigationType])

  return null
}
