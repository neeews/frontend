# neeews 프론트엔드

뉴스 큐레이션 서비스 **neeews**의 프론트엔드 프로젝트입니다.

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | React 19 + Vite 8 |
| 라우팅 | React Router v6 |
| 언어 | JavaScript (TypeScript 미사용) |
| 스타일 | 컴포넌트별 CSS 파일 분리 |
| 인증 | JWT — `localStorage` 저장 |
| 배포 | Vercel |

## 페이지 구성

| 경로 | 페이지 | 접근 조건 |
|------|--------|----------|
| `/` | 메인 (핫 이슈, 키워드, 최신 뉴스) | 누구나 |
| `/login` | 로그인 | 비로그인 |
| `/signup` | 회원가입 (이메일 인증 포함) | 비로그인 |
| `/articles/:id` | 기사 상세 | 누구나 |
| `/category/:name` | 카테고리별 기사 목록 | 누구나 |
| `/search?q=` | 검색 결과 | 누구나 |
| `/mypage` | 내 프로필 + 북마크 | 로그인 필요 |

## 시작하기

```bash
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

## 환경 변수

`.env` 파일을 루트에 생성하세요.

```env
VITE_API_BASE_URL=https://your-backend-domain.com
```

개발 환경에서는 `vite.config.js`의 proxy 설정으로 `/auth`, `/articles`, `/keywords`, `/search`, `/users` 요청이 백엔드로 자동 전달됩니다.

## 프로젝트 구조

```
src/
├── api/
│   ├── auth.js          # 인증 API (로그인, 회원가입, 토큰 관리)
│   └── articles.js      # 기사, 검색, 북마크, 유저 API
├── hooks/
│   └── useBookmark.js   # 북마크 토글 커스텀 훅
├── pages/
│   ├── LoginPage.jsx
│   ├── SignupPage.jsx
│   ├── MainPage.jsx
│   ├── ArticleDetailPage.jsx
│   ├── CategoryPage.jsx
│   ├── SearchPage.jsx
│   └── MyPage.jsx
├── styles/              # 페이지별 CSS
├── utils/
│   └── time.js          # 날짜 → '32분 전' 포맷 변환
└── App.jsx              # 라우팅 설정
```

## 관련 저장소

- 백엔드: [neeews/backend](https://github.com/neeews/backend)
