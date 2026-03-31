# 구현 가이드 및 더미 데이터

## 1. 가장 중요한 컴포넌트 5개

### 1.1 GlobalSummaryBar (글로벌 요약 바) ⭐⭐⭐⭐⭐

**중요도**: 최상
**이유**: 사용자가 첫 3초 안에 보는 핵심 정보

**구현 포인트**:
- 실시간 업데이트 필수 (WebSocket 또는 Polling)
- 로딩 상태 처리 (스켈레톤 UI)
- 모바일에서 가로 스크롤 지원 (snap-scroll)
- 각 카드 클릭 시 상세 페이지 이동

**코드 예시**:
```typescript
import { useDashboard } from '@/hooks/queries/useDashboard';
import { IndexCard } from '@/components/common/IndexCard';
import { Skeleton } from '@/components/ui/skeleton';

export function GlobalSummaryBar() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="global-summary-bar">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-40" />
        ))}
      </div>
    );
  }

  return (
    <div className="global-summary-bar overflow-x-auto snap-x snap-mandatory">
      <div className="flex gap-4 p-4">
        <IndexCard data={data?.globalSummary.kospi} variant="compact" />
        <IndexCard data={data?.globalSummary.kosdaq} variant="compact" />
        <IndexCard data={data?.globalSummary.nasdaq} variant="compact" />
        <IndexCard data={data?.globalSummary.sp500} variant="compact" />
        <ExchangeRateCard data={data?.globalSummary.usdKrw} />
        <FuturesCard data={data?.globalSummary.futures} />
        <MarketStatusBadge status={data?.globalSummary.marketStatus} />
      </div>
    </div>
  );
}
```

---

### 1.2 DomesticHeatmap (국내 실시간 마켓맵) ⭐⭐⭐⭐⭐

**중요도**: 최상
**이유**: 서비스의 핵심 차별화 기능

**구현 포인트**:
- Treemap 레이아웃 알고리즘 구현 (D3.js 활용)
- 박스 크기 = 등락률 + 거래대금 + 관심도 가중치
- 색상 강도 = 등락률 절댓값
- 호버 시 툴팁 표시
- 필터 및 기간 선택 시 즉시 재계산

**코드 예시**:
```typescript
import { useMemo } from 'react';
import { useHeatmap } from '@/hooks/queries/useHeatmap';
import { HeatmapBox } from './HeatmapBox';
import { calculateTreemapLayout } from '@/utils/treemap';

export function DomesticHeatmap({ period, filter }) {
  const { data } = useHeatmap({ marketType: 'KR', period, filter });

  const layout = useMemo(() => {
    if (!data) return [];
    return calculateTreemapLayout(data, {
      width: 800,
      height: 500,
    });
  }, [data]);

  return (
    <div className="heatmap-container relative w-full h-[500px]">
      {layout.map((box) => (
        <HeatmapBox
          key={box.id}
          data={box}
          style={{
            position: 'absolute',
            left: `${box.x}px`,
            top: `${box.y}px`,
            width: `${box.width}px`,
            height: `${box.height}px`,
          }}
        />
      ))}
    </div>
  );
}
```

---

### 1.3 HeatmapBox (히트맵 개별 박스) ⭐⭐⭐⭐

**중요도**: 상
**이유**: 히트맵의 핵심 시각적 요소

**구현 포인트**:
- React.memo로 최적화 (불필요한 리렌더링 방지)
- 등락률에 따른 색상 동적 계산
- 호버 시 툴팁 표시 (대표 종목, 상세 정보)
- 클릭 시 테마 상세 페이지 이동

