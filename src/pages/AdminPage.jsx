import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../api/admin'
import LabelingPanel from '../components/LabelingPanel'
import '../styles/admin.css'

const NAV_ITEMS = [
  { key: 'suggestions', label: '건의함', icon: '💬', available: true },
  { key: 'labeling', label: '중요도 라벨링', icon: '🏷️', available: true },
  { key: 'members', label: '회원 관리', icon: '👥', available: false },
  { key: 'content', label: '콘텐츠 관리', icon: '📰', available: false },
  { key: 'settings', label: '설정', icon: '⚙️', available: false },
]

const FILTERS = [
  { key: 'ALL', label: '전체' },
  { key: 'PENDING', label: '미처리' },
  { key: 'IN_PROGRESS', label: '처리 중' },
  { key: 'RESOLVED', label: '처리 완료' },
]

const STATUS_LABEL = {
  PENDING: '미처리',
  IN_PROGRESS: '처리 중',
  RESOLVED: '처리 완료',
}

function SuggestionItem({ item, onStatusChange, onDelete }) {
  const [expanded, setExpanded] = useState(false)

  const nextStatus = item.status === 'PENDING'
    ? 'IN_PROGRESS'
    : item.status === 'IN_PROGRESS'
      ? 'RESOLVED'
      : null

  const nextLabel = nextStatus === 'IN_PROGRESS' ? '처리 중으로' : '처리 완료'

  return (
    <div className="suggestion-item">
      <div className="suggestion-row" onClick={() => setExpanded(v => !v)}>
        <div className="suggestion-meta">
          <div className="suggestion-author-row">
            <span className="suggestion-author">{item.userEmail ?? '알 수 없음'}</span>
            <span className="suggestion-date">
              {new Date(item.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric', month: '2-digit', day: '2-digit',
              })}
            </span>
            <span className={`status-badge ${item.status}`}>
              {STATUS_LABEL[item.status] ?? item.status}
            </span>
          </div>
          <p className="suggestion-preview">{item.content}</p>
        </div>
        <div className="suggestion-actions" onClick={e => e.stopPropagation()}>
          {nextStatus && (
            <button
              className="btn-resolve"
              onClick={() => onStatusChange(item.id, nextStatus)}
            >
              {nextLabel}
            </button>
          )}
          <button className="btn-delete" onClick={() => onDelete(item.id)}>
            삭제
          </button>
        </div>
        <span className={`chevron${expanded ? ' open' : ''}`}>▼</span>
      </div>
      {expanded && (
        <div className="suggestion-detail">{item.content}</div>
      )}
    </div>
  )
}

function SuggestionsPanel() {
  const [suggestions, setSuggestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('ALL')

  const fetchSuggestions = () => {
    setIsLoading(true)
    setError(null)
    adminApi.getSuggestions()
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.suggestions ?? data?.content ?? [])
        setSuggestions(list)
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => { fetchSuggestions() }, [])

  const handleStatusChange = async (id, status) => {
    try {
      await adminApi.updateSuggestionStatus(id, status)
      setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('이 건의사항을 삭제하시겠습니까?')) return
    try {
      await adminApi.deleteSuggestion(id)
      setSuggestions(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  const filtered = useMemo(() => {
    if (filter === 'ALL') return suggestions
    return suggestions.filter(s => s.status === filter)
  }, [suggestions, filter])

  const pendingCount = suggestions.filter(s => s.status === 'PENDING').length
  const inProgressCount = suggestions.filter(s => s.status === 'IN_PROGRESS').length
  const resolvedCount = suggestions.filter(s => s.status === 'RESOLVED').length

  return (
    <>
      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-label">전체 건의사항</div>
          <div className="stat-value">{suggestions.length}</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-label">미처리</div>
          <div className="stat-value">{pendingCount}</div>
        </div>
        <div className="stat-card in-progress">
          <div className="stat-label">처리 중</div>
          <div className="stat-value">{inProgressCount}</div>
        </div>
        <div className="stat-card resolved">
          <div className="stat-label">처리 완료</div>
          <div className="stat-value">{resolvedCount}</div>
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h2>건의사항 목록</h2>
          <div className="filter-tabs">
            {FILTERS.map(f => (
              <button
                key={f.key}
                className={`filter-tab${filter === f.key ? ' active' : ''}`}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && <div className="admin-loading">불러오는 중...</div>}

        {error && (
          <div className="admin-error">
            <p>{error}</p>
            <button className="btn-retry" onClick={fetchSuggestions}>다시 시도</button>
          </div>
        )}

        {!isLoading && !error && (
          filtered.length === 0 ? (
            <div className="suggestion-empty">건의사항이 없습니다.</div>
          ) : (
            <div className="suggestion-list">
              {filtered.map(item => (
                <SuggestionItem
                  key={item.id}
                  item={item}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )
        )}
      </div>
    </>
  )
}

function ComingSoonPanel({ label }) {
  return (
    <div className="admin-coming-soon">
      <div className="coming-soon-icon">🚧</div>
      <h3>{label}</h3>
      <p>준비 중인 기능입니다.</p>
    </div>
  )
}

export default function AdminPage() {
  const navigate = useNavigate()
  const [activeNav, setActiveNav] = useState('suggestions')

  const activeItem = NAV_ITEMS.find(n => n.key === activeNav)

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-header-left">
            <h1>관리자 페이지</h1>
            <span className="admin-badge">ADMIN</span>
          </div>
          <button className="admin-home-btn" onClick={() => navigate('/')}>
            ← 홈으로
          </button>
        </div>
      </header>

      <div className="admin-body">
        <nav className="admin-sidebar">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={`admin-nav-item${activeNav === item.key ? ' active' : ''}${!item.available ? ' disabled' : ''}`}
              onClick={() => item.available && setActiveNav(item.key)}
              disabled={!item.available}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {!item.available && <span className="nav-soon">준비 중</span>}
            </button>
          ))}
        </nav>

        <main className="admin-content">
          {!activeItem?.available && <ComingSoonPanel label={activeItem?.label ?? ''} />}
          {activeNav === 'suggestions' && <SuggestionsPanel />}
          {activeNav === 'labeling' && <LabelingPanel />}
        </main>
      </div>
    </div>
  )
}
