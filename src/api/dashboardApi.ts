import { mockDashboardData } from '../data/mockDashboard';
import { DashboardData, MarketIndexCard, StockRowItem } from '../types/market';
import { formatPrice, formatSignedNumber, formatSignedPercent, toDirection } from './formatters';
import { fetchAlphaGlobalQuote, fetchAlphaUsdKrw, hasAlphaVantageKey } from './providers/alphaVantage';
import { fetchFinnhubQuotes, hasFinnhubKey } from './providers/finnhub';
import { fetchKisIndex, hasKisProxy } from './providers/kisProxy';

const cloneMock = (): DashboardData => {
  if (typeof structuredClone === 'function') return structuredClone(mockDashboardData);
  return JSON.parse(JSON.stringify(mockDashboardData)) as DashboardData;
};

const applyQuoteToCard = (card: MarketIndexCard, payload: { price: number; change: number; changePercent: number }, options?: { usd?: boolean }) => {
  card.value = options?.usd ? formatPrice(payload.price, { currency: '$', digits: 2 }) : formatPrice(payload.price, { digits: 2 });
  card.change = formatSignedNumber(payload.change, 2);
  card.changeRate = formatSignedPercent(payload.changePercent, 2);
  card.direction = toDirection(payload.changePercent);
};

const applyQuoteToStock = (stock: StockRowItem, payload: { price: number; change: number; changePercent: number }, options?: { usd?: boolean }) => {
  stock.price = options?.usd ? formatPrice(payload.price, { currency: '$', digits: 2 }) : formatPrice(payload.price, { digits: 2 });
  stock.change = options?.usd ? `$${formatSignedNumber(payload.change, 2)}` : formatSignedNumber(payload.change, 2);
  stock.changeRate = formatSignedPercent(payload.changePercent, 2);
  stock.direction = toDirection(payload.changePercent);
};