**코드 예시**:
```typescript
import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';

interface HeatmapBoxProps {
  data: ThemeHeatmapData;
  style: React.CSSProperties;
}

export const HeatmapBox = memo(({ data, style }: HeatmapBoxProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const bgColor = getBackgroundColor(data.changePercent);
  const textColor = getTextColor(data.changePercent);

  const handleClick = () => {
    navigate(`/domestic/sectors/themes/${data.id}`);
  };

  return (
    <div
      className={cn(
        'heatmap-box cursor-pointer transition-all hover:opacity-90',
        'flex flex-col justify-between p-3 rounded-sm',
        bgColor,
        textColor
      )}
      style={style}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {data.rank <= 3 && (
        <div className="rank-badge text-xs font-bold">
          {data.rank === 1 ? '🥇' : data.rank === 2 ? '🥈' : '🥉'}
        </div>
      )}
      <div>
        <h4 className="font-bold text-sm mb-1">{data.groupName}</h4>
        <p className="text-2xl font-bold">
          {data.changePercent > 0 ? '+' : ''}
          {data.changePercent.toFixed(1)}%
        </p>
      </div>
      <div className="leader-stocks text-xs opacity-80">
        {data.leaderStocks.slice(0, 2).map((stock, i) => (
          <span key={stock.symbol}>
            {i > 0 && ', '}
            {stock.name}
          </span>
        ))}
      </div>
      {isHovered && <HeatmapTooltip data={data} />}
    </div>
  );
});

function getBackgroundColor(changePercent: number): string {
  if (changePercent >= 3) return 'bg-red-600';
  if (changePercent >= 1) return 'bg-red-400';
  if (changePercent > 0) return 'bg-red-200';
  if (changePercent > -1) return 'bg-blue-200';
  if (changePercent > -3) return 'bg-blue-400';
  return 'bg-blue-600';
}

function getTextColor(changePercent: number): string {
  if (Math.abs(changePercent) >= 1) return 'text-white';
  return 'text-gray-900';
}
```

---

### 1.4 TopMoversPortlet (급등/거래대금 탭) ⭐⭐⭐⭐

**중요도**: 상
**이유**: 사용자 관심도가 높은 정보

**구현 포인트**:
- 탭 전환 시 부드러운 애니메이션
- 각 종목 클릭 시 종목 상세 페이지 이동
- 미니 차트 표시 (Sparkline)
- 실시간 업데이트 지원

**코드 예시**:
```typescript
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StockListItem } from '@/components/common/StockListItem';

export function TopMoversPortlet({ data }) {
  const [activeTab, setActiveTab] = useState('gainers');

  return (
    <div className="top-movers-portlet">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gainers">급등</TabsTrigger>
          <TabsTrigger value="activeVolume">거래대금</TabsTrigger>
          <TabsTrigger value="trending">조회수</TabsTrigger>
        </TabsList>
        <TabsContent value="gainers" className="space-y-2">
          {data?.gainers.slice(0, 10).map((stock, index) => (
            <StockListItem
              key={stock.symbol}
              stock={stock}
              rank={index + 1}
              showChart
            />
          ))}
        </TabsContent>
        <TabsContent value="activeVolume" className="space-y-2">
          {data?.activeVolume.slice(0, 10).map((stock, index) => (
            <StockListItem
              key={stock.symbol}
              stock={stock}
              rank={index + 1}
              showChart
            />
          ))}
        </TabsContent>
        <TabsContent value="trending" className="space-y-2">
          {data?.trending.slice(0, 10).map((stock, index) => (
            <StockListItem
              key={stock.symbol}
              stock={stock}
              rank={index + 1}
            />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

### 1.5 WatchlistPortlet (관심종목 포틀릿) ⭐⭐⭐

**중요도**: 중상
**이유**: 개인화 핵심 기능

**구현 포인트**:
- 로그인 전: 로컬 스토리지 저장
- 로그인 후: 서버 동기화
- 추가/제거 버튼 제공
- 실시간 가격 업데이트
- 드래그 앤 드롭으로 순서 변경 (추후)

**코드 예시**:
```typescript
import { useWatchlist } from '@/hooks/queries/useWatchlist';
import { useRemoveFromWatchlist } from '@/hooks/mutations/useWatchlist';
import { StockListItem } from '@/components/common/StockListItem';
import { Button } from '@/components/ui/button';

