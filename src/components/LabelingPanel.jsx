import { useState, useEffect, useCallback } from 'react'
import { adminApi } from '../api/admin'

const BATCH_SIZE = 20

// 버튼을 낮음→보통→중요 순으로 두어 숫자키 1·2·3이 화면 순서와 그대로 맞물리게 한다.
const LABELS = [
  { key: 'LOW', name: '낮음', hint: '놓쳐도 그만', shortcut: '1' },
  { key: 'MEDIUM', name: '보통', hint: '관심 있으면', shortcut: '2' },
  { key: 'HIGH', name: '중요', hint: '놓치면 안 됨', shortcut: '3' },
]

const FILTERS = [
  { key: 'ALL', label: '전체' },
  { key: 'NO_SEED', label: 'AI 미라벨' },
  { key: 'SEED_ONLY', label: 'AI 라벨분' },
]

const ROUNDS = [
  { value: 0, label: '1회차 (첫 라벨)' },
  { value: 1, label: '2회차 (자기일치율)' },
]

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('ko-KR', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

function AgreementStat({ label, data, description }) {
  const hasData = data && data.compared > 0
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{hasData ? `${data.rate}%` : '—'}</div>
      <div className="stat-sub">
        {hasData ? `${data.matched} / ${data.compared}건 일치` : description}
      </div>
    </div>
  )
}

