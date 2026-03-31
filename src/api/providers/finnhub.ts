interface FinnhubQuoteResponse {
  c: number;
  d: number;
  dp: number;
  h: number;
  l: number;
  o: number;
  pc: number;
  t: number;
}

export interface SimpleQuote {
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export const hasFinnhubKey = () => Boolean(import.meta.env.VITE_FINNHUB_API_KEY);

export const fetchFinnhubQuote = async (symbol: string): Promise<SimpleQuote | null> => {
  const token = import.meta.env.VITE_FINNHUB_API_KEY;
  if (!token) return null;

  const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${encodeURIComponent(token)}`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const json = (await response.json()) as FinnhubQuoteResponse;
  if (!json?.c || Number.isNaN(json.c)) return null;

  return {
    price: json.c,
    change: json.d ?? 0,
    changePercent: json.dp ?? 0,
    timestamp: json.t ?? 0,
  };
};

export const fetchFinnhubQuotes = async (symbols: string[]) => {
  const entries = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const quote = await fetchFinnhubQuote(symbol);
        return [symbol, quote] as const;
      } catch {
        return [symbol, null] as const;
      }
    })
  );

  return Object.fromEntries(entries);
};
