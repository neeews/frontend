import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/main.css'

const CATEGORIES = ['전체', '정치', '경제', '사회', '연예/문화', '스포츠', '세계', 'IT/과학']

const KEYWORDS = [
  { rank: 1, word: '금리인하', change: 'up' },
  { rank: 2, word: '아이유 콘서트', change: 'up' },
  { rank: 3, word: '국민연금', change: 'same' },
  { rank: 4, word: '삼성전자', change: 'down' },
  { rank: 5, word: '월드컵 예선', change: 'up' },
  { rank: 6, word: '대통령 담화', change: 'new' },
  { rank: 7, word: '반도체 수출', change: 'up' },
  { rank: 8, word: '폭염 주의보', change: 'new' },
  { rank: 9, word: '비트코인', change: 'down' },
  { rank: 10, word: '넷플릭스 신작', change: 'same' },
]

const HOT_ARTICLES = [
  {
    id: 1,
    rank: 1,
    category: '경제',
    title: '한국은행, 기준금리 0.25%p 전격 인하… 2년 만의 변화',
    summary: '한국은행 금융통화위원회가 오늘 기준금리를 연 3.00%에서 2.75%로 인하했다.',
    time: '32분 전',
    source: '연합뉴스',
    hot: true,
  },
  {
    id: 2,
    rank: 2,
    category: '연예/문화',
    title: '아이유, 10월 서울 단독 콘서트 전석 매진… 추가 공연 검토 중',
    summary: '티켓 오픈 5분 만에 모든 좌석이 마감되며 뜨거운 인기를 재확인했다.',
    time: '1시간 전',
    source: '스포츠조선',
    hot: true,
  },
  {
    id: 3,
    rank: 3,
    category: '정치',
    title: '대통령, 국민 앞 대국민 담화… "민생 안정 최우선"',
    summary: '대통령은 오늘 오전 청와대 춘추관에서 경제 상황 관련 담화를 발표했다.',
    time: '2시간 전',
    source: 'KBS',
    hot: false,
  },
  {
    id: 4,
    rank: 4,
    category: 'IT/과학',
    title: '삼성전자 3분기 영업이익 9조 돌파… 반도체 부문 견인',
    summary: '반도체 수출 호조와 HBM 수요 증가로 예상치를 크게 상회했다.',
    time: '3시간 전',
    source: '한국경제',
    hot: false,
  },
  {
    id: 5,
    rank: 5,
    category: '스포츠',
    title: '한국 축구, 월드컵 최종 예선 첫 경기 2-0 완승',
    summary: '손흥민·이강인의 골로 쿠웨이트를 꺾고 예선 첫 발을 내디뎠다.',
    time: '4시간 전',
    source: 'MBC스포츠',
    hot: false,
  },
  {
    id: 6,
    rank: 6,
    category: '사회',
    title: '전국 38도 폭염 주의보 발령… 역대급 더위 예고',
    summary: '기상청은 이번 주말까지 전국적인 폭염이 이어질 것으로 전망했다.',
    time: '5시간 전',
    source: 'YTN',
    hot: false,
  },
]