export const fetchHomeDashboard = async (): Promise<{ data: DashboardData; sources: string[] }> => {
  const next = cloneMock();
  const sources: string[] = [];

  const hasFinnhub = hasFinnhubKey();
  const hasAlpha = hasAlphaVantageKey();
  const hasKis = hasKisProxy();

  if (hasFinnhub) {
    const symbols = [
      'QQQ',
      'SPY',
      'DIA',
      'AAPL',
      'MSFT',
      'NVDA',
      'GOOGL',
      'AMZN',
      'TSLA',
      'OANDA:USD_KRW',
    ];
    const quotes = await fetchFinnhubQuotes(symbols);

    const qqq = quotes['QQQ'];
    const spy = quotes['SPY'];
    const dia = quotes['DIA'];
    const usdKrw = quotes['OANDA:USD_KRW'];

    if (qqq) {
      const globalNasdaq = next.globalMarketBar.cards.find((x) => x.id === 'nasdaq');
      const overseasNasdaq = next.overseas.indexCards.find((x) => x.id === 'o-nasdaq');
      if (globalNasdaq) applyQuoteToCard(globalNasdaq, qqq, { usd: true });
      if (overseasNasdaq) applyQuoteToCard(overseasNasdaq, qqq, { usd: true });
    }

    if (spy) {
      const globalSp = next.globalMarketBar.cards.find((x) => x.id === 'sp500');
      const overseasSp = next.overseas.indexCards.find((x) => x.id === 'o-sp500');
      if (globalSp) applyQuoteToCard(globalSp, spy, { usd: true });
      if (overseasSp) applyQuoteToCard(overseasSp, spy, { usd: true });
    }

    if (dia) {
      const overseasDji = next.overseas.indexCards.find((x) => x.id === 'o-dji');
      if (overseasDji) applyQuoteToCard(overseasDji, dia, { usd: true });
    }

    if (usdKrw) {
      const globalFx = next.globalMarketBar.cards.find((x) => x.id === 'usdkrw');
      const domesticFx = next.domestic.indexCards.find((x) => x.id === 'd-fx');
      if (globalFx) applyQuoteToCard(globalFx, usdKrw);
      if (domesticFx) applyQuoteToCard(domesticFx, usdKrw);
    }

    const usStocks = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'TSLA'] as const;
    for (const stock of next.overseas.movers) {
      if (!stock.ticker || !usStocks.includes(stock.ticker as (typeof usStocks)[number])) continue;
      const quote = quotes[stock.ticker];
      if (quote) applyQuoteToStock(stock, quote, { usd: true });
    }

    for (const stock of next.overseas.watchlist) {
      if (!stock.ticker || !usStocks.includes(stock.ticker as (typeof usStocks)[number])) continue;
      const quote = quotes[stock.ticker];
      if (quote) applyQuoteToStock(stock, quote, { usd: true });
    }

    const hasAny = Object.values(quotes).some(Boolean);
    if (hasAny) sources.push('Finnhub');
  }

  if (hasAlpha) {
    const fallbackNasdaq = await fetchAlphaGlobalQuote('QQQ');
    const fallbackSp = await fetchAlphaGlobalQuote('SPY');
    const fallbackFx = await fetchAlphaUsdKrw();

    if (fallbackNasdaq) {
      const globalNasdaq = next.globalMarketBar.cards.find((x) => x.id === 'nasdaq');
      const overseasNasdaq = next.overseas.indexCards.find((x) => x.id === 'o-nasdaq');
      if (globalNasdaq?.value.includes('18,250')) applyQuoteToCard(globalNasdaq, fallbackNasdaq, { usd: true });
      if (overseasNasdaq?.value.includes('18,250')) applyQuoteToCard(overseasNasdaq, fallbackNasdaq, { usd: true });
    }

    if (fallbackSp) {
      const globalSp = next.globalMarketBar.cards.find((x) => x.id === 'sp500');
      const overseasSp = next.overseas.indexCards.find((x) => x.id === 'o-sp500');
      if (globalSp?.value.includes('5,850')) applyQuoteToCard(globalSp, fallbackSp, { usd: true });
      if (overseasSp?.value.includes('5,850')) applyQuoteToCard(overseasSp, fallbackSp, { usd: true });
    }

    if (fallbackFx) {
      const globalFx = next.globalMarketBar.cards.find((x) => x.id === 'usdkrw');
      const domesticFx = next.domestic.indexCards.find((x) => x.id === 'd-fx');
      if (globalFx?.value.includes('1,325')) {
        globalFx.value = formatPrice(fallbackFx, { digits: 2 });
      }
      if (domesticFx?.value.includes('1,325')) {
        domesticFx.value = formatPrice(fallbackFx, { digits: 2 });
      }
    }

    if (fallbackNasdaq || fallbackSp || fallbackFx) sources.push('Alpha Vantage');
  }

  if (hasKis) {
    const [kospi, kosdaq] = await Promise.all([fetchKisIndex('KOSPI'), fetchKisIndex('KOSDAQ')]);

    if (kospi) {
      const globalKospi = next.globalMarketBar.cards.find((x) => x.id === 'kospi');
      const domesticKospi = next.domestic.indexCards.find((x) => x.id === 'd-kospi');
      if (globalKospi) applyQuoteToCard(globalKospi, kospi);
      if (domesticKospi) applyQuoteToCard(domesticKospi, kospi);
    }

    if (kosdaq) {
      const globalKosdaq = next.globalMarketBar.cards.find((x) => x.id === 'kosdaq');
      const domesticKosdaq = next.domestic.indexCards.find((x) => x.id === 'd-kosdaq');
      if (globalKosdaq) applyQuoteToCard(globalKosdaq, kosdaq);
      if (domesticKosdaq) applyQuoteToCard(domesticKosdaq, kosdaq);
    }

    if (kospi || kosdaq) sources.push('KIS Open API (proxy)');
  }

  const now = new Date();
  next.globalMarketBar.updatedAt = `${now.toLocaleDateString('ko-KR')} ${now.toLocaleTimeString('ko-KR', { hour12: false })}`;
  next.globalMarketBar.status = sources.length > 0 ? '실시간/근실시간 반영' : 'Mock (API 키 필요)';

  return { data: next, sources };
};
