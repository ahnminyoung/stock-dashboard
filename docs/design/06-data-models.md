# 데이터 모델 설계

## 1. TypeScript 타입 정의

### 1.1 MarketIndex (시장 지수)

```typescript
interface MarketIndex {
  name: string;                 // 지수명 (예: "코스피")
  symbol: string;                // 심볼 (예: "KS11")
  currentPrice: number;          // 현재가
  changeValue: number;           // 전일대비
  changePercent: number;         // 등락률 (%)
  marketStatus: MarketStatus;    // 시장 상태
  volume?: number;               // 거래량
  tradingValue?: number;         // 거래대금
  sparklineData?: number[];      // 미니 차트 데이터
  lastUpdated: string;           // 마지막 업데이트 시각 (ISO 8601)
}

type MarketStatus = 'PRE_MARKET' | 'TRADING' | 'CLOSED' | 'AFTER_HOURS';
```

### 1.2 ThemeHeatmapData (테마 히트맵)

```typescript
interface ThemeHeatmapData {
  id: string;                    // 테마 ID
  groupType: GroupType;          // 그룹 타입
  groupName: string;             // 테마명
  changePercent: number;         // 등락률
  rank: number;                  // 순위
  weightScore: number;           // 가중치 점수 (0-100)
  stockCount: number;            // 구성 종목 수
  tradingValue?: number;         // 거래대금
  leaderStocks: LeaderStock[];   // 대표 종목
}

type GroupType = 'THEME' | 'SECTOR' | 'INDUSTRY';

interface LeaderStock {
  symbol: string;                // 종목 심볼
  name: string;                  // 종목명
  changePercent: number;         // 등락률
  currentPrice?: number;         // 현재가
  volume?: number;               // 거래량
}
```

### 1.3 Stock (종목)

```typescript
interface Stock {
  symbol: string;                // 종목 심볼
  name: string;                  // 종목명
  marketType: MarketType;        // 시장 타입
  currentPrice: number;          // 현재가
  changeValue: number;           // 전일대비
  changePercent: number;         // 등락률
  volume: number;                // 거래량
  tradingValue?: number;         // 거래대금
  marketCap?: number;            // 시가총액
  sparklineData?: number[];      // 미니 차트 데이터
  lastUpdated: string;           // 마지막 업데이트
}

type MarketType = 'KR' | 'US' | 'CN' | 'JP';
```

### 1.4 NewsItem (뉴스)

```typescript
interface NewsItem {
  id: string;                    // 뉴스 ID
  title: string;                 // 제목
  category: NewsCategory;        // 카테고리
  marketType: MarketType;        // 시장 타입
  publishedAt: string;           // 발행 시각 (ISO 8601)
  source: string;                // 출처
  summary?: string;              // 요약
  content?: string;              // 본문
  relatedSymbols: string[];      // 관련 종목 심볼
  url: string;                   // 원문 URL
  thumbnailUrl?: string;         // 썸네일 이미지
}

type NewsCategory = '시황' | '종목' | '경제' | '산업' | '글로벌' | '공시';
```

### 1.5 WatchlistItem (관심종목)

```typescript
interface WatchlistItem {
  id: string;                    // ID
  symbol: string;                // 종목 심볼
  name: string;                  // 종목명
  marketType: MarketType;        // 시장 타입
  currentPrice: number;          // 현재가
  changePercent: number;         // 등락률
  volume?: number;               // 거래량
  addedAt: string;               // 추가 시각
  note?: string;                 // 메모
  alertPrice?: number;           // 알림 가격
  lastUpdated: string;           // 마지막 업데이트
}
```

### 1.6 DashboardData (대시보드 전체 데이터)

```typescript
interface DashboardData {
  globalSummary: GlobalSummary;
  domestic: DomesticSection;
  overseas: OverseasSection;
  watchlist: WatchlistSummary;
}

interface GlobalSummary {
  kospi: MarketIndex;
  kosdaq: MarketIndex;
  nasdaq: MarketIndex;
  sp500: MarketIndex;
  usdKrw: ExchangeRate;
  futures: FuturesIndex;
  marketStatus: MarketStatusInfo;
}

interface DomesticSection {
  indices: MarketIndex[];
  heatmap: ThemeHeatmapData[];
  topMovers: TopMoversData;
  news: NewsItem[];
}

interface OverseasSection {
  indices: MarketIndex[];
  heatmap: SectorHeatmapData[];
  topMovers: OverseasTopMoversData;
  news: NewsItem[];
}

interface TopMoversData {
  gainers: Stock[];
  losers?: Stock[];
  activeVolume: Stock[];
  trending: Stock[];
}

interface OverseasTopMoversData {
  popular: Stock[];
  bigTech: Stock[];
  volumeLeaders?: Stock[];
}
```

---

## 2. 데이터베이스 스키마 (PostgreSQL)

### 2.1 stocks (종목 테이블)

```sql
CREATE TABLE stocks (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  market_type VARCHAR(10) NOT NULL,  -- KR, US, CN, JP
  exchange VARCHAR(50),               -- KOSPI, NASDAQ 등
  sector VARCHAR(100),
  industry VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_symbol (symbol),
  INDEX idx_market_type (market_type)
);
```

### 2.2 stock_prices (주가 테이블)

