# 컴포넌트 아키텍처

## 1. 전체 컴포넌트 트리

```
App
├── AppLayout
│   ├── Header
│   │   ├── Logo
│   │   ├── SearchBar
│   │   │   └── AutoComplete
│   │   └── UserMenu
│   │       ├── WatchlistIcon
│   │       ├── NotificationIcon
│   │       └── ProfileMenu
│   │
│   ├── MainContent
│   │   └── HomePage
│   │       ├── GlobalSummaryBar
│   │       │   ├── IndexCard (코스피)
│   │       │   ├── IndexCard (코스닥)
│   │       │   ├── IndexCard (나스닥)
│   │       │   ├── IndexCard (S&P500)
│   │       │   ├── ExchangeRateCard
│   │       │   ├── FuturesCard
│   │       │   └── MarketStatusBadge
│   │       │
│   │       ├── DomesticStockSection
│   │       │   ├── SectionHeader
│   │       │   ├── DomesticIndexCardRow
│   │       │   │   ├── IndexCard (코스피)
│   │       │   │   ├── IndexCard (코스닥)
│   │       │   │   ├── FuturesCard
│   │       │   │   └── ExchangeRateCard
│   │       │   ├── MarketMapRow
│   │       │   │   ├── DomesticHeatmap (2/3)
│   │       │   │   │   ├── HeatmapToolbar
│   │       │   │   │   │   ├── FilterButtons
│   │       │   │   │   │   └── PeriodSelector
│   │       │   │   │   └── HeatmapGrid
│   │       │   │   │       └── HeatmapBox[] (테마별)
│   │       │   │   │           ├── ThemeName
│   │       │   │   │           ├── ChangeRate
│   │       │   │   │           ├── LeaderStocks
│   │       │   │   │           └── RankBadge
│   │       │   │   └── TopMoversPortlet (1/3)
│   │       │   │       ├── TabNav
│   │       │   │       │   ├── Tab (급등)
│   │       │   │       │   ├── Tab (거래대금)
│   │       │   │       │   └── Tab (조회수)
│   │       │   │       └── StockList
│   │       │   │           └── StockListItem[]
│   │       │   │               ├── StockName
│   │       │   │               ├── Price
│   │       │   │               ├── ChangeRate
│   │       │   │               └── MiniChart
│   │       │   └── ContentRow
│   │       │       ├── WatchlistPortlet (국내)
│   │       │       │   ├── PortletHeader
│   │       │       │   └── StockList
│   │       │       │       └── StockListItem[]
│   │       │       └── NewsPortlet (국내)
│   │       │           ├── PortletHeader
│   │       │           └── NewsList
│   │       │               └── NewsItem[]
│   │       │                   ├── NewsTitle
│   │       │                   ├── NewsMeta
│   │       │                   └── NewsTags
│   │       │
│   │       ├── OverseasStockSection
│   │       │   ├── SectionHeader
│   │       │   ├── OverseasIndexCardRow
│   │       │   │   ├── IndexCard (나스닥)
│   │       │   │   ├── IndexCard (S&P500)
│   │       │   │   ├── IndexCard (다우)
│   │       │   │   └── FuturesCard (선물)
│   │       │   ├── SectorMapRow
│   │       │   │   ├── OverseasHeatmap (2/3)
│   │       │   │   │   ├── HeatmapToolbar
│   │       │   │   │   │   ├── FilterButtons
│   │       │   │   │   │   └── PeriodSelector
│   │       │   │   │   └── HeatmapGrid
│   │       │   │   │       └── HeatmapBox[] (섹터별)
│   │       │   │   │           ├── SectorName
│   │       │   │   │           ├── ChangeRate
│   │       │   │   │           ├── LeaderStocks
│   │       │   │   │           └── MarketCapWeight
│   │       │   │   └── BigTechPortlet (1/3)
│   │       │   │       ├── TabNav
│   │       │   │       │   ├── Tab (인기)
│   │       │   │       │   ├── Tab (빅테크)
│   │       │   │       │   └── Tab (거래량)
│   │       │   │       └── StockList
│   │       │   │           └── StockListItem[]
│   │       │   └── ContentRow
│   │       │       ├── WatchlistPortlet (해외)
│   │       │       └── NewsPortlet (해외)
│   │       │
│   │       └── ExtendedSection (선택적)
│   │           ├── EconomicCalendarPortlet
│   │           │   ├── PortletHeader
│   │           │   └── EventList
│   │           │       └── EventItem[]
│   │           ├── MarketSentimentPortlet
│   │           │   ├── FearGreedIndex
│   │           │   ├── VIXIndicator
│   │           │   └── PutCallRatio
│   │           └── CommoditiesPortlet
│   │               ├── PortletHeader
│   │               └── CommodityCardRow
│   │                   ├── CommodityCard (금)
│   │                   ├── CommodityCard (유가)
│   │                   ├── CommodityCard (은)
│   │                   └── CommodityCard (국채)
│   │
│   └── Footer
│       ├── FooterLinks
│       └── Copyright
│
└── Providers
    ├── ThemeProvider
    ├── QueryClientProvider (React Query)
    ├── WebSocketProvider (실시간 데이터)
    └── AuthProvider
```

