import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { articlesApi } from '../api/articles'
import { useAuth } from '../context/AuthContext'
import { timeAgo } from '../utils/time'
import { CATEGORY_COLOR } from '../constants/categories'
import '../styles/mypage.css'

const ALL_CATEGORIES = ['정치', '경제', '사회', '연예/문화', '스포츠', '세계', 'IT/과학']

function loadInterests() {
  try { return JSON.parse(localStorage.getItem('interestCategories') || '[]') } catch { return [] }
}

export default function MyPage() {
  const navigate = useNavigate()
  const { user: ctxUser, logout } = useAuth()
  const [user, setUser] = useState(ctxUser)
  const [bookmarks, setBookmarks] = useState([])
  const [isLoading, setIsLoading] = useState(!ctxUser)
  const [interests, setInterests] = useState(loadInterests)
  const [interestSaved, setInterestSaved] = useState(false)
  const [suggestionTitle, setSuggestionTitle] = useState('')
  const [suggestionContent, setSuggestionContent] = useState('')
  const [suggestionStatus, setSuggestionStatus] = useState('idle')

  useEffect(() => {
    if (!ctxUser) {
      articlesApi.getMe()
        .then(setUser)
        .catch(() => {})
        .finally(() => setIsLoading(false))
    }
    articlesApi.getMyBookmarks()
      .then(setBookmarks)
      .catch(() => {})
  }, [ctxUser])

  const toggleInterest = (cat) => {
    setInterests(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
    setInterestSaved(false)
  }

  const saveInterests = () => {
    localStorage.setItem('interestCategories', JSON.stringify(interests))
    setInterestSaved(true)
    setTimeout(() => setInterestSaved(false), 2000)
  }

  const submitSuggestion = async (e) => {
    e.preventDefault()
    if (!suggestionTitle.trim() || !suggestionContent.trim()) return
    setSuggestionStatus('submitting')
    try {
      await articlesApi.submitSuggestion(suggestionTitle.trim(), suggestionContent.trim())
      setSuggestionTitle('')
      setSuggestionContent('')
      setSuggestionStatus('submitted')
      setTimeout(() => setSuggestionStatus('idle'), 2000)
    } catch {
      setSuggestionStatus('error')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const deleteAccount = async () => {
    if (!window.confirm('정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    try { await articlesApi.deleteMe() } catch {}
    await logout()
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

        <section className="interests-section">
          <h2>관심 카테고리</h2>
          <p className="interests-subtitle">선택한 카테고리를 기반으로 뉴스를 추천해드립니다</p>
          <div className="interests-grid">
            {ALL_CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`interest-chip${interests.includes(cat) ? ' selected' : ''}`}
                style={interests.includes(cat) ? {} : { borderColor: CATEGORY_COLOR[cat], color: CATEGORY_COLOR[cat] }}
                onClick={() => toggleInterest(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <button className="btn-save-interests" onClick={saveInterests}>
            {interestSaved ? '✓ 저장됨' : '저장'}
          </button>
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
                        style={{ background: CATEGORY_COLOR[a.category] ?? '#64748b' }}
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

        <section className="suggestion-form-section">
          <h2>건의하기</h2>
          <p className="interests-subtitle">서비스 개선을 위한 의견을 남겨주세요</p>
          <form onSubmit={submitSuggestion} className="suggestion-form">
            <input
              type="text"
              placeholder="제목"
              value={suggestionTitle}
              onChange={e => setSuggestionTitle(e.target.value)}
              className="suggestion-input"
              maxLength={100}
            />
            <textarea
              placeholder="내용을 입력해주세요"
              value={suggestionContent}
              onChange={e => setSuggestionContent(e.target.value)}
              className="suggestion-textarea"
              rows={5}
            />
            <button
              type="submit"
              className="btn-save-interests"
              disabled={suggestionStatus === 'submitting' || !suggestionTitle.trim() || !suggestionContent.trim()}
            >
              {suggestionStatus === 'submitting' ? '제출 중...' : suggestionStatus === 'submitted' ? '✓ 제출됨' : '제출'}
            </button>
            {suggestionStatus === 'error' && <p className="suggestion-error">제출에 실패했습니다. 다시 시도해주세요.</p>}
          </form>
        </section>

        <div className="mypage-actions">
          {user?.role === 'ROLE_ADMIN' && (
            <button className="btn-logout" onClick={() => navigate('/admin')}>관리자 페이지</button>
          )}
          <button className="btn-logout" onClick={handleLogout}>로그아웃</button>
          <button className="btn-delete-account" onClick={deleteAccount}>회원 탈퇴</button>
        </div>
      </div>
    </div>
  )
}