function GuideSheet() {
  const [open, setOpen] = useState(false)
  return (
    <div className={`labeling-guide${open ? ' open' : ''}`}>
      <button className="labeling-guide-toggle" onClick={() => setOpen(v => !v)}>
        <span>판정 기준 요약</span>
        <span className={`chevron${open ? ' open' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="labeling-guide-body">
          <p className="guide-lead">
            기준은 “사건이 얼마나 큰가”가 아니라 <strong>“이 기사를 놓치면 독자가 손해를 보는가”</strong>다.
          </p>
          <dl>
            <dt>1단계 · 형식으로 걸러지는 LOW</dt>
            <dd>
              [게시판] [부고] [동정] [인사] [신간] [내일날씨] 말머리, 지자체 보도자료
              (○○시, ~ 모집/개최), MOU 체결, 증권사 목표주가. 내용을 보지 않고 낮음.
              [특징주]는 등락 자체면 낮음, 원인이 되는 사실이 크면 보통.
            </dd>
            <dt>2단계 · 카테고리 사전확률 (HIGH 비율)</dt>
            <dd>
              정치 41% · IT/과학 36% · 세계 31% · 사회 21% · 경제 6% · 연예/문화 3% · 스포츠 0%.
              경제·스포츠·연예에서 중요를 매길 땐 축 2개를 실제로 충족하는지 재확인한다.
            </dd>
            <dt>3단계 · 다섯 축 (2점 이상 중요 / 1점 보통 / 0점 낮음)</dt>
            <dd>
              <strong>① 파급 범위</strong> 전국 단위 이상인가 ·
              <strong> ② 불가역성</strong> 사망·선고·기소·확정 등 되돌릴 수 없는 일인가 ·
              <strong> ③ 행동 변화</strong> 독자가 오늘 뭔가 다르게 해야 하는가
              (개인의 돈·자격을 바꾸는 제도는 추진 단계여도 충족) ·
              <strong> ④ 지속성</strong> 내일도 이어질 사안인가 ·
              <strong> ⑤ 보도 밀도</strong> 같은 사건 기사 10건 이상.
              단, ①~④가 0점인데 ⑤만으로 중요를 주지 않는다. 가십도 보도량은 많다.
            </dd>
            <dt>중복 사건</dt>
            <dd>한 사건당 중요는 1건. 대표는 (종합)·마지막 보, 나머지는 보통으로 내린다.</dd>
          </dl>
        </div>
      )}
    </div>
  )
}

export default function LabelingPanel() {
  const [queue, setQueue] = useState([])
  const [cursor, setCursor] = useState(0)
  const [decisions, setDecisions] = useState({})
  const [round, setRound] = useState(0)
  const [filter, setFilter] = useState('ALL')
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [exhausted, setExhausted] = useState(false)
  const [savedCount, setSavedCount] = useState(0)

  const fetchStats = useCallback(() => {
    adminApi.getLabelingStats()
      .then(setStats)
      .catch(() => setStats(null))
  }, [])

  const fetchQueue = useCallback((append = false) => {
    setIsLoading(true)
    setError(null)
    return adminApi.getLabelingQueue({ size: BATCH_SIZE, round, filter })
      .then(data => {
        const list = data?.articles ?? []
        setExhausted(list.length === 0)
        if (append) {
          setQueue(prev => [...prev, ...list])
        } else {
          setQueue(list)
          setCursor(0)
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [round, filter])

  // 회차·필터가 바뀌면 다른 모집단이므로 큐를 처음부터 다시 받는다.
  useEffect(() => {
    setDecisions({})
    setSavedCount(0)
    fetchQueue(false)
    fetchStats()
  }, [fetchQueue, fetchStats])

  const current = queue[cursor]

  const handleLabel = useCallback(async (labelKey) => {
    const article = queue[cursor]
    if (!article || isSaving) return
    setIsSaving(true)
    setError(null)
    try {
      await adminApi.labelArticle(article.id, labelKey, round)
      setDecisions(prev => ({ ...prev, [article.id]: labelKey }))
      setSavedCount(c => c + 1)
      const nextCursor = cursor + 1
      setCursor(nextCursor)
      // 큐 끝에 닿으면 이어서 받아온다. 빈 응답이 오면 exhausted 가 서고 완료 화면으로 넘어간다.
      if (nextCursor >= queue.length && !exhausted) {
        fetchQueue(true)
        fetchStats()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }, [queue, cursor, isSaving, round, exhausted, fetchQueue, fetchStats])

  // 숫자키 1·2·3으로도 매길 수 있게 한다. 300건을 넘기려면 마우스만으로는 느리다.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const hit = LABELS.find(l => l.shortcut === e.key)
      if (hit) {
        e.preventDefault()
        handleLabel(hit.key)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleLabel])

  const distribution = stats?.distribution ?? {}
  const isDone = !current && exhausted && !isLoading

  return (
    <>
      <div className="admin-stats labeling-stats">
        <div className="stat-card">
          <div className="stat-label">내가 매긴 라벨</div>
          <div className="stat-value">{stats?.total ?? 0}</div>
          <div className="stat-sub">이번 세션 {savedCount}건</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">등급 분포</div>
          <div className="stat-distribution">
            {LABELS.slice().reverse().map(l => (
              <span key={l.key} className={`dist-chip ${l.key}`}>
                {l.name} {distribution[l.key] ?? 0}
              </span>
            ))}
          </div>
          <div className="stat-sub">기준 {stats?.guideVersion ?? '—'}</div>
        </div>
        <AgreementStat
          label="AI 시드 일치율"
          data={stats?.seedAgreement}
          description="AI가 매긴 기사를 라벨링하면 계산된다"
        />
        <AgreementStat
          label="자기 일치율"
          data={stats?.selfAgreement}
          description="2회차로 다시 매기면 계산된다"
        />
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h2>중요도 라벨링</h2>
          <div className="labeling-controls">
            <select
              className="labeling-select"
              value={round}
              onChange={e => setRound(Number(e.target.value))}
            >
              {ROUNDS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
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
        </div>

        <GuideSheet />

        {error && (
          <div className="admin-error labeling-error">
            <p>{error}</p>
            <button className="btn-retry" onClick={() => fetchQueue(false)}>다시 시도</button>
          </div>
        )}

        {isLoading && !current && <div className="admin-loading">기사를 불러오는 중...</div>}

        {isDone && (
          <div className="labeling-done">
            <div className="labeling-done-icon">✓</div>
            <h3>이 조건의 기사를 모두 라벨링했습니다</h3>
            <p>필터나 회차를 바꾸면 다른 기사를 볼 수 있습니다.</p>
          </div>
        )}

        {current && (
          <>
            <div className="labeling-progress">
              <div className="labeling-progress-bar">
                <div
                  className="labeling-progress-fill"
                  style={{ width: `${(cursor / queue.length) * 100}%` }}
                />
              </div>
              <span className="labeling-progress-text">
                {cursor + 1} / {queue.length}
              </span>
            </div>

            <article className="labeling-card">
              <div className="labeling-card-meta">
                <span className="labeling-category">{current.category ?? '미분류'}</span>
                <span className="labeling-source">{current.source ?? '출처 없음'}</span>
                <span className="labeling-date">{formatDate(current.publishedAt)}</span>
              </div>
              <h3 className="labeling-title">{current.title}</h3>
              <p className="labeling-content">{current.content || '요약이 없습니다.'}</p>
              {current.articleUrl && (
                <a
                  className="labeling-origin-link"
                  href={current.articleUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  원문 열어보기 ↗
                </a>
              )}
            </article>

            <div className="labeling-buttons">
              {LABELS.map(l => (
                <button
                  key={l.key}
                  className={`labeling-btn ${l.key}${decisions[current.id] === l.key ? ' chosen' : ''}`}
                  onClick={() => handleLabel(l.key)}
                  disabled={isSaving}
                >
                  <span className="labeling-btn-key">{l.shortcut}</span>
                  <span className="labeling-btn-name">{l.name}</span>
                  <span className="labeling-btn-hint">{l.hint}</span>
                </button>
              ))}
            </div>

            <div className="labeling-footer">
              <button
                className="labeling-back"
                onClick={() => setCursor(c => Math.max(0, c - 1))}
                disabled={cursor === 0 || isSaving}
              >
                ← 이전 기사 다시 매기기
              </button>
              <span className="labeling-hint">숫자키 1·2·3으로도 매길 수 있습니다</span>
            </div>
          </>
        )}
      </div>
    </>
  )
}