---

## 2. 핵심 컴포넌트 상세 설계

### 2.1 HomePage (메인 페이지 컨테이너)

**파일 경로**: `src/pages/HomePage.tsx`

**책임**:
- 전체 홈 화면 레이아웃 관리
- 포틀릿 배치 및 순서 제어
- 데이터 페칭 오케스트레이션

**Props**: 없음 (자체적으로 데이터 페칭)

**State**:
```typescript
interface HomePageState {
  isLoading: boolean;
  error: Error | null;
  dashboardData: DashboardData | null;
}
```

**주요 로직**:
```typescript
const HomePage = () => {
  // 1. 대시보드 데이터 페칭 (집계형 API 호출)
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', 'home'],
    queryFn: fetchHomeDashboard,
    refetchInterval: 60000, // 1분마다 갱신
  });

  // 2. 실시간 데이터 구독 (WebSocket)
  useWebSocket({
    channel: 'market-updates',
    onMessage: handleRealtimeUpdate,
  });

  // 3. 포틀릿 커스터마이징 설정 로드
  const { portletConfig } = usePortletConfig();

  return (
    <div className="home-page">
      <GlobalSummaryBar data={data?.globalSummary} />
      <DomesticStockSection data={data?.domestic} />
      <OverseasStockSection data={data?.overseas} />
      {portletConfig.showExtended && (
        <ExtendedSection data={data?.extended} />
      )}
    </div>
  );
};
```

---

### 2.2 GlobalSummaryBar (글로벌 요약 바)

**파일 경로**: `src/components/home/GlobalSummaryBar.tsx`

**책임**:
- 주요 지수, 환율, 시장 상태 요약 표시
- 실시간 업데이트 반영
- 모바일에서 가로 스크롤 지원

**Props**:
```typescript
interface GlobalSummaryBarProps {
  data?: GlobalSummaryData;
  isLoading?: boolean;
  className?: string;
}

interface GlobalSummaryData {
  kospi: MarketIndex;
  kosdaq: MarketIndex;
  nasdaq: MarketIndex;
  sp500: MarketIndex;
  usdKrw: ExchangeRate;
  futures: FuturesIndex;
  marketStatus: MarketStatus;
}
```

**구조**:
```typescript
const GlobalSummaryBar = ({ data, isLoading }: GlobalSummaryBarProps) => {
  if (isLoading) return <SummaryBarSkeleton />;

  return (
    <div className="global-summary-bar">
      <div className="summary-cards-container">
        <IndexCard data={data.kospi} variant="compact" />
        <IndexCard data={data.kosdaq} variant="compact" />
        <IndexCard data={data.nasdaq} variant="compact" />
        <IndexCard data={data.sp500} variant="compact" />
        <ExchangeRateCard data={data.usdKrw} variant="compact" />
        <FuturesCard data={data.futures} variant="compact" />
        <MarketStatusBadge status={data.marketStatus} />
      </div>
    </div>
  );
};
```

**스타일링**:
- 데스크탑: 가로 정렬, 고정 높이 (120px)
- 모바일: 가로 스크롤, snap-scroll 적용

---

### 2.3 DomesticHeatmap (국내 실시간 마켓맵) ⭐

**파일 경로**: `src/components/heatmap/DomesticHeatmap.tsx`

**책임**:
- 테마/업종별 히트맵 시각화
- 필터 및 기간 선택 기능
- 박스 크기 계산 (등락률 + 거래대금 + 관심도)
- 클릭 시 테마 상세 페이지 이동

