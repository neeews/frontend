import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { articlesApi } from '../api/articles'
import { useAuth } from '../context/AuthContext'
import { useReadArticles } from '../hooks/useReadArticles'
import { timeAgo } from '../utils/time'
import CategoryNav from '../components/CategoryNav'
import { CATEGORY_COLOR } from '../constants/categories'
import '../styles/brand.css'
import '../styles/main.css'
import '../styles/category.css'

export default function CategoryPage() {
  const { name } = useParams()
  const navigate = useNavigate()
  const { isLoggedIn, logout } = useAuth()
  const { isRead } = useReadArticles()
  const [articles, setArticles] = useState([])
  const [sort, setSort] = useState('latest')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const sentinelRef = useRef(null)
  const loadingMoreRef = useRef(false)
  const hasMoreRef = useRef(false)

  useEffect(() => {
    setIsLoading(true)
    setArticles([])
    setPage(1)
    hasMoreRef.current = false
    setHasMore(false)
    articlesApi.getByCategory(name, sort, 1)
      .then(data => {
        const list = data?.articles ?? []
        setArticles(list)
        hasMoreRef.current = list.length >= 21
        setHasMore(list.length >= 21)
      })
      .catch(() => setArticles([]))
      .finally(() => setIsLoading(false))
  }, [name, sort])

  const loadMore = useCallback(() => {
    if (loadingMoreRef.current || !hasMoreRef.current) return
    loadingMoreRef.current = true
    setLoadingMore(true)
    setPage(prev => {
      const next = prev + 1
      articlesApi.getByCategory(name, sort, next)
        .then(data => {
          const list = data?.articles ?? []
          setArticles(prev => [...prev, ...list])
          hasMoreRef.current = list.length >= 21
          setHasMore(list.length >= 21)
        })
        .catch(() => {})
        .finally(() => {
          loadingMoreRef.current = false
          setLoadingMore(false)
        })
      return next
    })
  }, [name, sort])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore() },
      { rootMargin: '200px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  // 초기 로드 후 sentinel이 이미 뷰포트 안에 있으면 수동 트리거
  useEffect(() => {
    if (isLoading || !hasMore || !sentinelRef.current) return
    const rect = sentinelRef.current.getBoundingClientRect()
    if (rect.top <= window.innerHeight + 200) loadMore()
  }, [isLoading, hasMore, loadMore])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="category-page">
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
            <img src="/favicon.png" alt="" className="logo-mark" />
            <span className="logo-text">neeews</span>
          </Link>

          <CategoryNav
            activeCategory={name}
            onSelect={cat => navigate(cat === '전체' ? '/' : `/category/${encodeURIComponent(cat)}`)}
          />

          <div className="header-actions">
            <button className="header-search-btn" onClick={() => navigate('/search')} aria-label="검색">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            {isLoggedIn ? (
              <div className="header-user-menu">
                <Link to="/mypage" className="header-mypage-btn">마이페이지</Link>
                <button className="header-logout-btn" onClick={handleLogout}>로그아웃</button>
              </div>
            ) : (
              <Link to="/login" className="header-login-btn">로그인</Link>
            )}
          </div>
        </div>
      </header>

      <header className="cat-page-header">
        <div className="cat-page-header-inner">
          <button className="back-btn" onClick={() => navigate(-1)}>← 뒤로</button>
          <h1 className="cat-page-title">{name}</h1>
          <select
            className="sort-select"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            <option value="latest">최신순</option>
            <option value="popular">인기순</option>
          </select>
        </div>
      </header>

      <div className="cat-content">
        {isLoading && <div className="cat-loading">불러오는 중...</div>}

        {!isLoading && articles.length === 0 && (
          <div className="cat-empty">기사가 없습니다.</div>
        )}

        {!isLoading && articles.length > 0 && (
          <div className="cat-article-grid">
            {articles.map(a => {
              const read = a.isRead || isRead(a.id)
              return (
              <div
                key={a.id}
                className="cat-article-card"
                onClick={() => navigate(`/articles/${a.id}`)}
              >
                <div className="cat-card-body">
                  {a.category && (
                    <span
                      className="cat-badge"
                      style={{ background: CATEGORY_COLOR[a.category] ?? '#64748b' }}
                    >
                      {a.category}
                    </span>
                  )}
                  <p className={`cat-card-title${read ? ' title-read' : ''}`}>{a.title}</p>
                  {a.summary && <p className="cat-card-summary">{a.summary}</p>}
                  <div className="cat-card-byline">
                    <span className="article-time">{timeAgo(a.publishedAt)}</span>
                    {a.source && <span className="article-source">{a.source}</span>}
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        )}

        <div ref={sentinelRef} className="scroll-sentinel" />
        {loadingMore && <div className="cat-loading">불러오는 중...</div>}
      </div>
    </div>
  )
}