const SIDE_ARTICLES = [
  { id: 7, category: '세계', title: '미-중 무역협상 재개… 관세 완화 가능성 시사', time: '1시간 전', source: '조선일보' },
  { id: 8, category: '경제', title: '비트코인 7만 달러 돌파… 기관 수요 급증', time: '2시간 전', source: '매일경제' },
  { id: 9, category: '연예/문화', title: '넷플릭스 한국 오리지널 시리즈, 전 세계 1위 달성', time: '3시간 전', source: '중앙일보' },
  { id: 10, category: '사회', title: '국민연금 수령 나이 조정안 국회 제출', time: '4시간 전', source: '한겨레' },
  { id: 11, category: 'IT/과학', title: 'AI 반도체 전쟁… 엔비디아 대항마 속속 등장', time: '5시간 전', source: '동아일보' },
]

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
  const [activeCategory, setActiveCategory] = useState('전체')

  return (
    <div className="main-page">
      {/* Header / Nav */}
      <header className="site-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-mark">N</span>
            <span className="logo-text">뉴스피드</span>
          </div>

          <nav className="category-nav">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`cat-btn${activeCategory === cat ? ' active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </nav>

          <div className="header-actions">
            <Link to="/login" className="header-login-btn">로그인</Link>
          </div>
        </div>
      </header>

      {/* Breaking ticker */}
      <div className="ticker-bar">
        <span className="ticker-label">속보</span>
        <div className="ticker-track">
          <span>한국은행 기준금리 인하 결정 · 전국 폭염 특보 발령 · 코스피 2,820선 회복 · 한국 축구 월드컵 예선 승리</span>
        </div>
      </div>

      <main className="main-content">
        {/* Trending keywords */}
        <section className="keywords-section">
          <div className="section-header">
            <h2 className="section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              오늘의 인기 키워드
            </h2>
            <span className="section-date">2026. 6. 22 기준</span>
          </div>

          <div className="keywords-grid">
            {KEYWORDS.map(kw => (
              <div key={kw.rank} className="keyword-item">
                <span className={`kw-rank rank-${kw.rank <= 3 ? 'top' : 'normal'}`}>{kw.rank}</span>
                <span className="kw-word">{kw.word}</span>
                <span className={`kw-change change-${kw.change}`}>
                  {kw.change === 'up' && '▲'}
                  {kw.change === 'down' && '▼'}
                  {kw.change === 'same' && '–'}
                  {kw.change === 'new' && 'NEW'}
                </span>
              </div>
            ))}
          </div>
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
                핫 이슈
              </h2>
            </div>

            <div className="hot-top">
              {/* 1위 - 대형 카드 */}
              <div className="hot-card hot-card--featured">
                <div className="hot-card-img placeholder-img">
                  <div className="img-overlay" />
                  <div className="featured-meta">
                    <span className="rank-badge rank-1">1위</span>
                    <span
                      className="cat-badge"
                      style={{ background: categoryColor[HOT_ARTICLES[0].category] }}
                    >
                      {HOT_ARTICLES[0].category}
                    </span>
                  </div>
                  <div className="featured-content">
                    <h3 className="featured-title">{HOT_ARTICLES[0].title}</h3>
                    <p className="featured-summary">{HOT_ARTICLES[0].summary}</p>
                    <div className="article-byline">
                      <span className="article-time">{HOT_ARTICLES[0].time}</span>
                      <span className="article-source">{HOT_ARTICLES[0].source}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2~3위 */}
              <div className="hot-sub-col">
                {HOT_ARTICLES.slice(1, 3).map(article => (
                  <div key={article.id} className="hot-card hot-card--sub">
                    <div className="hot-card-img placeholder-img small">
                      <div className="img-overlay" />
                      <div className="sub-meta">
                        <span className={`rank-badge rank-${article.rank}`}>{article.rank}위</span>
                        <span
                          className="cat-badge"
                          style={{ background: categoryColor[article.category] }}
                        >
                          {article.category}
                        </span>
                      </div>
                    </div>
                    <div className="sub-content">
                      <h4 className="sub-title">{article.title}</h4>
                      <div className="article-byline">
                        <span className="article-time">{article.time}</span>
                        <span className="article-source">{article.source}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4~6위 - 가로 리스트 */}
            <div className="hot-list">
              {HOT_ARTICLES.slice(3).map(article => (
                <div key={article.id} className="hot-list-item">
                  <span className="list-rank">{article.rank}</span>
                  <div className="list-body">
                    <div className="list-meta">
                      <span
                        className="cat-badge small"
                        style={{ background: categoryColor[article.category] }}
                      >
                        {article.category}
                      </span>
                      <span className="article-time">{article.time}</span>
                      <span className="article-source">{article.source}</span>
                    </div>
                    <p className="list-title">{article.title}</p>
                  </div>
                </div>
              ))}
            </div>
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
              {SIDE_ARTICLES.map((a, i) => (
                <div key={a.id} className="side-item">
                  <div className="side-thumb placeholder-img tiny" />
                  <div className="side-body">
                    <span
                      className="cat-badge small"
                      style={{ background: categoryColor[a.category] }}
                    >
                      {a.category}
                    </span>
                    <p className="side-title">{a.title}</p>
                    <div className="article-byline">
                      <span className="article-time">{a.time}</span>
                      <span className="article-source">{a.source}</span>
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