**Props**:
```typescript
interface DomesticHeatmapProps {
  data?: ThemeHeatmapData[];
  period?: '1D' | '5D' | '20D' | '60D';
  filter?: 'inflow' | 'change' | 'count';
  onThemeClick?: (themeId: string) => void;
  className?: string;
}

interface ThemeHeatmapData {
  id: string;
  name: string;
  changePercent: number;
  rank: number;
  weightScore: number; // 박스 크기 결정 (0-100)
  leaderStocks: {
    symbol: string;
    name: string;
    changePercent: number;
  }[];
  stockCount: number;
}
```

**State**:
```typescript
const [period, setPeriod] = useState<Period>('1D');
const [filter, setFilter] = useState<Filter>('change');
```

**주요 로직**:
```typescript
const DomesticHeatmap = ({ data, onThemeClick }: DomesticHeatmapProps) => {
  // 1. 필터링 및 정렬
  const filteredData = useMemo(() => {
    return sortByFilter(data, filter);
  }, [data, filter]);

  // 2. 박스 크기 계산 (Treemap 알고리즘)
  const treemapLayout = useTreemapLayout(filteredData);

  // 3. 색상 계산 (등락률 기반)
  const getBoxColor = (changePercent: number) => {
    if (changePercent >= 3) return 'bg-red-600';
    if (changePercent >= 1) return 'bg-red-400';
    if (changePercent > 0) return 'bg-red-200';
    if (changePercent > -1) return 'bg-blue-200';
    if (changePercent > -3) return 'bg-blue-400';
    return 'bg-blue-600';
  };

  return (
    <div className="domestic-heatmap">
      <HeatmapToolbar
        period={period}
        filter={filter}
        onPeriodChange={setPeriod}
        onFilterChange={setFilter}
      />
      <HeatmapGrid>
        {treemapLayout.map((box) => (
          <HeatmapBox
            key={box.id}
            data={box}
            color={getBoxColor(box.changePercent)}
            size={box.weightScore}
            onClick={() => onThemeClick(box.id)}
          />
        ))}
      </HeatmapGrid>
    </div>
  );
};
```

**렌더링 최적화**:
- `useMemo`로 필터링/정렬 결과 캐싱
- `React.memo`로 HeatmapBox 리렌더링 방지
- 가상 스크롤 적용 (박스가 많을 경우)

---

### 2.4 HeatmapBox (히트맵 개별 박스)

**파일 경로**: `src/components/heatmap/HeatmapBox.tsx`

**책임**:
- 개별 테마/섹터 박스 렌더링
- 호버 시 툴팁 표시
- 클릭 이벤트 처리

**Props**:
```typescript
interface HeatmapBoxProps {
  data: ThemeHeatmapData;
  color: string;
  size: number; // 0-100
  onClick: () => void;
}
```

**구조**:
```typescript
const HeatmapBox = memo(({ data, color, size, onClick }: HeatmapBoxProps) => {
  const [isHovered, setIsHovered] = useState(false);

  // 박스 크기 계산 (flex-basis 또는 width/height)
  const boxStyle = {
    flexGrow: size,
    minWidth: `${size * 2}px`,
    minHeight: `${size * 1.5}px`,
  };

  return (
    <div
      className={`heatmap-box ${color}`}
      style={boxStyle}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="box-content">
        {data.rank <= 3 && <RankBadge rank={data.rank} />}
        <h4 className="theme-name">{data.name}</h4>
        <p className="change-rate">
          {data.changePercent > 0 ? '+' : ''}
          {data.changePercent.toFixed(1)}%
        </p>
        <div className="leader-stocks">
          {data.leaderStocks.slice(0, 2).map((stock) => (
            <span key={stock.symbol}>{stock.name}</span>
          ))}
        </div>
      </div>
      {isHovered && <HeatmapTooltip data={data} />}
    </div>
  );
});
```

---

### 2.5 TopMoversPortlet (급등/거래대금 탭 포틀릿)

**파일 경로**: `src/components/portlets/TopMoversPortlet.tsx`

**책임**:
- 급등주, 거래대금, 조회수 탭 표시
- 종목 리스트 렌더링
- 클릭 시 종목 상세 페이지 이동

