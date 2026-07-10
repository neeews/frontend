import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { articlesApi } from '../api/articles'
import { useAuth } from '../context/AuthContext'
import { useReadArticles } from '../hooks/useReadArticles'
import { timeAgo } from '../utils/time'
import CategoryNav from '../components/CategoryNav'
import { CATEGORY_COLOR } from '../constants/categories'
import '../styles/brand.css'
import '../styles/main.css'

const TICKER_DURATION = 60 // .ticker-content 애니메이션 duration(초)과 동일하게 유지
let tickerStartedAt = null // 모듈 스코프: 기사 상세로 이동했다 돌아와도 흘러간 시간을 유지

const BLOCK_CATEGORIES = ['정치', '경제', 'IT/과학']

function loadInterests() {
  try { return JSON.parse(localStorage.getItem('interestCategories') || '[]') } catch { return [] }
}

export default function MainPage() {
  const navigate = useNavigate()
  const { user, isLoggedIn, logout } = useAuth()
  const { isRead } = useReadArticles()

  // URL ?category= 를 단일 소스로 사용 — 검색 등 다른 페이지에서 /?category=정치 로 진입 가능
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategory = searchParams.get('category') || '전체'
  const [hotArticles, setHotArticles] = useState([])
  const [latestArticles, setLatestArticles] = useState([])
  const [breakingNews, setBreakingNews] = useState([])
  const [recommended, setRecommended] = useState([])
  const [categoryBlocks, setCategoryBlocks] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [interests] = useState(loadInterests)
  const [tickerDelay] = useState(() => {
    if (tickerStartedAt === null) tickerStartedAt = Date.now()
    const elapsed = ((Date.now() - tickerStartedAt) / 1000) % TICKER_DURATION
    return -elapsed
  })

  // Initial load: breaking news, latest
  useEffect(() => {
    Promise.all([
      articlesApi.getBreaking().catch(() => []),
      articlesApi.getLatest().catch(() => []),
    ]).then(([breaking, latest]) => {
      setBreakingNews(breaking)
      setLatestArticles(latest)
    })
  }, [])

  // 관심 카테고리 기반 추천: 각 카테고리 인기 기사를 번갈아 섞어 최대 6개
  useEffect(() => {
    if (!isLoggedIn || interests.length === 0) return
    Promise.all(
      interests.map(cat =>
        articlesApi.getByCategory(cat, 'popular', 1)
          .then(d => d?.articles ?? [])
          .catch(() => [])
      )
    ).then(lists => {
      const merged = []
      const seen = new Set()
      outer: for (let i = 0; lists.some(l => i < l.length); i++) {
        for (const list of lists) {
          const a = list[i]
          if (a && !seen.has(a.id)) {
            seen.add(a.id)
            merged.push(a)
            if (merged.length >= 6) break outer
          }
        }
      }
      setRecommended(merged)
    })
  }, [isLoggedIn, interests])

  // 카테고리별 뉴스 블록
  useEffect(() => {
    Promise.all(
      BLOCK_CATEGORIES.map(cat =>
        articlesApi.getByCategory(cat, 'latest', 1)
          .then(d => d?.articles ?? [])
          .catch(() => [])
      )
    ).then(lists => {
      const map = {}
      BLOCK_CATEGORIES.forEach((cat, i) => { map[cat] = lists[i].slice(0, 4) })
      setCategoryBlocks(map)
    })
  }, [])

  // Load hot articles when category changes
  useEffect(() => {
    setIsLoading(true)
    articlesApi.getHot(activeCategory)
      .then(data => setHotArticles(data))
      .catch(() => setHotArticles([]))
      .finally(() => setIsLoading(false))
  }, [activeCategory])

  const handleCategoryClick = cat => {
    setSearchParams(cat === '전체' ? {} : { category: cat }, { replace: true })
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const featured = hotArticles[0]
  const subArticles = hotArticles.slice(1, 3)
  const listArticles = hotArticles.slice(3, 6)

  return (
    <div className="main-page">
      {/* Header / Nav */}
      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
            <span className="logo-mark">N</span>
            <span className="logo-text">neeews</span>
          </Link>

          <CategoryNav activeCategory={activeCategory} onSelect={handleCategoryClick} />

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

      {/* Breaking ticker */}
      <div className="ticker-bar">
        <span className="ticker-label">속보</span>
        <div className="ticker-track">
          <div
            className="ticker-content"
            key={breakingNews.map(a => a.id).join(',') || 'empty'}
            style={{ animationDelay: `${tickerDelay}s` }}
          >
            {breakingNews.length > 0 ? (
              breakingNews.map((a, i) => (
                <span className="ticker-item-wrap" key={a.id}>
                  <span className="ticker-item" onClick={() => navigate(`/articles/${a.id}`)}>
                    {a.title}
                  </span>
                  {i < breakingNews.length - 1 && <span className="ticker-sep">·</span>}
                </span>
              ))
            ) : (
              <span>최신 뉴스를 불러오는 중...</span>
            )}
          </div>
        </div>
      </div>

      <main className="main-content">
        {/* Hot issues + side */}
        <div className="content-layout">
          {/* Main hot articles */}
          <section className="hot-section">
            <div className="section-header">
              <h2 className="section-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                </svg>
                {activeCategory === '전체' ? '핫 이슈' : `${activeCategory} 인기 기사`}
              </h2>
            </div>

            {isLoading && <div className="hot-loading">불러오는 중...</div>}

            {!isLoading && hotArticles.length === 0 && (
              <div className="hot-empty">기사가 없습니다.</div>
            )}

            {!isLoading && featured && (
              <>
                <div className="hot-top">
                  {/* 1위 - 대형 카드 */}
                  <div
                    className="hot-card hot-card--featured"
                    onClick={() => navigate(`/articles/${featured.id}`)}
                  >
                    <div className="featured-meta">
                      <span className="rank-badge rank-1">1위</span>
                      {featured.category && (
                        <span className="cat-badge" style={{ background: CATEGORY_COLOR[featured.category] }}>
                          {featured.category}
                        </span>
                      )}
                    </div>
                    <div className="featured-content">
                      <h3 className={`featured-title${(featured.isRead || isRead(featured.id)) ? ' title-read' : ''}`}>{featured.title}</h3>
                      {featured.summary && <p className="featured-summary">{featured.summary}</p>}
                      <div className="article-byline">
                        <span className="article-time">{timeAgo(featured.publishedAt)}</span>
                        {featured.source && <span className="article-source">{featured.source}</span>}
                      </div>
                    </div>
                  </div>

                  {/* 2~3위 */}
                  {subArticles.length > 0 && (
                    <div className="hot-sub-col">
                      {subArticles.map((article, idx) => (
                        <div
                          key={article.id}
                          className="hot-card hot-card--sub"
                          onClick={() => navigate(`/articles/${article.id}`)}
                        >
                          <div className="sub-meta">
                            <span className={`rank-badge rank-${idx + 2}`}>{idx + 2}위</span>
                            {article.category && (
                              <span className="cat-badge" style={{ background: CATEGORY_COLOR[article.category] }}>
                                {article.category}
                              </span>
                            )}
                          </div>
                          <div className="sub-content">
                            <h4 className={`sub-title${(article.isRead || isRead(article.id)) ? ' title-read' : ''}`}>{article.title}</h4>
                            <div className="article-byline">
                              <span className="article-time">{timeAgo(article.publishedAt)}</span>
                              {article.source && <span className="article-source">{article.source}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4~6위 - 리스트 */}
                {listArticles.length > 0 && (
                  <div className="hot-list">
                    {listArticles.map((article, idx) => (
                      <div
                        key={article.id}
                        className="hot-list-item"
                        onClick={() => navigate(`/articles/${article.id}`)}
                      >
                        <span className="list-rank">{idx + 4}</span>
                        <div className="list-body">
                          <div className="list-meta">
                            {article.category && (
                              <span
                                className="cat-badge small"
                                style={{ background: CATEGORY_COLOR[article.category] }}
                              >
                                {article.category}
                              </span>
                            )}
                            <span className="article-time">{timeAgo(article.publishedAt)}</span>
                            {article.source && <span className="article-source">{article.source}</span>}
                          </div>
                          <p className={`list-title${(article.isRead || isRead(article.id)) ? ' title-read' : ''}`}>{article.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {!isLoading && hotArticles.length > 0 && (
              <div className="hot-more-wrap">
                <button
                  className="btn-hot-more"
                  onClick={() => navigate(activeCategory === '전체' ? '/category/전체' : `/category/${encodeURIComponent(activeCategory)}`)}
                >
                  {activeCategory === '전체' ? '전체 기사 보기' : `${activeCategory} 기사 더 보기`} →
                </button>
              </div>
            )}
          </section>

          {/* Side articles */}
          <aside className="side-section">
            <div className="section-header">
              <h2 className="section-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
                최신 뉴스
              </h2>
            </div>
            <div className="side-list">
              {latestArticles.length === 0 && (
                <p style={{ color: '#94a3b8', fontSize: 14, padding: '16px 0' }}>최신 기사가 없습니다.</p>
              )}
              {latestArticles.slice(0, 9).map(a => (
                <div
                  key={a.id}
                  className="side-item"
                  onClick={() => navigate(`/articles/${a.id}`)}
                >
                  <div className="side-body">
                    {a.category && (
                      <span
                        className="cat-badge small"
                        style={{ background: CATEGORY_COLOR[a.category] }}
                        onClick={e => { e.stopPropagation(); navigate(`/category/${encodeURIComponent(a.category)}`) }}
                      >
                        {a.category}
                      </span>
                    )}
                    <p className={`side-title${(a.isRead || isRead(a.id)) ? ' title-read' : ''}`}>{a.title}</p>
                    <div className="article-byline">
                      <span className="article-time">{timeAgo(a.publishedAt)}</span>
                      {a.source && <span className="article-source">{a.source}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {latestArticles.length > 0 && (
              <div className="side-more-wrap">
                <button className="btn-hot-more" onClick={() => navigate('/category/전체')}>
                  최신 기사 더 보기 →
                </button>
              </div>
            )}
          </aside>
        </div>

        {/* 관심 카테고리 추천 */}
        {recommended.length > 0 && (
          <section className="reco-section">
            <div className="section-header">
              <h2 className="section-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l2.9 6.26L21 9.27l-4.5 4.38L17.8 20 12 16.77 6.2 20l1.3-6.35L3 9.27l6.1-1.01L12 2z" />
                </svg>
                {user?.name ? `${user.name}님을 위한 뉴스` : '나를 위한 뉴스'}
              </h2>
              <span className="reco-hint">관심 카테고리 기반 추천</span>
            </div>
            <div className="reco-grid">
              {recommended.map(a => (
                <div key={a.id} className="reco-card" onClick={() => navigate(`/articles/${a.id}`)}>
                  <div className="list-meta">
                    {a.category && (
                      <span className="cat-badge small" style={{ background: CATEGORY_COLOR[a.category] }}>
                        {a.category}
                      </span>
                    )}
                    <span className="article-time">{timeAgo(a.publishedAt)}</span>
                  </div>
                  <p className={`reco-title${(a.isRead || isRead(a.id)) ? ' title-read' : ''}`}>{a.title}</p>
                  {a.source && <span className="article-source">{a.source}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 카테고리별 뉴스 블록 */}
        <div className="cat-blocks">
          {BLOCK_CATEGORIES.map(cat => (
            <section key={cat} className="cat-block">
              <div className="cat-block-header">
                <h2 className="cat-block-title">
                  <span className="cat-block-dot" style={{ background: CATEGORY_COLOR[cat] }} />
                  {cat}
                </h2>
                <button className="btn-hot-more" onClick={() => navigate(`/category/${encodeURIComponent(cat)}`)}>
                  더 보기 →
                </button>
              </div>
              <div className="cat-block-list">
                {(categoryBlocks[cat] ?? []).map(a => (
                  <div key={a.id} className="cat-block-item" onClick={() => navigate(`/articles/${a.id}`)}>
                    <p className={`cat-block-item-title${(a.isRead || isRead(a.id)) ? ' title-read' : ''}`}>{a.title}</p>
                    <div className="article-byline">
                      <span className="article-time">{timeAgo(a.publishedAt)}</span>
                      {a.source && <span className="article-source">{a.source}</span>}
                    </div>
                  </div>
                ))}
                {(categoryBlocks[cat] ?? []).length === 0 && (
                  <p className="cat-block-empty">기사가 없습니다.</p>
                )}
              </div>
            </section>
          ))}
        </div>
      </main>

      <footer className="site-footer">
        <p>© 2026 neeews. 모든 뉴스를 한눈에.</p>
      </footer>
    </div>
  )
}
