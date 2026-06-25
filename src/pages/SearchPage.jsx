import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { articlesApi } from '../api/articles'
import { timeAgo } from '../utils/time'
import '../styles/search.css'

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
  const navigate = useNavigate()

  const [inputValue, setInputValue] = useState(q)
  const [articles, setArticles] = useState([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState(loadRecent)
  const [showRecent, setShowRecent] = useState(false)

  useEffect(() => {
    setInputValue(q)
    if (!q.trim()) { setArticles([]); return }
    setIsLoading(true)
    articlesApi.search(q)
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.articles ?? [])
        setArticles(list)
        setTotal(data?.total ?? list.length)
      })
      .catch(() => setArticles([]))
      .finally(() => setIsLoading(false))
  }, [q])

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
    setSearchParams({ q: trimmed })
  }

  const clickRecent = (keyword) => {
    setInputValue(keyword)
    saveSearch(keyword)
    setShowRecent(false)
    setSearchParams({ q: keyword })
  }

  return (
    <div className="search-page">
      <header className="search-page-header">
        <div className="search-page-header-inner">
          <button className="back-btn" onClick={() => navigate(-1)}>← 뒤로</button>
          <div className="search-form-wrap">
            <form className="search-form" onSubmit={submit}>
              <input
                className="search-input"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder="검색어를 입력하세요"
                autoFocus
                onFocus={() => setShowRecent(true)}
                onBlur={() => setTimeout(() => setShowRecent(false), 150)}
              />
              <button type="submit" className="search-submit-btn">검색</button>
            </form>

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
        </div>
      </header>

      <div className="search-content">
        {q && !isLoading && (
          <p className="search-result-summary">
            <strong>"{q}"</strong> 검색 결과 {total.toLocaleString()}건
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
            {articles.map(a => (
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
                    className="search-result-title"
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