**Props**:
```typescript
interface TopMoversPortletProps {
  data?: {
    gainers: Stock[];
    activeVolume: Stock[];
    trending: Stock[];
  };
  defaultTab?: 'gainers' | 'activeVolume' | 'trending';
  maxItems?: number;
}
```

**State**:
```typescript
const [activeTab, setActiveTab] = useState<TabType>('gainers');
```

**구조**:
```typescript
const TopMoversPortlet = ({ data, maxItems = 10 }: TopMoversPortletProps) => {
  const [activeTab, setActiveTab] = useState('gainers');

  const currentData = data?.[activeTab] || [];

  return (
    <div className="top-movers-portlet">
      <TabNav>
        <Tab
          active={activeTab === 'gainers'}
          onClick={() => setActiveTab('gainers')}
        >
          급등
        </Tab>
        <Tab
          active={activeTab === 'activeVolume'}
          onClick={() => setActiveTab('activeVolume')}
        >
          거래대금
        </Tab>
        <Tab
          active={activeTab === 'trending'}
          onClick={() => setActiveTab('trending')}
        >
          조회수
        </Tab>
      </TabNav>
      <StockList>
        {currentData.slice(0, maxItems).map((stock, index) => (
          <StockListItem key={stock.symbol} stock={stock} rank={index + 1} />
        ))}
      </StockList>
      <ViewMoreButton to="/domestic/movers" />
    </div>
  );
};
```

---

### 2.6 StockListItem (종목 리스트 아이템)

**파일 경로**: `src/components/common/StockListItem.tsx`

**책임**:
- 개별 종목 정보 표시
- 현재가, 등락률, 미니 차트 렌더링
- 클릭 시 종목 상세 페이지 이동

**Props**:
```typescript
interface StockListItemProps {
  stock: Stock;
  rank?: number;
  showChart?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  onClick?: () => void;
}

interface Stock {
  symbol: string;
  name: string;
  currentPrice: number;
  changeValue: number;
  changePercent: number;
  volume?: number;
  sparklineData?: number[];
}
```

**구조**:
```typescript
const StockListItem = ({
  stock,
  rank,
  showChart = true,
  variant = 'default',
}: StockListItemProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/stock/${stock.symbol}`);
  };

  return (
    <div className="stock-list-item" onClick={handleClick}>
      {rank && <span className="rank">{rank}</span>}
      <div className="stock-info">
        <h5 className="stock-name">{stock.name}</h5>
        <p className="stock-symbol">{stock.symbol}</p>
      </div>
      <div className="stock-price">
        <p className="price">{formatPrice(stock.currentPrice)}</p>
        <ChangeRate
          value={stock.changeValue}
          percent={stock.changePercent}
        />
      </div>
      {showChart && stock.sparklineData && (
        <MiniChart data={stock.sparklineData} />
      )}
    </div>
  );
};
```

---

### 2.7 WatchlistPortlet (관심종목 포틀릿)

**파일 경로**: `src/components/portlets/WatchlistPortlet.tsx`

**책임**:
- 사용자 관심종목 표시
- 실시간 가격 업데이트
- 관심종목 추가/제거

**Props**:
```typescript
interface WatchlistPortletProps {
  marketType: 'domestic' | 'overseas';
  maxItems?: number;
}
```

**주요 로직**:
```typescript
const WatchlistPortlet = ({ marketType, maxItems = 10 }: WatchlistPortletProps) => {
  // 1. 사용자 관심종목 조회
  const { data: watchlist } = useQuery({
    queryKey: ['watchlist', marketType],
    queryFn: () => fetchWatchlist(marketType),
  });

  // 2. 실시간 가격 업데이트 구독
  useWebSocket({
    channel: `watchlist-${marketType}`,
    symbols: watchlist?.map((s) => s.symbol) || [],
    onUpdate: handlePriceUpdate,
  });

  // 3. 관심종목 제거
  const { mutate: removeStock } = useMutation({
    mutationFn: removeFromWatchlist,
    onSuccess: () => queryClient.invalidateQueries(['watchlist']),
  });

  return (
    <div className="watchlist-portlet">
      <PortletHeader
        title={marketType === 'domestic' ? '국내 관심종목' : '해외 관심종목'}
        action={<Link to="/watchlist">전체보기</Link>}
      />
      {watchlist?.length === 0 ? (
        <EmptyState message="관심종목을 추가해보세요" />
      ) : (
        <StockList>
          {watchlist?.slice(0, maxItems).map((stock) => (
            <StockListItem
              key={stock.symbol}
              stock={stock}
              onRemove={() => removeStock(stock.symbol)}
            />
          ))}
        </StockList>
      )}
    </div>
  );
};
```

---

### 2.8 NewsPortlet (뉴스 포틀릿)

**파일 경로**: `src/components/portlets/NewsPortlet.tsx`

**책임**:
- 최신 뉴스 표시
- 뉴스 카테고리 필터링
- 클릭 시 뉴스 상세 보기

**Props**:
```typescript
interface NewsPortletProps {
  marketType: 'domestic' | 'overseas';
  maxItems?: number;
}

