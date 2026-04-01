export interface NaverQuote {
  symbol: string;
  name?: string;
  price: number;
  change: number;
  changePercent: number;
}

interface NaverStockResponse {
  quoteMap?: Record<string, NaverQuote | null>;
}

interface NaverIndexResponse {
  symbol?: string;
  price?: number;
  change?: number;
  changePercent?: number;
  error?: string;
}

export interface NaverSectorItem {
  name: string;
  changeRate: number;
  leaders: string[];
}

interface NaverSectorsResponse {
  sectors?: NaverSectorItem[];
}

interface NaverRankingResponse {
  stocks?: NaverQuote[];
}

// 국내 관심 종목 티커
export const NAVER_KR_TICKERS = {
  SAMSUNG:  '005930',
  SKHYNIX:  '000660',
  NAVER:    '035420',
  KAKAO:    '035720',
  HYUNDAI:  '005380',
} as const;

const getProxyBase = () => import.meta.env.VITE_KIS_PROXY_BASE_URL;

export const hasNaverProxy = () => Boolean(getProxyBase());

export const fetchNaverIndex = async (market: 'KOSPI' | 'KOSDAQ'): Promise<NaverQuote | null> => {
  const base = getProxyBase();
  if (!base) return null;

  const url = `${base.replace(/\/$/, '')}/naver/index?market=${market}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const json = (await res.json()) as NaverIndexResponse;
  if (typeof json?.price !== 'number') return null;

  return {
    symbol: market,
    price: json.price,
    change: json.change ?? 0,
    changePercent: json.changePercent ?? 0,
  };
};

export const fetchNaverStocks = async (
  tickers: string[],
): Promise<Record<string, NaverQuote | null>> => {
  const base = getProxyBase();
  if (!base || tickers.length === 0) return {};

  const url = `${base.replace(/\/$/, '')}/naver/stock?tickers=${encodeURIComponent(tickers.join(','))}`;
  const res = await fetch(url);
  if (!res.ok) return {};

  const json = (await res.json()) as NaverStockResponse;
  const map: Record<string, NaverQuote | null> = (json?.quoteMap ?? {}) as Record<string, NaverQuote | null>;

  for (const t of tickers) {
    if (!(t in map)) map[t] = null;
  }

  return map;
};

export const fetchNaverSectors = async (): Promise<NaverSectorItem[]> => {
  const base = getProxyBase();
  if (!base) return [];

  const res = await fetch(`${base.replace(/\/$/, '')}/naver/sectors`);
  if (!res.ok) return [];

  const json = (await res.json()) as NaverSectorsResponse;
  return json?.sectors ?? [];
};

export const fetchNaverSectorsByPeriod = async (period: '1D' | '5D' | '20D' | '60D'): Promise<NaverSectorItem[]> => {
  const base = getProxyBase();
  if (!base) return [];

  const res = await fetch(`${base.replace(/\/$/, '')}/naver/sectors?period=${period}`);
  if (!res.ok) return [];

  const json = (await res.json()) as NaverSectorsResponse;
  return json?.sectors ?? [];
};

export const fetchNaverRanking = async (
  type: 'change' | 'cap' | 'popular',
  limit = 5,
): Promise<NaverQuote[]> => {
  const base = getProxyBase();
  if (!base) return [];

  const res = await fetch(`${base.replace(/\/$/, '')}/naver/ranking?type=${type}&limit=${limit}`);
  if (!res.ok) return [];

  const json = (await res.json()) as NaverRankingResponse;
  return json?.stocks ?? [];
};
