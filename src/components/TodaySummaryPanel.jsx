import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { articlesApi } from '../api/articles'
import { useReadArticles } from '../hooks/useReadArticles'
import { timeAgo, formatToday } from '../utils/time'
import { CATEGORY_COLOR } from '../constants/categories'
import '../styles/today.css'

export default function TodaySummaryPanel({ open, onToggle }) {
  const navigate = useNavigate()
  const { isRead } = useReadArticles()
  const [summaries, setSummaries] = useState(null) // null = 아직 안 받아옴

  // 처음 열릴 때 한 번만 조회
  useEffect(() => {
    if (!open || summaries !== null) return
    let cancelled = false
    articlesApi.getTodaySummaries()
      .then(list => { if (!cancelled) setSummaries(list) })
      .catch(() => { if (!cancelled) setSummaries([]) })
    return () => { cancelled = true }
  }, [open, summaries])

  // 열려 있는 동안 Esc로 닫고 배경 스크롤을 막는다
  useEffect(() => {
    if (!open) return
    const onKeyDown = e => { if (e.key === 'Escape') onToggle() }
    document.addEventListener('keydown', onKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onToggle])

  return (
    <>
      {open && (
        <div className="today-backdrop" onClick={onToggle}>
          <div
            className="today-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="오늘의 뉴스 AI 요약"
            onClick={e => e.stopPropagation()}
          >
            <header className="today-pop-head">
              <div>
                <h2 className="today-pop-title">
                  오늘의 뉴스
                  <span className="today-ai-tag">AI 요약</span>
                </h2>
                <p className="today-pop-date">{formatToday()}</p>
              </div>
              <button type="button" className="today-close-btn" onClick={onToggle} aria-label="닫기">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </header>

            <div className="today-pop-body">
              {summaries === null && <p className="today-empty">요약을 불러오는 중...</p>}

              {summaries?.length === 0 && (
                <p className="today-empty">아직 요약된 기사가 없습니다.</p>
              )}

              {summaries?.length > 0 && (
                <div className="today-list">
                  {summaries.map(a => (
                    <article
                      key={a.id}
                      className="today-card"
                      onClick={() => { onToggle(); navigate(`/articles/${a.id}`) }}
                    >
                      <div className="today-card-head">
                        {a.category && (
                          <span className="cat-badge small" style={{ background: CATEGORY_COLOR[a.category] }}>
                            {a.category}
                          </span>
                        )}
                        <span className="article-time">{timeAgo(a.publishedAt)}</span>
                        {a.source && <span className="article-source">{a.source}</span>}
                      </div>
                      <h3 className={`today-title${isRead(a.id) ? ' title-read' : ''}`}>{a.title}</h3>
                      <p className="today-summary">{a.summary || '요약이 없습니다.'}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="today-fab-wrap">
        <button
          type="button"
          className={`today-fab${open ? ' is-open' : ''}`}
          onClick={onToggle}
          aria-expanded={open}
          aria-label={open ? '오늘의 뉴스 닫기' : '오늘의 뉴스 AI 요약 열기'}
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          )}
          <span className="today-fab-label">오늘의 뉴스</span>
        </button>
      </div>
    </>
  )
}