interface NewsItem {
  id: string;
  title: string;
  category: string;
  publishedAt: Date;
  source: string;
  summary?: string;
  relatedSymbols: string[];
  url: string;
}
```

**구조**:
```typescript
const NewsPortlet = ({ marketType, maxItems = 5 }: NewsPortletProps) => {
  const { data: news } = useQuery({
    queryKey: ['news', marketType],
    queryFn: () => fetchNews(marketType),
    refetchInterval: 180000, // 3분마다 갱신
  });

  return (
    <div className="news-portlet">
      <PortletHeader
        title={marketType === 'domestic' ? '국내 뉴스' : '해외 뉴스'}
        action={<Link to={`/${marketType}/news`}>전체보기</Link>}
      />
      <NewsList>
        {news?.slice(0, maxItems).map((item) => (
          <NewsItem key={item.id} data={item} />
        ))}
      </NewsList>
    </div>
  );
};

const NewsItem = ({ data }: { data: NewsItem }) => {
  return (
    <a href={data.url} target="_blank" className="news-item">
      <div className="news-content">
        <h5 className="news-title">{data.title}</h5>
        <p className="news-meta">
          <TimeAgo date={data.publishedAt} /> · {data.source}
        </p>
        {data.relatedSymbols.length > 0 && (
          <div className="news-tags">
            {data.relatedSymbols.map((symbol) => (
              <Tag key={symbol}>#{symbol}</Tag>
            ))}
          </div>
        )}
      </div>
    </a>
  );
};
```

---

## 3. 공통 컴포넌트

### 3.1 IndexCard (지수 카드)

**파일 경로**: `src/components/common/IndexCard.tsx`

**Props**:
```typescript
interface IndexCardProps {
  data: MarketIndex;
  variant?: 'default' | 'compact' | 'detailed';
  showChart?: boolean;
}

interface MarketIndex {
  name: string;
  symbol: string;
  currentPrice: number;
  changeValue: number;
  changePercent: number;
  marketStatus?: string;
  volume?: number;
  sparklineData?: number[];
}
```

---

### 3.2 ChangeRate (등락률 표시)

**파일 경로**: `src/components/common/ChangeRate.tsx`

**Props**:
```typescript
interface ChangeRateProps {
  value: number;
  percent: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}
```

**구조**:
```typescript
const ChangeRate = ({ value, percent, size = 'md', showIcon = true }: ChangeRateProps) => {
  const isPositive = percent > 0;
  const isNegative = percent < 0;

  const colorClass = isPositive ? 'text-red-600' : isNegative ? 'text-blue-600' : 'text-gray-600';
  const icon = isPositive ? '🔴' : isNegative ? '🔵' : '⚫';

  return (
    <div className={`change-rate ${colorClass} ${size}`}>
      <span className="value">
        {isPositive && '+'}
        {formatNumber(value)}
      </span>
      <span className="percent">
        {isPositive && '+'}
        {percent.toFixed(2)}%
      </span>
      {showIcon && <span className="icon">{icon}</span>}
    </div>
  );
};
```

---

### 3.3 MiniChart (미니 차트)

**파일 경로**: `src/components/common/MiniChart.tsx`

**Props**:
```typescript
interface MiniChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: 'red' | 'blue' | 'gray';
}
```

**구현**:
- Recharts 또는 D3.js 사용
- 라인 차트, 축 없음
- SVG 렌더링

---

### 3.4 PortletHeader (포틀릿 헤더)

**파일 경로**: `src/components/common/PortletHeader.tsx`

**Props**:
```typescript
interface PortletHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}
```

---

### 3.5 SectionHeader (섹션 헤더)

**파일 경로**: `src/components/common/SectionHeader.tsx`

**Props**:
```typescript
interface SectionHeaderProps {
  title: string;
  icon?: string;
  link?: string;
  linkText?: string;
}
```

---

## 4. 레이아웃 컴포넌트

### 4.1 AppLayout

**파일 경로**: `src/layouts/AppLayout.tsx`

**구조**:
```typescript
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="app-layout">
      <Header />
      <main className="main-content">{children}</main>
      <Footer />
    </div>
  );
};
```

---

### 4.2 Header

**파일 경로**: `src/components/layout/Header.tsx`

**구조**:
```typescript
const Header = () => {
  return (
    <header className="header">
      <Logo />
      <SearchBar />
      <UserMenu>
        <WatchlistIcon />
        <NotificationIcon />
        <ProfileMenu />
      </UserMenu>
    </header>
  );
};
```

---

## 5. Custom Hooks

### 5.1 useWebSocket (실시간 데이터)

**파일 경로**: `src/hooks/useWebSocket.ts`

```typescript
interface UseWebSocketOptions {
  channel: string;
  symbols?: string[];
  onMessage: (data: any) => void;
  onError?: (error: Error) => void;
}

