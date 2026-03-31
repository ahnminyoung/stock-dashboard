# API 설계서

## 1. API 설계 원칙

### 1.1 RESTful API 설계
- 리소스 중심 URL 구조
- HTTP 메서드 활용 (GET, POST, PUT, PATCH, DELETE)
- 상태 코드 명확히 사용
- 버전 관리 (v1, v2)

### 1.2 응답 형식
모든 API는 다음 형식으로 응답:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  metadata?: {
    timestamp: string;
    version: string;
  };
}
```

### 1.3 집계형 API 우선
- 첫 화면은 여러 API를 호출하지 않고 집계형 엔드포인트 사용
- 예: `/api/home/dashboard` 한 번 호출로 모든 데이터 수신

---

## 2. 홈 화면 핵심 API

### 2.1 홈 대시보드 집계 API ⭐

**Endpoint**: `GET /api/v1/home/dashboard`

**설명**: 홈 화면에 필요한 모든 데이터를 한 번에 제공

**Request**:
```http
GET /api/v1/home/dashboard HTTP/1.1
Host: api.stockdashboard.com
Authorization: Bearer {token} (선택)
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 | 기본값 |
|---------|------|------|------|--------|
| period | string | N | 히트맵 기간 (1D, 5D, 20D, 60D) | 1D |
| filter | string | N | 히트맵 필터 (inflow, change, count) | change |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "globalSummary": {
      "kospi": {
        "name": "코스피",
        "symbol": "KS11",
        "currentPrice": 2650.23,
        "changeValue": 15.25,
        "changePercent": 0.58,
        "marketStatus": "TRADING",
        "volume": 458920000,
        "lastUpdated": "2026-03-31T14:25:00Z"
      },
      "kosdaq": {
        "name": "코스닥",
        "symbol": "KQ11",
        "currentPrice": 850.45,
        "changeValue": -5.20,
        "changePercent": -0.61,
        "marketStatus": "TRADING",
        "volume": 685430000,
        "lastUpdated": "2026-03-31T14:25:00Z"
      },
      "nasdaq": {
        "name": "나스닥",
        "symbol": "^IXIC",
        "currentPrice": 18250.50,
        "changeValue": 125.40,
        "changePercent": 0.69,
        "marketStatus": "CLOSED",
        "volume": 5280000000,
        "lastUpdated": "2026-03-31T04:00:00Z"
      },
      "sp500": {
        "name": "S&P500",
        "symbol": "^GSPC",
        "currentPrice": 5850.30,
        "changeValue": 35.80,
        "changePercent": 0.62,
        "marketStatus": "CLOSED",
        "volume": 3450000000,
        "lastUpdated": "2026-03-31T04:00:00Z"
      },
      "usdKrw": {
        "name": "USD/KRW",
        "currentRate": 1325.50,
        "changeValue": 5.50,
        "changePercent": 0.42,
        "lastUpdated": "2026-03-31T14:25:00Z"
      },
      "futures": {
        "name": "코스피200 선물",
        "symbol": "KR4101R30000",
        "currentPrice": 355.25,
        "changeValue": 2.15,
        "changePercent": 0.61,
        "lastUpdated": "2026-03-31T14:25:00Z"
      },
      "marketStatus": {
        "krMarket": "TRADING",
        "usMarket": "CLOSED",
        "currentTime": "2026-03-31T14:25:00Z"
      }
    },
    "domestic": {
      "indices": [
        {
          "name": "코스피",
          "symbol": "KS11",
          "currentPrice": 2650.23,
          "changeValue": 15.25,
          "changePercent": 0.58,
          "volume": 458920000,
          "tradingValue": 12500000000000,
          "sparklineData": [2635, 2640, 2645, 2642, 2650]
        },
        {
          "name": "코스닥",
          "symbol": "KQ11",
          "currentPrice": 850.45,
          "changeValue": -5.20,
          "changePercent": -0.61,
          "volume": 685430000,
          "tradingValue": 8200000000000,
          "sparklineData": [855, 852, 848, 851, 850]
        }
      ],
      "heatmap": [
        {
          "id": "theme-semiconductor",
          "groupType": "THEME",
          "groupName": "반도체",
          "changePercent": 5.2,
          "rank": 1,
          "weightScore": 95,
          "stockCount": 45,
          "leaderStocks": [
            {
              "symbol": "005930",
              "name": "삼성전자",
              "changePercent": 4.8
            },
            {
              "symbol": "000660",
              "name": "SK하이닉스",
              "changePercent": 6.2
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
            },
            {
              "symbol": "373220",
              "name": "LG에너지솔루션",
              "changePercent": 3.2
            }
          ]
        },
        {
          "id": "theme-ai-cloud",
          "groupType": "THEME",
          "groupName": "AI/클라우드",
          "changePercent": 2.1,
          "rank": 3,
          "weightScore": 75,
          "stockCount": 32,
          "leaderStocks": [
            {
              "symbol": "035420",
              "name": "네이버",
              "changePercent": 2.5
            },
            {
              "symbol": "035720",
              "name": "카카오",
              "changePercent": 1.8
            }
          ]
        }
      ],
      "topMovers": {
        "gainers": [
          {
            "symbol": "005930",
            "name": "삼성전자",
            "currentPrice": 75000,
            "changeValue": 1200,
            "changePercent": 1.63,
            "volume": 28500000,
            "sparklineData": [73800, 74200, 74500, 74800, 75000]
          }
        ],
        "activeVolume": [
          {
            "symbol": "005930",
            "name": "삼성전자",
            "currentPrice": 75000,
            "changeValue": 1200,
            "changePercent": 1.63,
            "volume": 28500000,
            "tradingValue": 2137500000000
          }
        ],
        "trending": [
          {
            "symbol": "005930",
            "name": "삼성전자",
            "currentPrice": 75000,
            "changePercent": 1.63,
            "viewCount": 1250000,
            "viewChangePercent": 45.2
          }
        ]
      },
      "news": [
        {
          "id": "news-001",
          "title": "코스피, 외국인 순매수에 반등세",
          "category": "시황",
          "marketType": "KR",
          "publishedAt": "2026-03-31T14:15:00Z",
          "source": "연합뉴스",
          "summary": "코스피가 외국인 투자자들의 순매수세에 힘입어 반등하고 있습니다.",
          "relatedSymbols": ["005930", "000660"],
          "url": "https://example.com/news/001"
        }
      ]
    },
    "overseas": {
      "indices": [
        {
          "name": "나스닥",
          "symbol": "^IXIC",
          "currentPrice": 18250.50,
          "changeValue": 125.40,
          "changePercent": 0.69,
          "volume": 5280000000,
          "sparklineData": [18125, 18180, 18220, 18240, 18250]
        }
      ],
      "heatmap": [
        {
          "id": "sector-tech",
          "groupType": "SECTOR",
          "groupName": "기술주",
          "changePercent": 2.5,
          "rank": 1,
          "weightScore": 90,
          "marketCapWeight": 28.5,
          "leaderStocks": [
            {
              "symbol": "AAPL",
              "name": "Apple",
              "changePercent": 2.15
            },
            {
              "symbol": "MSFT",
              "name": "Microsoft",
              "changePercent": 1.79
            }
          ]
        }
      ],
      "topMovers": {
        "popular": [
          {
            "symbol": "AAPL",
            "name": "Apple",
            "currentPrice": 178.25,
            "changeValue": 3.75,
            "changePercent": 2.15,
            "volume": 65000000,
            "marketCap": 2800000000000,
            "sparklineData": [174.5, 176.0, 177.2, 177.8, 178.25]
          }
        ],
        "bigTech": [
          {
            "symbol": "AAPL",
            "name": "Apple",
            "currentPrice": 178.25,
            "changeValue": 3.75,
            "changePercent": 2.15,
            "marketCap": 2800000000000
          },
          {
            "symbol": "MSFT",
            "name": "Microsoft",
            "currentPrice": 412.50,
            "changeValue": 7.25,
            "changePercent": 1.79,
            "marketCap": 3100000000000
          },
          {
            "symbol": "NVDA",
            "name": "NVIDIA",
            "currentPrice": 875.00,
            "changeValue": 29.75,
            "changePercent": 3.52,
            "marketCap": 2200000000000
          }
        ]
      },
      "news": [
        {
          "id": "news-101",
          "title": "Fed, 금리 동결 시사",
          "category": "경제",
          "marketType": "US",
          "publishedAt": "2026-03-31T13:45:00Z",
          "source": "Reuters",
          "summary": "미 연준이 다음 회의에서 금리를 동결할 것으로 시사했습니다.",
          "relatedSymbols": [],
          "url": "https://example.com/news/101"
        }
      ]
    },
    "watchlist": {
      "domestic": [
        {
          "symbol": "005930",
          "name": "삼성전자",
          "currentPrice": 75000,
          "changePercent": 1.63,
          "lastUpdated": "2026-03-31T14:25:00Z"
        }
      ],
      "overseas": [
        {
          "symbol": "AAPL",
          "name": "Apple",
          "currentPrice": 178.25,
          "changePercent": 2.15,
          "lastUpdated": "2026-03-31T04:00:00Z"
        }
      ]
    }
  },
  "metadata": {
    "timestamp": "2026-03-31T14:25:00Z",
    "version": "1.0"
  }
}
```

**Error Response** (500):
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "데이터를 가져오는 중 오류가 발생했습니다."
  }
}
```

