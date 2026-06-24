import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { articlesApi } from '../api/articles'
import { authApi, tokenStorage } from '../api/auth'
import { timeAgo } from '../utils/time'
import '../styles/mypage.css'

const categoryColor = {
  '경제': '#10b981',
  '연예/문화': '#f59e0b',
  '정치': '#3b82f6',
  'IT/과학': '#8b5cf6',
  '스포츠': '#ef4444',
  '사회': '#64748b',
  '세계': '#0ea5e9',
}

export default function MyPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [bookmarks, setBookmarks] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 로그인 시 저장해둔 유저 정보를 즉시 표시
    const cached = tokenStorage.getUser()
    if (cached) {
      setUser(cached)
      setIsLoading(false)
    }

    // 서버에서 최신 유저 정보 갱신
    authApi.getMe()
      .then(data => setUser(data))
      .catch(() => {})
      .finally(() => setIsLoading(false))

    // 북마크 목록 (백엔드 미구현 시 빈 배열로 유지)
    articlesApi.getMyBookmarks()
      .then(data => {
        const list = Array.isArray(data)
          ? data
          : (data?.articles ?? data?.bookmarks ?? [])
        setBookmarks(list)
      })
      .catch(() => {})
  }, [])

  const logout = async () => {
    try {
      await authApi.logout(tokenStorage.getRefresh())
    } catch {}
    tokenStorage.clear()
    navigate('/')
  }

  const deleteAccount = async () => {
    if (!window.confirm('정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    try {
      await articlesApi.deleteMe()
    } catch {}
    tokenStorage.clear()
    navigate('/')
  }

  if (isLoading) return <div className="page-loading">불러오는 중...</div>

  return (
    <div className="mypage">
      <header className="mypage-header">
        <div className="mypage-header-inner">
          <button className="back-btn" onClick={() => navigate(-1)}>← 뒤로</button>
          <h1>마이페이지</h1>
        </div>
      </header>

      <div className="mypage-content">
        <section className="profile-section">
          <div className="profile-avatar">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="profile-info">
            <p className="profile-name">{user?.name ?? '사용자'}</p>
            <p className="profile-email">{user?.email ?? ''}</p>
            {user?.createdAt && (
              <p className="profile-joined">
                가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}
              </p>
            )}
          </div>
        </section>

        <section className="bookmarks-section">
          <h2>북마크한 기사 ({bookmarks.length})</h2>
          {bookmarks.length === 0 ? (
            <p className="bookmark-empty">북마크한 기사가 없습니다.</p>
          ) : (
            <div className="bookmark-list">
              {bookmarks.map(a => (
                <div
                  key={a.id}
                  className="bookmark-item"
                  onClick={() => navigate(`/articles/${a.id}`)}
                >
                  <div className="bookmark-thumb" />
                  <div className="bookmark-body">
                    {a.category && (
                      <span
                        className="cat-badge"
                        style={{ background: categoryColor[a.category] ?? '#64748b' }}
                      >
                        {a.category}
                      </span>
                    )}
                    <p className="bookmark-title">{a.title}</p>
                    <div className="bookmark-byline">
                      <span className="article-time">{timeAgo(a.publishedAt)}</span>
                      {a.source && <span className="article-source">{a.source}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mypage-actions">
          <button className="btn-logout" onClick={logout}>로그아웃</button>
          <button className="btn-delete-account" onClick={deleteAccount}>회원 탈퇴</button>
        </div>
      </div>
    </div>
  )
}