const useWebSocket = ({ channel, symbols, onMessage }: UseWebSocketOptions) => {
  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/${channel}`);

    ws.onopen = () => {
      if (symbols) {
        ws.send(JSON.stringify({ type: 'subscribe', symbols }));
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [channel, symbols]);
};
```

---

### 5.2 usePortletConfig (포틀릿 설정)

**파일 경로**: `src/hooks/usePortletConfig.ts`

```typescript
const usePortletConfig = () => {
  const { data: config } = useQuery({
    queryKey: ['portlet-config'],
    queryFn: fetchPortletConfig,
  });

  const updateConfig = useMutation({
    mutationFn: updatePortletConfig,
    onSuccess: () => queryClient.invalidateQueries(['portlet-config']),
  });

  return {
    portletConfig: config,
    updatePortletConfig: updateConfig.mutate,
  };
};
```

---

### 5.3 useTreemapLayout (히트맵 레이아웃)

**파일 경로**: `src/hooks/useTreemapLayout.ts`

```typescript
const useTreemapLayout = (data: ThemeHeatmapData[]) => {
  return useMemo(() => {
    // Treemap 알고리즘 적용 (squarified treemap)
    return calculateTreemapLayout(data);
  }, [data]);
};

function calculateTreemapLayout(data: ThemeHeatmapData[]) {
  // D3.js treemap 또는 자체 구현
  // 박스 크기와 위치 계산
  return data.map((item) => ({
    ...item,
    x: 0, // 계산된 x 좌표
    y: 0, // 계산된 y 좌표
    width: item.weightScore * 10, // 계산된 너비
    height: item.weightScore * 8, // 계산된 높이
  }));
}
```

---

## 6. 상태 관리

### 6.1 전역 상태 (Zustand 또는 Jotai)

**파일 경로**: `src/store/appStore.ts`

```typescript
interface AppState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  user: User | null;
  setUser: (user: User | null) => void;
}

const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  setTheme: (theme) => set({ theme }),
  user: null,
  setUser: (user) => set({ user }),
}));
```

---

### 6.2 서버 상태 (React Query)

**파일 경로**: `src/lib/queryClient.ts`

```typescript
const queryClient = new QueryClient({
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

---

## 7. 컴포넌트 재사용 원칙

1. **Atomic Design**: Atoms → Molecules → Organisms → Templates → Pages
2. **Props Drilling 방지**: Context 또는 상태 관리 라이브러리 사용
3. **Composition over Inheritance**: 합성 패턴 우선
4. **Single Responsibility**: 한 컴포넌트는 한 가지 책임만
5. **DRY (Don't Repeat Yourself)**: 중복 코드 최소화

---

## 8. 성능 최적화

1. **React.memo**: 불필요한 리렌더링 방지
2. **useMemo / useCallback**: 계산 및 함수 메모이제이션
3. **Code Splitting**: React.lazy로 동적 임포트
4. **Virtual Scrolling**: react-window 또는 react-virtualized
5. **Debouncing / Throttling**: 검색, 스크롤 이벤트 최적화

---

**문서 버전**: v1.0
**작성일**: 2026-03-31
**다음 단계**: API 설계서 작성
