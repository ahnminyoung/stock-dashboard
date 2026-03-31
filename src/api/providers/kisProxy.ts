export interface KisIndexResponse {
  price: number;
  change: number;
  changePercent: number;
}

const getBaseUrl = () => import.meta.env.VITE_KIS_PROXY_BASE_URL;

export const hasKisProxy = () => Boolean(getBaseUrl());

export const fetchKisIndex = async (market: 'KOSPI' | 'KOSDAQ'): Promise<KisIndexResponse | null> => {
  const base = getBaseUrl();
  if (!base) return null;

  const url = `${base.replace(/\/$/, '')}/kis/index?market=${market}`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const json = (await response.json()) as {
    value?: number;
    price?: number;
    change?: number;
    changePercent?: number;
  };
  const price = typeof json.price === 'number' ? json.price : json.value;
  if (typeof price !== 'number' || typeof json.change !== 'number' || typeof json.changePercent !== 'number') {
    return null;
  }

  return {
    price,
    change: json.change,
    changePercent: json.changePercent,
  };
};