export function WatchlistPortlet({ marketType }) {
  const { data: watchlist, isLoading } = useWatchlist(marketType);
  const { mutate: removeStock } = useRemoveFromWatchlist();

  if (isLoading) return <div>로딩 중...</div>;

  if (!watchlist || watchlist.length === 0) {
    return (
      <div className="empty-state text-center p-8">
        <p className="text-gray-500">관심종목을 추가해보세요</p>
        <Button className="mt-4">종목 검색</Button>
      </div>
    );
  }

  return (
    <div className="watchlist-portlet">
      <div className="space-y-2">
        {watchlist.map((stock) => (
          <div key={stock.symbol} className="relative group">
            <StockListItem stock={stock} showChart />
            <button
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeStock(stock.symbol)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 2. React + Tailwind 컴포넌트 분해안

### 2.1 IndexCard (지수 카드)

```typescript
// src/components/common/IndexCard.tsx
import { cn } from '@/lib/cn';
import { ChangeRate } from './ChangeRate';
import { MiniChart } from './MiniChart';

interface IndexCardProps {
  data: MarketIndex;
  variant?: 'default' | 'compact' | 'detailed';
  showChart?: boolean;
}

export function IndexCard({ data, variant = 'default', showChart = true }: IndexCardProps) {
  return (
    <div
      className={cn(
        'index-card bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4',
        'transition-all hover:shadow-md cursor-pointer',
        variant === 'compact' && 'snap-start w-40 flex-shrink-0',
        variant === 'detailed' && 'w-full'
      )}
    >
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {data.name}
      </h3>
      {showChart && data.sparklineData && (
        <MiniChart data={data.sparklineData} className="my-2 h-12" />
      )}
      <p className="text-2xl font-bold tabular-nums">
        {data.currentPrice.toLocaleString()}
      </p>
      <ChangeRate value={data.changeValue} percent={data.changePercent} />
      {variant === 'detailed' && (
        <div className="mt-2 text-xs text-gray-600">
          <p>거래량: {formatVolume(data.volume)}</p>
          <p>거래대금: {formatTradingValue(data.tradingValue)}</p>
        </div>
      )}
    </div>
  );
}
```

### 2.2 ChangeRate (등락률 표시)

```typescript
// src/components/common/ChangeRate.tsx
import { cn } from '@/lib/cn';

interface ChangeRateProps {
  value: number;
  percent: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function ChangeRate({ value, percent, size = 'md', showIcon = true }: ChangeRateProps) {
  const isPositive = percent > 0;
  const isNegative = percent < 0;

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div
      className={cn(
        'change-rate flex items-center gap-1 font-semibold tabular-nums',
        sizeClasses[size],
        isPositive && 'text-red-600 dark:text-red-400',
        isNegative && 'text-blue-600 dark:text-blue-400',
        !isPositive && !isNegative && 'text-gray-600 dark:text-gray-400'
      )}
    >
      <span>
        {isPositive && '+'}
        {value.toLocaleString()}
      </span>
      <span>
        ({isPositive && '+'}
        {percent.toFixed(2)}%)
      </span>
      {showIcon && (
        <span className="text-lg">
          {isPositive ? '🔴' : isNegative ? '🔵' : '⚫'}
        </span>
      )}
    </div>
  );
}
```

### 2.3 StockListItem (종목 리스트 아이템)

```typescript
// src/components/common/StockListItem.tsx
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ChangeRate } from './ChangeRate';
import { MiniChart } from './MiniChart';

interface StockListItemProps {
  stock: Stock;
  rank?: number;
  showChart?: boolean;
  variant?: 'default' | 'compact';
}

export function StockListItem({ stock, rank, showChart, variant = 'default' }: StockListItemProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'stock-list-item flex items-center gap-3 p-3 rounded-lg',
        'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700',
        'transition-colors cursor-pointer'
      )}
      onClick={() => navigate(`/stock/${stock.symbol}`)}
    >
      {rank && (
        <div className="rank flex-shrink-0 w-6 text-center font-bold text-gray-600">
          {rank}
        </div>
      )}
      <div className="stock-info flex-1 min-w-0">
        <h5 className="font-semibold truncate">{stock.name}</h5>
        <p className="text-xs text-gray-500">{stock.symbol}</p>
      </div>
      <div className="stock-price text-right">
        <p className="font-bold tabular-nums">{stock.currentPrice.toLocaleString()}</p>
        <ChangeRate value={stock.changeValue} percent={stock.changePercent} size="sm" />
      </div>
      {showChart && stock.sparklineData && (
        <MiniChart data={stock.sparklineData} className="w-16 h-8" />
      )}
    </div>
  );
}
```

### 2.4 MiniChart (미니 차트)

```typescript
// src/components/common/MiniChart.tsx
import { Sparklines, SparklinesLine } from 'react-sparklines';

interface MiniChartProps {
  data: number[];
  className?: string;
  color?: 'red' | 'blue' | 'gray';
}

export function MiniChart({ data, className, color = 'gray' }: MiniChartProps) {
  const colors = {
    red: '#DC2626',
    blue: '#2563EB',
    gray: '#6B7280',
  };

  const isUp = data[data.length - 1] > data[0];
  const lineColor = isUp ? colors.red : colors.blue;

  return (
    <div className={className}>
      <Sparklines data={data} width={100} height={30}>
        <SparklinesLine color={lineColor} style={{ strokeWidth: 2, fill: 'none' }} />
      </Sparklines>
    </div>
  );
}
```

---

## 3. 더미 데이터 (JSON 샘플)

### 3.1 Dashboard Home 더미 데이터

```typescript
// src/data/mockDashboard.ts
export const mockDashboardData = {
  globalSummary: {
    kospi: {
      name: '코스피',
      symbol: 'KS11',
      currentPrice: 2650.23,
      changeValue: 15.25,
      changePercent: 0.58,
      marketStatus: 'TRADING',
      volume: 458920000,
      sparklineData: [2635, 2640, 2645, 2642, 2650],
      lastUpdated: '2026-03-31T14:25:00Z',
    },
    kosdaq: {
      name: '코스닥',
      symbol: 'KQ11',
      currentPrice: 850.45,
      changeValue: -5.20,
      changePercent: -0.61,
      marketStatus: 'TRADING',
      volume: 685430000,
      sparklineData: [855, 852, 848, 851, 850],
      lastUpdated: '2026-03-31T14:25:00Z',
    },
    // ... 나머지 지수
  },
  domestic: {
    heatmap: [
      {
        id: 'theme-semiconductor',
        groupType: 'THEME',
        groupName: '반도체',
        changePercent: 5.2,
        rank: 1,
        weightScore: 95,
        stockCount: 45,
        leaderStocks: [
          { symbol: '005930', name: '삼성전자', changePercent: 4.8 },
          { symbol: '000660', name: 'SK하이닉스', changePercent: 6.2 },
        ],
      },
      {
        id: 'theme-battery',
        groupType: 'THEME',
        groupName: '2차전지',
        changePercent: 3.8,
        rank: 2,
        weightScore: 82,
        stockCount: 38,
        leaderStocks: [
          { symbol: '006400', name: '삼성SDI', changePercent: 4.5 },
        ],
      },
      // ... 더 많은 테마
    ],
    topMovers: {
      gainers: [
        {
          symbol: '005930',
          name: '삼성전자',
          marketType: 'KR',
          currentPrice: 75000,
          changeValue: 1200,
          changePercent: 1.63,
          volume: 28500000,
          sparklineData: [73800, 74200, 74500, 74800, 75000],
          lastUpdated: '2026-03-31T14:25:00Z',
        },
        // ... 더 많은 종목
      ],
    },
  },
};
```

---

## 4. 홈 화면 초기 렌더링 상태

### 4.1 로딩 상태 (Skeleton UI)

```typescript
export function HomePageSkeleton() {
  return (
    <div className="home-page">
      {/* Global Summary Bar Skeleton */}
      <div className="global-summary-bar flex gap-4 p-4">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-40 flex-shrink-0" />
        ))}
      </div>

      {/* Domestic Section Skeleton */}
      <div className="domestic-section mt-8">
        <Skeleton className="h-8 w-48 mb-4" /> {/* Section Title */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="col-span-2 h-96" /> {/* Heatmap */}
          <Skeleton className="h-96" /> {/* Top Movers */}
        </div>
      </div>
    </div>
  );
}
```

### 4.2 에러 상태

```typescript
export function ErrorState({ error }: { error: Error }) {
  return (
    <div className="error-state flex flex-col items-center justify-center p-12">
      <div className="text-red-600 text-6xl mb-4">⚠️</div>
      <h3 className="text-xl font-bold mb-2">데이터를 불러올 수 없습니다</h3>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        새로고침
      </button>
    </div>
  );
}
```

---

## 5. 성능 최적화 체크리스트

- [ ] React.memo로 컴포넌트 메모이제이션
- [ ] useMemo로 계산 결과 캐싱
- [ ] useCallback로 함수 메모이제이션
- [ ] 이미지 lazy loading
- [ ] Code splitting (React.lazy)
- [ ] Virtual scrolling (긴 리스트)
- [ ] Debouncing (검색 입력)
- [ ] WebSocket 연결 관리 (reconnect logic)
- [ ] 캐싱 전략 (React Query staleTime)
- [ ] CDN 활용 (정적 자산)

---

**문서 버전**: v1.0
**작성일**: 2026-03-31
