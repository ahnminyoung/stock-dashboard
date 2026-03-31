interface AlphaVantageGlobalQuoteResponse {
  'Global Quote'?: {
    '05. price'?: string;
    '09. change'?: string;
    '10. change percent'?: string;
  };
}

interface AlphaVantageFxResponse {
  'Realtime Currency Exchange Rate'?: {
    '5. Exchange Rate'?: string;
    '8. Bid Price'?: string;
    '9. Ask Price'?: string;
  };
}

export interface AlphaQuote {
  price: number;
  change: number;
  changePercent: number;
}

const ALPHA_BASE_URL = 'https://www.alphavantage.co/query';

const getKey = () => import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;

export const hasAlphaVantageKey = () => Boolean(getKey());

export const fetchAlphaGlobalQuote = async (symbol: string): Promise<AlphaQuote | null> => {
  const key = getKey();
  if (!key) return null;

  const url = `${ALPHA_BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(symbol)}&apikey=${encodeURIComponent(key)}`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const json = (await response.json()) as AlphaVantageGlobalQuoteResponse;
  const data = json['Global Quote'];
  if (!data?.['05. price']) return null;

  const price = Number(data['05. price']);
  const change = Number(data['09. change'] ?? 0);
  const changePercent = Number((data['10. change percent'] ?? '0').replace('%', ''));

  if (Number.isNaN(price) || Number.isNaN(change) || Number.isNaN(changePercent)) return null;
  return { price, change, changePercent };
};

export const fetchAlphaUsdKrw = async (): Promise<number | null> => {
  const key = getKey();
  if (!key) return null;

  const url = `${ALPHA_BASE_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=KRW&apikey=${encodeURIComponent(key)}`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const json = (await response.json()) as AlphaVantageFxResponse;
  const data = json['Realtime Currency Exchange Rate'];
  const raw = data?.['5. Exchange Rate'] ?? data?.['8. Bid Price'] ?? data?.['9. Ask Price'];
  if (!raw) return null;

  const rate = Number(raw);
  return Number.isNaN(rate) ? null : rate;
};