```sql
CREATE TABLE stock_prices (
  id SERIAL PRIMARY KEY,
  stock_id INTEGER REFERENCES stocks(id),
  price_date DATE NOT NULL,
  open_price DECIMAL(18, 2),
  high_price DECIMAL(18, 2),
  low_price DECIMAL(18, 2),
  close_price DECIMAL(18, 2),
  volume BIGINT,
  trading_value BIGINT,
  change_value DECIMAL(18, 2),
  change_percent DECIMAL(10, 4),
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_stock_date (stock_id, price_date DESC),
  UNIQUE (stock_id, price_date)
);
```

### 2.3 themes (테마 테이블)

```sql
CREATE TABLE themes (
  id SERIAL PRIMARY KEY,
  theme_code VARCHAR(50) NOT NULL UNIQUE,
  theme_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2.4 theme_stocks (테마-종목 매핑)

```sql
CREATE TABLE theme_stocks (
  id SERIAL PRIMARY KEY,
  theme_id INTEGER REFERENCES themes(id),
  stock_id INTEGER REFERENCES stocks(id),
  weight DECIMAL(5, 2),  -- 가중치 (0-100)
  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE (theme_id, stock_id),
  INDEX idx_theme (theme_id)
);
```

### 2.5 news (뉴스 테이블)

```sql
CREATE TABLE news (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  category VARCHAR(50),
  market_type VARCHAR(10),
  published_at TIMESTAMP NOT NULL,
  source VARCHAR(100),
  summary TEXT,
  content TEXT,
  url VARCHAR(1000) NOT NULL UNIQUE,
  thumbnail_url VARCHAR(1000),
  created_at TIMESTAMP DEFAULT NOW(),

  INDEX idx_published_at (published_at DESC),
  INDEX idx_market_type (market_type)
);
```

### 2.6 news_stocks (뉴스-종목 매핑)

```sql
CREATE TABLE news_stocks (
  id SERIAL PRIMARY KEY,
  news_id INTEGER REFERENCES news(id),
  stock_id INTEGER REFERENCES stocks(id),

  UNIQUE (news_id, stock_id)
);
```

### 2.7 watchlists (관심종목 테이블)

```sql
CREATE TABLE watchlists (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  stock_id INTEGER REFERENCES stocks(id),
  note TEXT,
  alert_price DECIMAL(18, 2),
  added_at TIMESTAMP DEFAULT NOW(),

  UNIQUE (user_id, stock_id),
  INDEX idx_user (user_id)
);
```

### 2.8 users (사용자 테이블)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,

  INDEX idx_email (email)
);
```

---

## 3. Redis 캐시 스키마

### 3.1 실시간 주가 캐시

```
KEY: stock:price:{symbol}
TTL: 60초
VALUE (JSON):
{
  "symbol": "005930",
  "currentPrice": 75000,
  "changeValue": 1200,
  "changePercent": 1.63,
  "volume": 28500000,
  "timestamp": "2026-03-31T14:25:00Z"
}
```

### 3.2 히트맵 캐시

```
KEY: heatmap:domestic:{period}:{filter}
TTL: 60초
VALUE (JSON):
[
  {
    "id": "theme-semiconductor",
    "groupName": "반도체",
    "changePercent": 5.2,
    ...
  }
]
```

### 3.3 대시보드 집계 캐시

```
KEY: dashboard:home
TTL: 30초
VALUE (JSON):
{
  "globalSummary": {...},
  "domestic": {...},
  "overseas": {...}
}
```

---

## 4. 데이터 흐름

### 4.1 실시간 데이터 흐름

```
[외부 API] → [WebSocket Server] → [Redis Pub/Sub] → [Client WebSocket]
                     ↓
              [Redis Cache]
                     ↓
              [PostgreSQL] (분 단위 스냅샷)
```

### 4.2 히트맵 계산 흐름

```
[PostgreSQL] → [계산 엔진] → [Redis Cache] → [API Response]
  ↓              ↓
종목별 가격    등락률 계산
테마 매핑      가중치 계산
              순위 계산
```

---

## 5. 더미 데이터 예시

### 5.1 GlobalSummary 더미 데이터

```json
{
  "kospi": {
    "name": "코스피",
    "symbol": "KS11",
    "currentPrice": 2650.23,
    "changeValue": 15.25,
    "changePercent": 0.58,
    "marketStatus": "TRADING",
    "volume": 458920000,
    "sparklineData": [2635, 2640, 2645, 2642, 2650],
    "lastUpdated": "2026-03-31T14:25:00Z"
  }
}
```

### 5.2 ThemeHeatmapData 더미 데이터

```json
[
  {
    "id": "theme-semiconductor",
    "groupType": "THEME",
    "groupName": "반도체",
    "changePercent": 5.2,
    "rank": 1,
    "weightScore": 95,
    "stockCount": 45,
    "tradingValue": 5200000000000,
    "leaderStocks": [
      {
        "symbol": "005930",
        "name": "삼성전자",
        "changePercent": 4.8,
        "currentPrice": 75000,
        "volume": 28500000
      },
      {
        "symbol": "000660",
        "name": "SK하이닉스",
        "changePercent": 6.2,
        "currentPrice": 125000,
        "volume": 15200000
      }
    ]
  },
  {
    "id": "theme-battery",
    "groupType": "THEME",
    "groupName": "2차전지",
    "changePercent": 3.8,
    "rank": 2,
    "weightScore": 82,
    "stockCount": 38,
    "leaderStocks": [
      {
        "symbol": "006400",
        "name": "삼성SDI",
        "changePercent": 4.5
      }
    ]
  }
]
```

---

**문서 버전**: v1.0
**작성일**: 2026-03-31
