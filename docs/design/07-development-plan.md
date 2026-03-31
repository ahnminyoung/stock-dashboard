# 개발 우선순위 및 React 폴더 구조

## 1. MVP 개발 우선순위

### Phase 1: MVP 핵심 (2주)

**목표**: 첫 화면 기본 기능 구현

- [ ] 프로젝트 초기 설정 (1일)
  - React + TypeScript + Vite 설정
  - Tailwind CSS 또는 shadcn/ui 설정
  - React Query 설정
  - 폴더 구조 생성

- [ ] 레이아웃 및 헤더 구현 (1일)
  - AppLayout 컴포넌트
  - Header 컴포넌트
  - Footer 컴포넌트
  - 반응형 네비게이션

- [ ] 글로벌 요약 바 구현 (2일)
  - GlobalSummaryBar 컴포넌트
  - IndexCard 컴포넌트
  - 실시간 업데이트 (Polling 방식)
  - 스켈레톤 로딩 UI

- [ ] 국내 섹션 기본 구현 (3일)
  - DomesticStockSection 컴포넌트
  - 국내 지수 카드 (정적 데이터)
  - StockList 및 StockListItem 컴포넌트
  - TopMoversPortlet (탭 기능)

- [ ] 해외 섹션 기본 구현 (3일)
  - OverseasStockSection 컴포넌트
  - 해외 지수 카드 (정적 데이터)
  - BigTechPortlet 구현

- [ ] 뉴스 포틀릿 구현 (1일)
  - NewsPortlet 컴포넌트
  - NewsItem 컴포넌트
  - 더보기 링크

- [ ] API 연동 (2일)
  - 대시보드 집계 API 연동
  - React Query 훅 작성
  - 에러 핸들링

### Phase 2: 히트맵 구현 (1주)

**목표**: 핵심 기능인 히트맵 완성

- [ ] 히트맵 컴포넌트 기본 구조 (2일)
  - DomesticHeatmap 컴포넌트
  - HeatmapGrid 레이아웃
  - HeatmapBox 컴포넌트

- [ ] 히트맵 인터랙션 (2일)
  - 필터 및 기간 선택 기능
  - 박스 크기 계산 (Treemap 알고리즘)
  - 색상 계산 로직

- [ ] 히트맵 상세 기능 (2일)
  - 호버 툴팁
  - 클릭 이벤트 처리
  - 상세 페이지 연동

- [ ] 해외 섹터맵 구현 (1일)
  - OverseasHeatmap 컴포넌트
  - 섹터 데이터 연동

### Phase 3: 관심종목 및 실시간 (1주)

**목표**: 사용자 맞춤 기능 및 실시간 데이터

- [ ] 관심종목 기능 (2일)
  - WatchlistPortlet 구현
  - 추가/제거 기능
  - 로컬 스토리지 저장

- [ ] 실시간 데이터 (3일)
  - WebSocket 연동
  - 실시간 가격 업데이트
  - 연결 상태 관리

- [ ] 검색 기능 (2일)
  - SearchBar 컴포넌트
  - AutoComplete 구현
  - 검색 결과 페이지

### Phase 4: 고도화 (2주)

**목표**: UX 개선 및 추가 기능

- [ ] 경제지표 위젯 (2일)
  - EconomicCalendarPortlet
  - MarketSentimentPortlet
  - CommoditiesPortlet

- [ ] 사용자 설정 (3일)
  - 포틀릿 커스터마이징
  - 다크 모드
  - 알림 설정

- [ ] 성능 최적화 (2일)
  - Code Splitting
  - 이미지 최적화
  - 캐싱 전략

- [ ] 테스트 및 버그 수정 (3일)
  - 유닛 테스트
  - E2E 테스트
  - 버그 수정

---

## 2. React 폴더 구조

