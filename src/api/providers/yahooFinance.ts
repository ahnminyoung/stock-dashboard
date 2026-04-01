export interface YfQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

interface YfResponse {
  quoteMap?: Record<string, YfQuote | null>;
}

export interface YfSectorItem {
  name: string;
  changeRate: number;
  leaders: string[];
}

interface YfSectorsResponse {
  sectors?: YfSectorItem[];
}

// 프론트→프록시 전달 심볼 (프록시에서 Yahoo Finance 심볼로 변환)
export const YF_SYMBOLS = {
  SP500:   '^SPX',
  NASDAQ:  '^NDX',
  DJI:     '^DJI',
  USDKRW:  'USDKRW',
  AAPL:    'AAPL.US',
  MSFT:    'MSFT.US',
  NVDA:    'NVDA.US',
  GOOGL:   'GOOGL.US',
  AMZN:    'AMZN.US',
  TSLA:    'TSLA.US',
} as const;

const getProxyBase = () => import.meta.env.VITE_KIS_PROXY_BASE_URL;

export const hasYfProxy = () => Boolean(getProxyBase());

export const fetchYfQuotes = async (
  symbols: string[],
): Promise<Record<string, YfQuote | null>> => {
  const base = getProxyBase();
  if (!base || symbols.length === 0) return {};

  const url = `${base.replace(/\/$/, '')}/yahoo/quote?symbols=${encodeURIComponent(symbols.join(','))}`;
  const res = await fetch(url);
  if (!res.ok) return {};

  const json = (await res.json()) as YfResponse;
  const raw = json?.quoteMap ?? {};
  const map: Record<string, YfQuote | null> = raw as Record<string, YfQuote | null>;

  for (const s of symbols) {
    if (!(s in map)) map[s] = null;
  }

  return map;
};

export const fetchYfSectors = async (): Promise<YfSectorItem[]> => {
  const base = getProxyBase();
  if (!base) return [];

  const res = await fetch(`${base.replace(/\/$/, '')}/yahoo/sectors`);
  if (!res.ok) return [];

  const json = (await res.json()) as YfSectorsResponse;
  return json?.sectors ?? [];
};

export const fetchYfSectorsByPeriod = async (period: '1D' | '5D' | '20D' | '60D'): Promise<YfSectorItem[]> => {
  const base = getProxyBase();
  if (!base) return [];

  const res = await fetch(`${base.replace(/\/$/, '')}/yahoo/sectors?period=${period}`);
  if (!res.ok) return [];

  const json = (await res.json()) as YfSectorsResponse;
  return json?.sectors ?? [];
};
