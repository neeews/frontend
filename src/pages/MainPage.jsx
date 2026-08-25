import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { articlesApi } from '../api/articles'
import { useAuth } from '../context/AuthContext'
import { useReadArticles } from '../hooks/useReadArticles'
import { timeAgo, formatToday } from '../utils/time'
import CategoryNav from '../components/CategoryNav'
import { CATEGORY_COLOR } from '../constants/categories'
import '../styles/brand.css'
import '../styles/main.css'

const TICKER_DURATION = 60 // .ticker-content 애니메이션 duration(초)과 동일하게 유지
let tickerStartedAt = null // 모듈 스코프: 기사 상세로 이동했다 돌아와도 흘러간 시간을 유지

function loadInterests() {
  try { return JSON.parse(localStorage.getItem('interestCategories') || '[]') } catch { return [] }
}

export default function MainPage() {
  const navigate = useNavigate()
  const { isLoggedIn, logout } = useAuth()
  const { isRead } = useReadArticles()

  // URL ?category= 를 단일 소스로 사용 — 검색 등 다른 페이지에서 /?category=정치 로 진입 가능
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategory = searchParams.get('category') || '전체'
  // { category, articles } — 어느 카테고리의 결과인지 함께 담아 로딩 상태를 렌더 중에 파생
  const [hotData, setHotData] = useState({ category: null, articles: [] })
  const [latestArticles, setLatestArticles] = useState([])
  const [breakingNews, setBreakingNews] = useState([])
  const [categoryBlocks, setCategoryBlocks] = useState({})
  const [todaySummaries, setTodaySummaries] = useState(null) // null = 로딩 중
  const [openSummaryId, setOpenSummaryId] = useState(null) // 펼쳐진 요약 카드 (한 번에 하나)
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
      articlesApi.getTodaySummaries().catch(() => []),
    ]).then(([breaking, latest, summaries]) => {
      setBreakingNews(breaking)
      setLatestArticles(latest)
      setTodaySummaries(summaries)
    })
  }, [])

  // 카테고리별 뉴스 블록 — 로그인 + 관심 카테고리가 있을 때만 표시
  const blockCategories = isLoggedIn && interests.length > 0 ? interests : []

  useEffect(() => {
    if (blockCategories.length === 0) return
    Promise.all(
      blockCategories.map(cat =>
        articlesApi.getByCategory(cat, 'latest', 1)
          .then(d => d?.articles ?? [])
          .catch(() => [])
      )
    ).then(lists => {
      const map = {}
      blockCategories.forEach((cat, i) => { map[cat] = lists[i].slice(0, 4) })
      setCategoryBlocks(map)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockCategories.join(',')])

  // 아직 현재 카테고리의 응답을 받지 못했으면 로딩 중
  const isLoading = hotData.category !== activeCategory
  const hotArticles = isLoading ? [] : hotData.articles

  // Load hot articles when category changes
  useEffect(() => {
    let cancelled = false // 카테고리를 빠르게 바꿀 때 늦게 도착한 이전 응답이 덮어쓰지 않도록
    articlesApi.getHot(activeCategory)
      .then(articles => { if (!cancelled) setHotData({ category: activeCategory, articles }) })
      .catch(() => { if (!cancelled) setHotData({ category: activeCategory, articles: [] }) })
    return () => { cancelled = true }
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
            <img src="/favicon.png" alt="" className="logo-mark" />
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
        {/* 오늘의 뉴스 — AI가 요약한 기사 */}
        <section className="today-section">
          <div className="today-header">
            <h2 className="section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              오늘의 뉴스
              <span className="today-ai-tag">AI 요약</span>
            </h2>
            <span className="today-date">{formatToday()}</span>
          </div>

          {todaySummaries === null && <p className="today-empty">요약을 불러오는 중...</p>}

          {todaySummaries?.length === 0 && (
            <p className="today-empty">아직 요약된 기사가 없습니다.</p>
          )}

          {todaySummaries?.length > 0 && (
            <div className="today-list">
              {todaySummaries.map(a => {
                const open = openSummaryId === a.id
                return (
                  <article key={a.id} className={`today-card${open ? ' is-open' : ''}`}>
                    <button
                      type="button"
                      className="today-card-btn"
                      aria-expanded={open}
                      aria-controls={`today-summary-${a.id}`}
                      onClick={() => setOpenSummaryId(open ? null : a.id)}
                    >
                      <span className="today-card-head">
                        {a.category && (
                          <span className="cat-badge small" style={{ background: CATEGORY_COLOR[a.category] }}>
                            {a.category}
                          </span>
                        )}
                        <span className="article-time">{timeAgo(a.publishedAt)}</span>
                        {a.source && <span className="article-source">{a.source}</span>}
                      </span>
                      <span className={`today-title${isRead(a.id) ? ' title-read' : ''}`}>{a.title}</span>
                      <svg
                        className="today-chevron"
                        width="18" height="18" viewBox="0 0 24 24"
                        fill="none" stroke="currentColor" strokeWidth="2.5"
                        strokeLinecap="round" strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    <div className="today-panel" id={`today-summary-${a.id}`}>
                      <div className="today-panel-inner">
                        <p className="today-summary">{a.summary || '요약이 없습니다.'}</p>
                        <button
                          type="button"
                          className="btn-hot-more"
                          onClick={() => navigate(`/articles/${a.id}`)}
                        >
                          기사 전문 보기 →
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

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

        {/* 카테고리별 뉴스 블록 */}
        {blockCategories.length === 0 && (
          <section className="cat-blocks-placeholder">
            {isLoggedIn ? (
              <>
                <p className="cat-blocks-placeholder-text">설정된 관심 카테고리가 없습니다.</p>
                <button className="btn-hot-more" onClick={() => navigate('/mypage')}>
                  마이페이지에서 설정하기 →
                </button>
              </>
            ) : (
              <>
                <p className="cat-blocks-placeholder-text">로그인하면 관심 카테고리별 뉴스를 볼 수 있어요.</p>
                <button className="btn-hot-more" onClick={() => navigate('/login')}>
                  로그인하기 →
                </button>
              </>
            )}
          </section>
        )}
        <div className="cat-blocks">
          {blockCategories.map(cat => (
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