```
stock-market-dashboard/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── assets/
│       └── images/
│
├── src/
│   ├── api/                          # API 호출 함수
│   │   ├── client.ts                 # Axios/Fetch 클라이언트 설정
│   │   ├── endpoints.ts              # API 엔드포인트 상수
│   │   ├── dashboard.ts              # 대시보드 API
│   │   ├── market.ts                 # 시장 데이터 API
│   │   ├── news.ts                   # 뉴스 API
│   │   └── watchlist.ts              # 관심종목 API
│   │
│   ├── components/                   # 재사용 가능한 컴포넌트
│   │   ├── common/                   # 공통 컴포넌트
│   │   │   ├── IndexCard.tsx
│   │   │   ├── StockListItem.tsx
│   │   │   ├── ChangeRate.tsx
│   │   │   ├── MiniChart.tsx
│   │   │   ├── PortletHeader.tsx
│   │   │   ├── SectionHeader.tsx
│   │   │   ├── Tag.tsx
│   │   │   ├── Button.tsx
│   │   │   └── Badge.tsx
│   │   │
│   │   ├── heatmap/                  # 히트맵 관련
│   │   │   ├── DomesticHeatmap.tsx
│   │   │   ├── OverseasHeatmap.tsx
│   │   │   ├── HeatmapGrid.tsx
│   │   │   ├── HeatmapBox.tsx
│   │   │   ├── HeatmapToolbar.tsx
│   │   │   └── HeatmapTooltip.tsx
│   │   │
│   │   ├── portlets/                 # 포틀릿 컴포넌트
│   │   │   ├── TopMoversPortlet.tsx
│   │   │   ├── BigTechPortlet.tsx
│   │   │   ├── WatchlistPortlet.tsx
│   │   │   ├── NewsPortlet.tsx
│   │   │   ├── EconomicCalendarPortlet.tsx
│   │   │   └── MarketSentimentPortlet.tsx
│   │   │
│   │   ├── home/                     # 홈 화면 전용
│   │   │   ├── GlobalSummaryBar.tsx
│   │   │   ├── DomesticStockSection.tsx
│   │   │   ├── OverseasStockSection.tsx
│   │   │   └── ExtendedSection.tsx
│   │   │
│   │   └── layout/                   # 레이아웃 컴포넌트
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       ├── Logo.tsx
│   │       ├── SearchBar.tsx
│   │       └── UserMenu.tsx
│   │
│   ├── hooks/                        # Custom Hooks
│   │   ├── useWebSocket.ts
│   │   ├── usePortletConfig.ts
│   │   ├── useTreemapLayout.ts
│   │   ├── useDebounce.ts
│   │   ├── useIntersectionObserver.ts
│   │   └── queries/                  # React Query 훅
│   │       ├── useDashboard.ts
│   │       ├── useHeatmap.ts
│   │       ├── useNews.ts
│   │       └── useWatchlist.ts
│   │
│   ├── layouts/                      # 페이지 레이아웃
│   │   ├── AppLayout.tsx
│   │   └── AuthLayout.tsx
│   │
│   ├── lib/                          # 라이브러리 설정 및 유틸
│   │   ├── queryClient.ts            # React Query 설정
│   │   ├── websocket.ts              # WebSocket 클라이언트
│   │   └── cn.ts                     # className 유틸 (shadcn/ui)
│   │
│   ├── pages/                        # 페이지 컴포넌트
│   │   ├── HomePage.tsx
│   │   ├── DomesticPage.tsx
│   │   ├── OverseasPage.tsx
│   │   ├── WatchlistPage.tsx
│   │   ├── StockDetailPage.tsx
│   │   └── NotFoundPage.tsx
│   │
│   ├── providers/                    # Context Providers
│   │   ├── ThemeProvider.tsx
│   │   ├── AuthProvider.tsx
│   │   └── WebSocketProvider.tsx
│   │
│   ├── routes/                       # 라우팅 설정
│   │   ├── index.tsx
│   │   └── router.tsx
│   │
│   ├── store/                        # 전역 상태 관리
│   │   ├── appStore.ts               # Zustand 또는 Jotai
│   │   └── slices/
│   │       ├── themeSlice.ts
│   │       └── userSlice.ts
│   │
│   ├── types/                        # TypeScript 타입 정의
│   │   ├── api.ts
│   │   ├── market.ts
│   │   ├── stock.ts
│   │   ├── news.ts
│   │   └── user.ts
│   │
│   ├── utils/                        # 유틸리티 함수
│   │   ├── format.ts                 # 숫자, 날짜 포맷팅
│   │   ├── validation.ts             # 유효성 검증
│   │   ├── constants.ts              # 상수 정의
│   │   └── helpers.ts                # 헬퍼 함수
│   │
│   ├── styles/                       # 스타일
│   │   ├── globals.css
│   │   └── tailwind.css
│   │
│   ├── App.tsx                       # 메인 앱 컴포넌트
│   ├── main.tsx                      # 엔트리 포인트
│   └── vite-env.d.ts
│
├── .env.example                      # 환경 변수 예시
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## 3. 주요 파일 설명

### 3.1 src/main.tsx

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from './lib/queryClient';
import { ThemeProvider } from './providers/ThemeProvider';
import { WebSocketProvider } from './providers/WebSocketProvider';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <WebSocketProvider>
          <App />
        </WebSocketProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
```