---

### 2.2 국내 히트맵 API

**Endpoint**: `GET /api/v1/market/domestic/heatmap`

**설명**: 국내 테마/업종별 히트맵 데이터 조회

**Request**:
```http
GET /api/v1/market/domestic/heatmap?period=1D&filter=change&limit=20 HTTP/1.1
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 | 기본값 |
|---------|------|------|------|--------|
| period | string | N | 기간 (1D, 5D, 20D, 60D) | 1D |
| filter | string | N | 필터 (inflow, change, count) | change |
| limit | number | N | 최대 항목 수 | 50 |

**Response**:
```json
{
  "success": true,
  "data": [
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
        }
      ]
    }
  ]
}
```

---

### 2.3 해외 섹터맵 API

**Endpoint**: `GET /api/v1/market/overseas/heatmap`

**설명**: 해외 섹터별 히트맵 데이터 조회

**Request**:
```http
GET /api/v1/market/overseas/heatmap?period=1D&filter=marketcap HTTP/1.1
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 | 기본값 |
|---------|------|------|------|--------|
| period | string | N | 기간 (1D, 5D, 20D) | 1D |
| filter | string | N | 필터 (marketcap, change, popular) | marketcap |
| limit | number | N | 최대 항목 수 | 30 |

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "sector-tech",
      "groupType": "SECTOR",
      "groupName": "Technology",
      "displayName": "기술주",
      "changePercent": 2.5,
      "rank": 1,
      "weightScore": 90,
      "marketCapWeight": 28.5,
      "leaderStocks": [
        {
          "symbol": "AAPL",
          "name": "Apple",
          "changePercent": 2.15,
          "currentPrice": 178.25,
          "marketCap": 2800000000000
        }
      ]
    }
  ]
}
```

---

### 2.4 급등주/거래대금 API

**Endpoint**: `GET /api/v1/market/domestic/top-movers`

**설명**: 급등주, 거래대금 상위, 조회수 급증 종목 조회

**Request**:
```http
GET /api/v1/market/domestic/top-movers?type=gainers&limit=10 HTTP/1.1
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 | 기본값 |
|---------|------|------|------|--------|
| type | string | Y | 타입 (gainers, losers, activeVolume, trending) | gainers |
| limit | number | N | 최대 항목 수 | 10 |

