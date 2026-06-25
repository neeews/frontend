import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { articlesApi } from '../api/articles'
import { timeAgo } from '../utils/time'
import '../styles/category.css'

const categoryColor = {
  '경제': '#10b981',
  '연예/문화': '#f59e0b',
  '정치': '#3b82f6',
  'IT/과학': '#8b5cf6',
  '스포츠': '#ef4444',
  '사회': '#64748b',
  '세계': '#0ea5e9',
}

export default function CategoryPage() {
  const { name } = useParams()
  const navigate = useNavigate()
  const [articles, setArticles] = useState([])
  const [sort, setSort] = useState('latest')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    setArticles([])
    setPage(1)
    articlesApi.getByCategory(name, sort, 1)
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.articles ?? [])
        setArticles(list)
        setHasMore(list.length >= 12)
      })
      .catch(() => setArticles([]))
      .finally(() => setIsLoading(false))
  }, [name, sort])

  const loadMore = () => {
    const next = page + 1
    setLoadingMore(true)
    articlesApi.getByCategory(name, sort, next)
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.articles ?? [])
        setArticles(prev => [...prev, ...list])
        setHasMore(list.length >= 12)
        setPage(next)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }

  return (
    <div className="category-page">
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
            {articles.map(a => (
              <div
                key={a.id}
                className="cat-article-card"
                onClick={() => navigate(`/articles/${a.id}`)}
              >
                <div className="cat-card-body">
                  {a.category && (
                    <span
                      className="cat-badge"
                      style={{ background: categoryColor[a.category] ?? '#64748b' }}
                    >
                      {a.category}
                    </span>
                  )}
                  <p className="cat-card-title">{a.title}</p>
                  <div className="cat-card-byline">
                    <span className="article-time">{timeAgo(a.publishedAt)}</span>
                    {a.source && <span className="article-source">{a.source}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="load-more-wrap">
            <button
              className="btn-load-more"
              onClick={loadMore}
              disabled={loadingMore}
            >
              {loadingMore ? '불러오는 중...' : '더 보기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