### 3.2 src/App.tsx

```typescript
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { Toaster } from './components/ui/toaster';

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
```

### 3.3 src/routes/index.tsx

```typescript
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import HomePage from '@/pages/HomePage';
import DomesticPage from '@/pages/DomesticPage';
import OverseasPage from '@/pages/OverseasPage';
import WatchlistPage from '@/pages/WatchlistPage';
import StockDetailPage from '@/pages/StockDetailPage';
import NotFoundPage from '@/pages/NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="domestic" element={<DomesticPage />} />
        <Route path="overseas" element={<OverseasPage />} />
        <Route path="watchlist" element={<WatchlistPage />} />
        <Route path="stock/:symbol" element={<StockDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
```

### 3.4 src/lib/queryClient.ts

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1분
      cacheTime: 300000, // 5분
      refetchOnWindowFocus: true,
      retry: 2,
    },
  },
});
```

### 3.5 src/api/client.ts

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 인증 실패 처리
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 3.6 src/hooks/queries/useDashboard.ts

```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchHomeDashboard } from '@/api/dashboard';
import type { DashboardData } from '@/types/market';

export function useDashboard() {
  return useQuery<DashboardData>({
    queryKey: ['dashboard', 'home'],
    queryFn: fetchHomeDashboard,
    refetchInterval: 60000, // 1분마다 갱신
  });
}
```

---

## 4. 기술 스택

### 4.1 Core

- **React** 18.3+
- **TypeScript** 5.0+
- **Vite** 5.0+

### 4.2 UI/Styling

- **Tailwind CSS** 3.4+
- **shadcn/ui** (추천) 또는 **Chakra UI**
- **Lucide React** (아이콘)

### 4.3 State Management

- **React Query** (서버 상태)
- **Zustand** 또는 **Jotai** (클라이언트 상태)

### 4.4 Routing

- **React Router** 6.x

### 4.5 Charts

- **Recharts** 또는 **D3.js** (히트맵, 차트)
- **react-sparklines** (미니 차트)

### 4.6 Utilities

- **axios** (HTTP 클라이언트)
- **date-fns** (날짜 포맷팅)
- **clsx** / **tailwind-merge** (className 유틸)

### 4.7 Testing

- **Vitest** (유닛 테스트)
- **Playwright** 또는 **Cypress** (E2E 테스트)

---

## 5. 환경 변수 (.env)

```bash
# API
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_WS_URL=ws://localhost:3000/ws/v1

# Feature Flags
VITE_ENABLE_WEBSOCKET=true
VITE_ENABLE_EXTENDED_PORTLETS=false

# Analytics
VITE_GA_TRACKING_ID=UA-XXXXX-X
```

---

## 6. 패키지 설치 명령어

```bash
# 프로젝트 초기화
npm create vite@latest stock-market-dashboard -- --template react-ts

# 의존성 설치
npm install react-router-dom
npm install @tanstack/react-query
npm install @tanstack/react-query-devtools
npm install axios
npm install zustand
npm install date-fns
npm install recharts
npm install lucide-react

# UI 라이브러리 (shadcn/ui 사용 시)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npx shadcn-ui@latest init

# 개발 의존성
npm install -D @types/node
npm install -D vitest
npm install -D @playwright/test
```

---

## 7. Git 브랜치 전략

```
main (프로덕션)
  ↑
develop (개발)
  ↑
feature/xxx (기능 개발)
  - feature/global-summary-bar
  - feature/domestic-heatmap
  - feature/watchlist
```

---

## 8. 배포 전략

**개발 환경**:
- Vercel 또는 Netlify (프론트엔드)
- Railway 또는 Render (백엔드)

**프로덕션 환경**:
- Vercel Pro (프론트엔드)
- AWS EC2 + RDS (백엔드)
- AWS CloudFront (CDN)

---

**문서 버전**: v1.0
**작성일**: 2026-03-31
