import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { articlesApi } from '../api/articles'
import { useAuth } from '../context/AuthContext'
import { timeAgo } from '../utils/time'
import '../styles/main.css'

const CATEGORIES = ['전체', '정치', '경제', '사회', '연예/문화', '스포츠', '세계', 'IT/과학']

const categoryColor = {
  '경제': '#10b981',
  '연예/문화': '#f59e0b',
  '정치': '#3b82f6',
  'IT/과학': '#8b5cf6',
  '스포츠': '#ef4444',
  '사회': '#64748b',
  '세계': '#0ea5e9',
}

export default function MainPage() {
  const navigate = useNavigate()
  const { isLoggedIn, logout } = useAuth()

  const [activeCategory, setActiveCategory] = useState('전체')
  const [keywords, setKeywords] = useState([])
  const [hotArticles, setHotArticles] = useState([])
  const [latestArticles, setLatestArticles] = useState([])
  const [breakingNews, setBreakingNews] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Initial load: breaking news, keywords, latest
  useEffect(() => {
    Promise.all([
      articlesApi.getBreaking().catch(() => []),
      articlesApi.getTrending().catch(() => []),
      articlesApi.getLatest().catch(() => []),
    ]).then(([breaking, trending, latest]) => {
      setBreakingNews(Array.isArray(breaking) ? breaking : (breaking?.articles ?? []))
      setKeywords(Array.isArray(trending) ? trending : (trending?.keywords ?? []))
      setLatestArticles(Array.isArray(latest) ? latest : (latest?.articles ?? []))
    })
  }, [])

  // Load hot articles when category changes
  useEffect(() => {
    setIsLoading(true)
    articlesApi.getHot(activeCategory)
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.articles ?? [])
        setHotArticles(list)
      })
      .catch(() => setHotArticles([]))
      .finally(() => setIsLoading(false))
  }, [activeCategory])

  const handleCategoryClick = cat => {
    setActiveCategory(cat)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const tickerText = breakingNews.length > 0
    ? breakingNews.map(a => a.title).join(' · ')
    : '최신 뉴스를 불러오는 중...'

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
            <span className="logo-text">뉴스피드</span>
          </Link>

          <nav className="category-nav">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`cat-btn${activeCategory === cat ? ' active' : ''}`}
                onClick={() => handleCategoryClick(cat)}
              >
                {cat}
              </button>
            ))}
          </nav>

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
          <span key={tickerText}>{tickerText}</span>
        </div>
      </div>

      <main className="main-content">
        {/* Trending keywords */}
        {keywords.length > 0 && (
          <section className="keywords-section">
            <div className="section-header">
              <h2 className="section-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
                오늘의 인기 키워드
              </h2>
              <span className="section-date">{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 기준</span>
            </div>

            <div className="keywords-grid">
              {keywords.slice(0, 10).map((kw, i) => (
                <div
                  key={kw.rank ?? i}
                  className="keyword-item"
                  onClick={() => navigate(`/search?q=${encodeURIComponent(kw.word ?? kw.keyword ?? '')}`)}
                >
                  <span className={`kw-rank rank-${(kw.rank ?? i + 1) <= 3 ? 'top' : 'normal'}`}>
                    {kw.rank ?? i + 1}
                  </span>
                  <span className="kw-word">{kw.word ?? kw.keyword}</span>
                  <span className={`kw-change change-${kw.change ?? 'same'}`}>
                    {(kw.change === 'up') && '▲'}
                    {(kw.change === 'down') && '▼'}
                    {(kw.change === 'same' || !kw.change) && '–'}
                    {kw.change === 'new' && 'NEW'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

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
                        <span className="cat-badge" style={{ background: categoryColor[featured.category] }}>
                          {featured.category}
                        </span>
                      )}
                    </div>
                    <div className="featured-content">
                      <h3 className="featured-title">{featured.title}</h3>
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
                              <span className="cat-badge" style={{ background: categoryColor[article.category] }}>
                                {article.category}
                              </span>
                            )}
                          </div>
                          <div className="sub-content">
                            <h4 className="sub-title">{article.title}</h4>
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
                                style={{ background: categoryColor[article.category] }}
                              >
                                {article.category}
                              </span>
                            )}
                            <span className="article-time">{timeAgo(article.publishedAt)}</span>
                            {article.source && <span className="article-source">{article.source}</span>}
                          </div>
                          <p className="list-title">{article.title}</p>
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
              {latestArticles.slice(0, 5).map(a => (
                <div
                  key={a.id}
                  className="side-item"
                  onClick={() => navigate(`/articles/${a.id}`)}
                >
                  <div className="side-body">
                    {a.category && (
                      <span
                        className="cat-badge small"
                        style={{ background: categoryColor[a.category] }}
                        onClick={e => { e.stopPropagation(); navigate(`/category/${encodeURIComponent(a.category)}`) }}
                      >
                        {a.category}
                      </span>
                    )}
                    <p className="side-title">{a.title}</p>
                    <div className="article-byline">
                      <span className="article-time">{timeAgo(a.publishedAt)}</span>
                      {a.source && <span className="article-source">{a.source}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>

      <footer className="site-footer">
        <p>© 2026 뉴스피드. 모든 뉴스를 한눈에.</p>
      </footer>
    </div>
  )
}
