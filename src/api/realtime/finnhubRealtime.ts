import { DashboardData, MarketIndexCard, StockRowItem } from '../../types/market';
import { formatPrice, formatSignedNumber, formatSignedPercent, toDirection } from '../formatters';

export const FINNHUB_REALTIME_SYMBOLS = ['QQQ', 'SPY', 'DIA', 'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'TSLA', 'OANDA:USD_KRW'] as const;

type RealtimeSymbol = (typeof FINNHUB_REALTIME_SYMBOLS)[number];

const parseNumber = (value: string) => {
  const normalized = value.replace(/[^0-9+-.]/g, '');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
};

const findIndexCardTargets = (data: DashboardData, symbol: RealtimeSymbol): Array<{ card: MarketIndexCard; usd?: boolean }> => {
  if (symbol === 'QQQ') {
    return [
      { card: data.globalMarketBar.cards.find((x) => x.id === 'nasdaq')!, usd: true },
      { card: data.overseas.indexCards.find((x) => x.id === 'o-nasdaq')!, usd: true },
    ].filter((x) => Boolean(x.card));
  }
  if (symbol === 'SPY') {
    return [
      { card: data.globalMarketBar.cards.find((x) => x.id === 'sp500')!, usd: true },
      { card: data.overseas.indexCards.find((x) => x.id === 'o-sp500')!, usd: true },
      { card: data.overseas.indexCards.find((x) => x.id === 'o-fut')!, usd: true },
      { card: data.globalMarketBar.cards.find((x) => x.id === 'futures')! },
      { card: data.domestic.indexCards.find((x) => x.id === 'd-fut')! },
    ].filter((x) => Boolean(x.card));
  }
  if (symbol === 'DIA') {
    return [{ card: data.overseas.indexCards.find((x) => x.id === 'o-dji')!, usd: true }].filter((x) => Boolean(x.card));
  }
  if (symbol === 'OANDA:USD_KRW') {
    return [
      { card: data.globalMarketBar.cards.find((x) => x.id === 'usdkrw')! },
      { card: data.domestic.indexCards.find((x) => x.id === 'd-fx')! },
    ].filter((x) => Boolean(x.card));
  }
  return [];
};

const updateCard = (card: MarketIndexCard, price: number, previousClose: number, usd?: boolean) => {
  const change = price - previousClose;
  const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;
  card.value = usd ? formatPrice(price, { currency: '$', digits: 2 }) : formatPrice(price, { digits: 2 });
  card.change = formatSignedNumber(change, 2);
  card.changeRate = formatSignedPercent(changePercent, 2);
  card.direction = toDirection(changePercent);
};

const updateStock = (stock: StockRowItem, price: number, previousClose: number) => {
  const change = price - previousClose;
  const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;
  stock.price = formatPrice(price, { currency: '$', digits: 2 });
  stock.change = `$${formatSignedNumber(change, 2)}`;
  stock.changeRate = formatSignedPercent(changePercent, 2);
  stock.direction = toDirection(changePercent);
};

export const inferPreviousClose = (data: DashboardData, symbol: string): number | null => {
  const typed = symbol as RealtimeSymbol;
  const cards = findIndexCardTargets(data, typed);
  if (cards.length > 0) {
    const price = parseNumber(cards[0].card.value);
    const change = parseNumber(cards[0].card.change);
    if (price !== null && change !== null) return price - change;
  }

  const stockTarget = [...data.overseas.movers, ...data.overseas.watchlist].find((x) => x.ticker === symbol);
  if (!stockTarget) return null;
  const price = parseNumber(stockTarget.price);
  const change = parseNumber(stockTarget.change);
  if (price === null || change === null) return null;
  return price - change;
};

export const applyRealtimeTrade = (data: DashboardData, symbol: string, price: number, previousClose: number) => {
  const typed = symbol as RealtimeSymbol;
  const cards = findIndexCardTargets(data, typed);
  for (const target of cards) {
    updateCard(target.card, price, previousClose, target.usd);
  }

  for (const stock of data.overseas.movers) {
    if (stock.ticker === symbol) updateStock(stock, price, previousClose);
  }
  for (const stock of data.overseas.watchlist) {
    if (stock.ticker === symbol) updateStock(stock, price, previousClose);
  }
};
