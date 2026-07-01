import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { articlesApi } from '../api/articles'
import { timeAgo } from '../utils/time'
import { useBookmark } from '../hooks/useBookmark'
import CategoryNav from '../components/CategoryNav'
import '../styles/article.css'

function parseContent(raw) {
  if (!raw) return []
  const withBreaks = raw
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
  const stripped = withBreaks.replace(/<[^>]*>/g, '')
  const ta = document.createElement('textarea')
  ta.innerHTML = stripped
  return ta.value.split('\n\n').map(p => p.trim()).filter(Boolean)
}

const categoryColor = {
  '경제': '#10b981',
  '연예/문화': '#f59e0b',
  '정치': '#3b82f6',
  'IT/과학': '#8b5cf6',
  '스포츠': '#ef4444',
  '사회': '#64748b',
  '세계': '#0ea5e9',
}

export default function ArticleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [related, setRelated] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const { isBookmarked, toggle: toggleBookmark, loading: bookmarkLoading } = useBookmark(
    id,
    article?.isBookmarked ?? false
  )

  useEffect(() => {
    setIsLoading(true)
    setError('')
    articlesApi.getById(id)
      .then(data => {
        setArticle(data?.article ?? null)
        setRelated(data?.related ?? [])
      })
      .catch(() => setError('기사를 불러올 수 없습니다.'))
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) return <div className="page-loading">불러오는 중...</div>
  if (error || !article) {
    return (
      <div className="page-error">
        <p>{error || '기사를 찾을 수 없습니다.'}</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: 16, cursor: 'pointer' }}>
          뒤로 가기
        </button>
      </div>
    )
  }

  return (
    <div className="article-page">
      <header className="article-top-nav">
        <div className="article-top-nav-inner">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← 뒤로
          </button>
          <Link to="/" className="nav-logo">뉴스피드</Link>
        </div>
      </header>

      <div className="page-category-bar">
        <div className="page-category-bar-inner">
          <CategoryNav
            activeCategory={article.category}
            onSelect={cat => navigate(`/category/${encodeURIComponent(cat)}`)}
          />
        </div>
      </div>

      <article className="article-container">
        <div className="article-meta">
          {article.category && (
            <span
              className="cat-badge"
              style={{ background: categoryColor[article.category] ?? '#64748b' }}
            >
              {article.category}
            </span>
          )}
          <span className="article-time">{timeAgo(article.publishedAt)}</span>
          {article.source && <span className="article-source">{article.source}</span>}
        </div>

        <h1 className="article-title">{article.title}</h1>

        {article.imageUrl ? (
          <img
            src={/\/api\/images\//.test(article.imageUrl)
              ? article.imageUrl
              : `/api/images/proxy?url=${encodeURIComponent(article.imageUrl)}&w=800`}
            alt={article.title}
            className="article-hero-img"
          />
        ) : (
          <div className="article-hero-placeholder" />
        )}

        <div className="article-body">
          {parseContent(article.content ?? article.summary ?? '').map((paragraph, i) => (
            <p key={i} style={{ marginBottom: '18px' }}>{paragraph}</p>
          ))}
        </div>

        <div className="article-actions">
          <button
            className={`action-btn bookmark-btn${isBookmarked ? ' active' : ''}`}
            onClick={toggleBookmark}
            disabled={bookmarkLoading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            {isBookmarked ? '북마크 취소' : '북마크'}
          </button>
          {article.articleUrl && (
            <a
              className="action-btn source-btn"
              href={article.articleUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              원문 보기
            </a>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section className="related-section">
          <h2>관련 기사</h2>
          <div className="related-list">
            {related.map(a => (
              <div key={a.id} className="related-item" onClick={() => navigate(`/articles/${a.id}`)}>
                <div className="related-item-body">
                  <div className="article-byline" style={{ marginBottom: 6 }}>
                    {a.category && (
                      <span
                        className="cat-badge small"
                        style={{ background: categoryColor[a.category] ?? '#64748b' }}
                      >
                        {a.category}
                      </span>
                    )}
                    <span className="article-time">{timeAgo(a.publishedAt)}</span>
                    {a.source && <span className="article-source">{a.source}</span>}
                  </div>
                  <p className="related-title">{a.title}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
