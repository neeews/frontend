import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { articlesApi } from '../api/articles'
import { useReadArticles } from '../hooks/useReadArticles'
import { timeAgo } from '../utils/time'
import CategoryNav from '../components/CategoryNav'
import '../styles/brand.css'
import '../styles/search.css'

const CATEGORIES = ['경제', '정치', '사회', 'IT/과학', '연예/문화', '스포츠', '세계']
const SOURCES = ['연합뉴스', '동아일보', '경향신문', '한겨레', '한국경제', '전자신문', 'ZDnet코리아']

const categoryColor = {
  '경제': '#10b981',
  '연예/문화': '#f59e0b',
  '정치': '#3b82f6',
  'IT/과학': '#8b5cf6',
  '스포츠': '#ef4444',
  '사회': '#64748b',
  '세계': '#0ea5e9',
}

function highlight(text, query) {
  if (!query || !text) return text ?? ''
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark>$1</mark>')
}

function loadRecent() {
  try { return JSON.parse(localStorage.getItem('recentSearches') || '[]') } catch { return [] }
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const filterFromUrl = searchParams.get('filter') ?? ''
  const navigate = useNavigate()
  const { isRead } = useReadArticles()

  const [inputValue, setInputValue] = useState(q)
  const [activeFilter, setActiveFilter] = useState(filterFromUrl)
  const [showFilterDrop, setShowFilterDrop] = useState(false)
  const [articles, setArticles] = useState([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState(loadRecent)
  const [showRecent, setShowRecent] = useState(false)

  const filterRef = useRef(null)

  // URL의 q/filter가 바뀌면 입력창·필터 표시를 동기화 (렌더 중 조정, effect 아님)
  const searchKey = `${q}|${filterFromUrl}`
  const [prevSearchKey, setPrevSearchKey] = useState(searchKey)
  if (searchKey !== prevSearchKey) {
    setPrevSearchKey(searchKey)
    setInputValue(q)
    setActiveFilter(filterFromUrl)
    if (!q.trim()) setArticles([])
  }

  useEffect(() => {
    if (!q.trim()) return
    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      try {
        const data = await articlesApi.search(q, filterFromUrl)
        if (cancelled) return
        setArticles(data?.articles ?? [])
        setTotal(data?.total ?? 0)
      } catch {
        if (!cancelled) setArticles([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [q, filterFromUrl])

  useEffect(() => {
    const handler = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilterDrop(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const buildParams = (newQ, filter) => {
    const params = { q: newQ }
    if (filter) params.filter = filter
    return params
  }

  const saveSearch = (query) => {
    setRecentSearches(prev => {
      const updated = [query, ...prev.filter(i => i !== query)].slice(0, 5)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
      return updated
    })
  }

  const removeSearch = (query) => {
    setRecentSearches(prev => {
      const updated = prev.filter(i => i !== query)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
      if (updated.length === 0) setShowRecent(false)
      return updated
    })
  }

  const clearSearches = () => {
    localStorage.removeItem('recentSearches')
    setRecentSearches([])
  }

  const submit = e => {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed) return
    saveSearch(trimmed)
    setShowRecent(false)
    setSearchParams(buildParams(trimmed, activeFilter))
  }

  const clickRecent = (keyword) => {
    setInputValue(keyword)
    saveSearch(keyword)
    setShowRecent(false)
    setSearchParams(buildParams(keyword, activeFilter))
  }

  const applyFilter = (value) => {
    const next = value === activeFilter ? '' : value
    setActiveFilter(next)
    setShowFilterDrop(false)
    if (q.trim()) setSearchParams(buildParams(q, next))
  }

  const clearFilter = (e) => {
    e.stopPropagation()
    setActiveFilter('')
    setShowFilterDrop(false)
    if (q.trim()) setSearchParams(buildParams(q, ''))
  }

  return (
    <div className="search-page">
      <header className="search-page-header">
        <div className="search-page-header-top">
          <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
            <span className="logo-mark">N</span>
            <span className="logo-text">neeews</span>
          </Link>

          <CategoryNav onSelect={cat => navigate(`/category/${encodeURIComponent(cat)}`)} />
        </div>

        <div className="search-page-header-inner">
          <button className="back-btn" onClick={() => navigate(-1)}>← 뒤로</button>

          <form className="search-form" onSubmit={submit}>
            {/* 검색 입력 + 최근 검색어 드롭다운 */}
            <div className="search-input-wrap">
              <input
                className="search-input"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="검색어를 입력하세요"
                autoFocus
                onClick={() => setShowRecent(true)}
                onBlur={() => setTimeout(() => setShowRecent(false), 150)}
              />
              {showRecent && !inputValue && recentSearches.length > 0 && (
                <div className="recent-searches">
                  <div className="recent-header">
                    <span className="recent-label">최근 검색어</span>
                    <button className="recent-clear-all" onClick={clearSearches}>전체 삭제</button>
                  </div>
                  {recentSearches.map(keyword => (
                    <div key={keyword} className="recent-item" onClick={() => clickRecent(keyword)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <span className="recent-item-text">{keyword}</span>
                      <button
                        className="recent-remove"
                        onClick={e => { e.stopPropagation(); removeSearch(keyword) }}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 필터 드롭다운 */}
            <div className="filter-drop-wrap" ref={filterRef}>
              <button
                type="button"
                className={`filter-drop-btn${activeFilter ? ' active' : ''}`}
                onClick={() => setShowFilterDrop(v => !v)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
                </svg>
                <span>{activeFilter || '필터'}</span>
                {activeFilter && (
                  <span className="filter-clear-x" onClick={clearFilter}>×</span>
                )}
              </button>

              {showFilterDrop && (
                <div className="filter-dropdown">
                  <div className="filter-section">
                    <div className="filter-section-label">카테고리</div>
                    <div className="filter-chips">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          className={`filter-chip${activeFilter === cat ? ' active' : ''}`}
                          onClick={() => applyFilter(cat)}
                        >{cat}</button>
                      ))}
                    </div>
                  </div>
                  <div className="filter-divider" />
                  <div className="filter-section">
                    <div className="filter-section-label">언론사</div>
                    <div className="filter-chips">
                      {SOURCES.map(src => (
                        <button
                          key={src}
                          type="button"
                          className={`filter-chip${activeFilter === src ? ' active' : ''}`}
                          onClick={() => applyFilter(src)}
                        >{src}</button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="search-submit-btn">검색</button>
          </form>
        </div>
      </header>

      <div className="search-content">
        {q && !isLoading && (
          <p className="search-result-count">
            <strong>"{q}"</strong>
            {activeFilter && <span className="search-filter-tag">{activeFilter}</span>}
            {' '}검색 결과 {total.toLocaleString()}건
          </p>
        )}

        {isLoading && <div className="search-loading">검색 중...</div>}

        {!isLoading && q && articles.length === 0 && (
          <div className="search-empty">
            <div className="search-empty-icon">🔍</div>
            <p>검색 결과가 없습니다.</p>
          </div>
        )}

        {!isLoading && articles.length > 0 && (
          <div className="search-result-list">
            {articles.map(a => {
              const read = a.isRead || isRead(a.id)
              return (
              <div
                key={a.id}
                className="search-result-item"
                onClick={() => navigate(`/articles/${a.id}`)}
              >
                <div className="search-result-body">
                  <div className="search-result-meta">
                    {a.category && (
                      <span
                        className="cat-badge"
                        style={{ background: categoryColor[a.category] ?? '#64748b' }}
                      >
                        {a.category}
                      </span>
                    )}
                    <span className="article-time">{timeAgo(a.publishedAt)}</span>
                    {a.source && <span className="article-source">{a.source}</span>}
                  </div>
                  <h3
                    className={`search-result-title${read ? ' title-read' : ''}`}
                    dangerouslySetInnerHTML={{ __html: highlight(a.title, q) }}
                  />
                  {a.summary && (
                    <p
                      className="search-result-summary-text"
                      dangerouslySetInnerHTML={{ __html: highlight(a.summary, q) }}
                    />
                  )}
                </div>
              </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