**Response**:
```json
{
  "success": true,
  "data": {
    "type": "gainers",
    "stocks": [
      {
        "rank": 1,
        "symbol": "005930",
        "name": "삼성전자",
        "currentPrice": 75000,
        "changeValue": 1200,
        "changePercent": 1.63,
        "volume": 28500000,
        "tradingValue": 2137500000000,
        "sparklineData": [73800, 74200, 74500, 74800, 75000]
      }
    ],
    "lastUpdated": "2026-03-31T14:25:00Z"
  }
}
```

---

### 2.5 뉴스 API

**Endpoint**: `GET /api/v1/news`

**설명**: 시장별 최신 뉴스 조회

**Request**:
```http
GET /api/v1/news?marketType=KR&limit=5 HTTP/1.1
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 | 기본값 |
|---------|------|------|------|--------|
| marketType | string | N | 시장 타입 (KR, US, ALL) | ALL |
| category | string | N | 카테고리 (시황, 종목, 경제) | - |
| limit | number | N | 최대 항목 수 | 10 |
| offset | number | N | 오프셋 | 0 |

**Response**:
```json
{
  "success": true,
  "data": {
    "news": [
      {
        "id": "news-001",
        "title": "코스피, 외국인 순매수에 반등세",
        "category": "시황",
        "marketType": "KR",
        "publishedAt": "2026-03-31T14:15:00Z",
        "source": "연합뉴스",
        "summary": "코스피가 외국인 투자자들의 순매수세에 힘입어 반등하고 있습니다.",
        "relatedSymbols": ["005930", "000660"],
        "url": "https://example.com/news/001",
        "thumbnailUrl": "https://example.com/thumb/001.jpg"
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

### 2.6 관심종목 API

**Endpoint**: `GET /api/v1/watchlist`

**설명**: 사용자 관심종목 조회

**Request**:
```http
GET /api/v1/watchlist?marketType=KR HTTP/1.1
Authorization: Bearer {token}
```

**Query Parameters**:
| 파라미터 | 타입 | 필수 | 설명 | 기본값 |
|---------|------|------|------|--------|
| marketType | string | N | 시장 타입 (KR, US, ALL) | ALL |

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "watchlist-001",
      "symbol": "005930",
      "name": "삼성전자",
      "marketType": "KR",
      "currentPrice": 75000,
      "changeValue": 1200,
      "changePercent": 1.63,
      "volume": 28500000,
      "addedAt": "2026-03-15T10:00:00Z",
      "note": "장기 보유 종목"
    }
  ]
}
```

**Add to Watchlist**:
```http
POST /api/v1/watchlist HTTP/1.1
Authorization: Bearer {token}
Content-Type: application/json

{
  "symbol": "005930",
  "marketType": "KR",
  "note": "장기 보유 종목"
}
```

**Remove from Watchlist**:
```http
DELETE /api/v1/watchlist/{symbol} HTTP/1.1
Authorization: Bearer {token}
```

---

## 3. WebSocket API (실시간 데이터)

### 3.1 연결

**Endpoint**: `wss://ws.stockdashboard.com/v1/realtime`

**연결**:
```javascript
const ws = new WebSocket('wss://ws.stockdashboard.com/v1/realtime');

ws.onopen = () => {
  // 구독 메시지 전송
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'market-updates',
    symbols: ['005930', '000660', 'AAPL', 'TSLA']
  }));
};
```

### 3.2 메시지 형식

**구독 요청**:
```json
{
  "type": "subscribe",
  "channel": "market-updates",
  "symbols": ["005930", "AAPL"]
}
```

**실시간 가격 업데이트**:
```json
{
  "type": "price-update",
  "symbol": "005930",
  "currentPrice": 75100,
  "changeValue": 1300,
  "changePercent": 1.76,
  "volume": 28600000,
  "timestamp": "2026-03-31T14:26:00Z"
}
```

**시장 상태 변경**:
```json
{
  "type": "market-status",
  "market": "KR",
  "status": "TRADING",
  "timestamp": "2026-03-31T09:00:00Z"
}
```

---

## 4. 에러 코드

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| INVALID_REQUEST | 400 | 잘못된 요청 |
| UNAUTHORIZED | 401 | 인증 실패 |
| FORBIDDEN | 403 | 권한 없음 |
| NOT_FOUND | 404 | 리소스 없음 |
| RATE_LIMIT_EXCEEDED | 429 | 요청 제한 초과 |
| INTERNAL_SERVER_ERROR | 500 | 서버 오류 |
| SERVICE_UNAVAILABLE | 503 | 서비스 일시 중단 |

---

## 5. 인증

**Bearer Token**:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**토큰 갱신**:
```http
POST /api/v1/auth/refresh HTTP/1.1
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

---

## 6. Rate Limiting

- 인증 사용자: 1000 req/min
- 미인증 사용자: 100 req/min
- WebSocket: 100 구독/연결

---

**문서 버전**: v1.0
**작성일**: 2026-03-31
**다음 단계**: 데이터 모델 설계
