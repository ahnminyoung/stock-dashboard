import { mockDashboardData } from '../data/mockDashboard';
import { DashboardData, HeatmapItem, MarketIndexCard, StockRowItem } from '../types/market';
import { formatPrice, formatSignedNumber, formatSignedPercent, toDirection } from './formatters';
import { buildFallbackPeriodItems, buildHeatmapData } from '../utils/heatmapData';
import { fetchYfQuotes, fetchYfSectorsByPeriod, hasYfProxy, YF_SYMBOLS, YfQuote } from './providers/yahooFinance';
import {
  fetchNaverIndex,
  fetchNaverRanking,
  fetchNaverSectorsByPeriod,
  fetchNaverStocks,
  hasNaverProxy,
  NAVER_KR_TICKERS,
  NaverQuote,
} from './providers/naverFinance';

const cloneMock = (): DashboardData => {
  if (typeof structuredClone === 'function') return structuredClone(mockDashboardData);
  return JSON.parse(JSON.stringify(mockDashboardData)) as DashboardData;
};

const applyToCard = (
  card: MarketIndexCard,
  p: { price: number; change: number; changePercent: number },
  usd = false,
) => {
  card.value = usd
    ? formatPrice(p.price, { currency: '$', digits: 2 })
    : formatPrice(p.price, { digits: 2 });
  card.change = formatSignedNumber(p.change, 2);
  card.changeRate = formatSignedPercent(p.changePercent, 2);
  card.direction = toDirection(p.changePercent);
};

const applyToStock = (
  stock: StockRowItem,
  p: { price: number; change: number; changePercent: number },
  usd = false,
) => {
  if (usd) {
    stock.price = formatPrice(p.price, { currency: '$', digits: 2 });
    stock.change = `$${formatSignedNumber(p.change, 2)}`;
  } else {
    stock.price = formatPrice(p.price, { digits: 0 });
    stock.change = formatSignedNumber(p.change, 0);
  }
  stock.changeRate = formatSignedPercent(p.changePercent, 2);
  stock.direction = toDirection(p.changePercent);
};

/** NaverQuote → StockRowItem 변환 */
const naverToStockRow = (q: NaverQuote, id: string): StockRowItem => ({
  id,
  name: q.name ?? q.symbol,
  ticker: q.symbol,
  price: formatPrice(q.price, { digits: 0 }),
  change: formatSignedNumber(q.change, 0),
  changeRate: formatSignedPercent(q.changePercent, 2),
  direction: toDirection(q.changePercent),
});

/** YfQuote → StockRowItem 변환 */
const yfToStockRow = (q: YfQuote, name: string, id: string): StockRowItem => ({
  id,
  name,
  ticker: q.symbol.replace('.US', ''),
  price: formatPrice(q.price, { currency: '$', digits: 2 }),
  change: `$${formatSignedNumber(q.change, 2)}`,
  changeRate: formatSignedPercent(q.changePercent, 2),
  direction: toDirection(q.changePercent),
});

const US_NAME_MAP: Record<string, string> = {
  'AAPL.US': 'Apple',
  'MSFT.US': 'Microsoft',
  'NVDA.US': 'NVIDIA',
  'GOOGL.US': 'Alphabet',
  'AMZN.US': 'Amazon',
  'TSLA.US': 'Tesla',
};

const toPeriodCode = (period: string): '1D' | '5D' | '20D' | '60D' => {
  if (period.includes('60')) return '60D';
  if (period.includes('20')) return '20D';
  if (period.includes('5')) return '5D';
  return '1D';
};

const sectorToHeatmapItems = (
  sectors: Array<{ name: string; changeRate: number; leaders: string[] }>,
  prefix: string,
  includeWeight = false,
) =>
  sectors.map((sector, index) => ({
    id: `${prefix}-${index}`,
    name: sector.name,
    changeRate: sector.changeRate,
    leaders: sector.leaders.slice(0, 3),
    rank: index < 3 ? index + 1 : undefined,
    weight: includeWeight ? `상위 ${index + 1}` : undefined,
  }) satisfies HeatmapItem);

export const fetchHomeDashboard = async (): Promise<{ data: DashboardData; sources: string[] }> => {
  const next = cloneMock();
  const sources: string[] = [];

  // ── 해외 데이터: Yahoo Finance ──────────────────────────────────────────────
  if (hasYfProxy()) {
    const overseasPeriods = next.overseas.heatmapPeriods;
    const [q, yfSectors] = await Promise.all([
      fetchYfQuotes(Object.values(YF_SYMBOLS)).catch(() => ({} as Record<string, YfQuote | null>)),
      Promise.all(
        overseasPeriods.map(async (period) => [
          period,
          await fetchYfSectorsByPeriod(toPeriodCode(period)).catch(() => []),
        ]),
      ).catch(() => []),
    ]);

    let hit = false;

    const sp500 = q[YF_SYMBOLS.SP500];
    if (sp500) {
      hit = true;
      const gSp = next.globalMarketBar.cards.find((x) => x.id === 'sp500');
      const oSp = next.overseas.indexCards.find((x) => x.id === 'o-sp500');
      if (gSp) applyToCard(gSp, sp500, true);
      if (oSp) applyToCard(oSp, sp500, true);
    }

    const nasdaq = q[YF_SYMBOLS.NASDAQ];
    if (nasdaq) {
      hit = true;
      const gNq = next.globalMarketBar.cards.find((x) => x.id === 'nasdaq');
      const oNq = next.overseas.indexCards.find((x) => x.id === 'o-nasdaq');
      if (gNq) applyToCard(gNq, nasdaq, true);
      if (oNq) applyToCard(oNq, nasdaq, true);
    }

    const dji = q[YF_SYMBOLS.DJI];
    if (dji) {
      hit = true;
      const oDji = next.overseas.indexCards.find((x) => x.id === 'o-dji');
      if (oDji) applyToCard(oDji, dji, true);
    }

    const usdkrw = q[YF_SYMBOLS.USDKRW];
    if (usdkrw) {
      hit = true;
      const gFx = next.globalMarketBar.cards.find((x) => x.id === 'usdkrw');
      const dFx = next.domestic.indexCards.find((x) => x.id === 'd-fx');
      if (gFx) applyToCard(gFx, usdkrw);
      if (dFx) applyToCard(dFx, usdkrw);
    }

    // 해외 섹터 히트맵
    const overseasPeriodItems = Object.fromEntries(
      (yfSectors as Array<[string, Array<{ name: string; changeRate: number; leaders: string[] }>]>)
        .filter(([, sectors]) => sectors.length > 0)
        .map(([period, sectors]) => [period, sectorToHeatmapItems(sectors, `os-${period}`, true)]),
    ) as Record<string, HeatmapItem[]>;

    if (Object.keys(overseasPeriodItems).length > 0) {
      hit = true;
      const fallbackPeriodItems = buildFallbackPeriodItems(overseasPeriods, next.overseas.heatmapItems);
      const mergedPeriodItems = { ...fallbackPeriodItems, ...overseasPeriodItems };
      next.overseas.heatmapItems = mergedPeriodItems[overseasPeriods[0] ?? ''] ?? next.overseas.heatmapItems;
      next.overseas.heatmapData = buildHeatmapData(next.overseas.heatmapFilters, overseasPeriods, mergedPeriodItems);
    }

    // 해외 모버/관심종목 실시간 가격 업데이트
    const usStocks = [YF_SYMBOLS.AAPL, YF_SYMBOLS.MSFT, YF_SYMBOLS.NVDA, YF_SYMBOLS.GOOGL, YF_SYMBOLS.AMZN, YF_SYMBOLS.TSLA];
    const yfRows: StockRowItem[] = usStocks
      .map((sym) => q[sym] ? yfToStockRow(q[sym]!, US_NAME_MAP[sym] ?? sym, `yf-${sym}`) : null)
      .filter((x): x is StockRowItem => x !== null);

    if (yfRows.length > 0) {
      hit = true;
      // 해외 모버 탭별 분류
      const sorted = [...yfRows].sort((a, b) => {
        const pctA = parseFloat(a.changeRate);
        const pctB = parseFloat(b.changeRate);
        return pctB - pctA;
      });
      next.overseas.moversByTab = {
        '인기':   yfRows.slice(0, 5),
        '빅테크': yfRows.slice(0, 5),
        '거래량': sorted.slice(0, 5),
      };
      next.overseas.movers = yfRows.slice(0, 5);
      next.overseas.watchlist = yfRows.slice(0, 3);
    }

    if (hit) sources.push('Yahoo Finance');
  }

  // ── 국내 데이터: 네이버 금융 ─────────────────────────────────────────────────
  if (hasNaverProxy()) {
    const domesticPeriods = next.domestic.heatmapPeriods;
    const [kospi, kosdaq, krSectors, rankChange, rankCap, rankPopular] = await Promise.all([
      fetchNaverIndex('KOSPI').catch(() => null),
      fetchNaverIndex('KOSDAQ').catch(() => null),
      Promise.all(
        domesticPeriods.map(async (period) => [
          period,
          await fetchNaverSectorsByPeriod(toPeriodCode(period)).catch(() => []),
        ]),
      ).catch(() => []),
      fetchNaverRanking('change', 5).catch(() => []),
      fetchNaverRanking('cap', 5).catch(() => []),
      fetchNaverRanking('popular', 5).catch(() => []),
    ]);

    if (kospi) {
      const gKp = next.globalMarketBar.cards.find((x) => x.id === 'kospi');
      const dKp = next.domestic.indexCards.find((x) => x.id === 'd-kospi');
      if (gKp) applyToCard(gKp, kospi);
      if (dKp) applyToCard(dKp, kospi);
    }

    if (kosdaq) {
      const gKq = next.globalMarketBar.cards.find((x) => x.id === 'kosdaq');
      const dKq = next.domestic.indexCards.find((x) => x.id === 'd-kosdaq');
      if (gKq) applyToCard(gKq, kosdaq);
      if (dKq) applyToCard(dKq, kosdaq);
    }

    // 국내 섹터 히트맵
    const domesticPeriodItems = Object.fromEntries(
      (krSectors as Array<[string, Array<{ name: string; changeRate: number; leaders: string[] }>]>)
        .filter(([, sectors]) => sectors.length > 0)
        .map(([period, sectors]) => [period, sectorToHeatmapItems(sectors, `kr-${period}`)]),
    ) as Record<string, HeatmapItem[]>;

    if (Object.keys(domesticPeriodItems).length > 0) {
      const fallbackPeriodItems = buildFallbackPeriodItems(domesticPeriods, next.domestic.heatmapItems);
      const mergedPeriodItems = { ...fallbackPeriodItems, ...domesticPeriodItems };
      next.domestic.heatmapItems = mergedPeriodItems[domesticPeriods[0] ?? ''] ?? next.domestic.heatmapItems;
      next.domestic.heatmapData = buildHeatmapData(next.domestic.heatmapFilters, domesticPeriods, mergedPeriodItems);
    }

    // 국내 모버 탭별 실시간 데이터
    if (rankChange.length > 0 || rankCap.length > 0 || rankPopular.length > 0) {
      next.domestic.moversByTab = {
        '급등': rankChange.map((q, i) => naverToStockRow(q, `m-change-${i}`)),
        '대금': rankCap.map((q, i) => naverToStockRow(q, `m-cap-${i}`)),
        '조회수': rankPopular.map((q, i) => naverToStockRow(q, `m-pop-${i}`)),
      };
      next.domestic.movers = rankChange.map((q, i) => naverToStockRow(q, `m-${i}`));
    }

    // 국내 관심종목 실시간 업데이트
    const tickers = Object.values(NAVER_KR_TICKERS);
    const stocks: Record<string, NaverQuote | null> = await fetchNaverStocks(tickers).catch(() => ({} as Record<string, NaverQuote | null>));

    const krMap: Record<string, string> = {
      '005930': NAVER_KR_TICKERS.SAMSUNG,
      '000660': NAVER_KR_TICKERS.SKHYNIX,
      '035420': NAVER_KR_TICKERS.NAVER,
      '035720': NAVER_KR_TICKERS.KAKAO,
      '005380': NAVER_KR_TICKERS.HYUNDAI,
    };

    for (const stock of next.domestic.watchlist) {
      if (!stock.ticker) continue;
      const ticker = krMap[stock.ticker];
      if (!ticker) continue;
      const sq = stocks[ticker];
      if (sq) applyToStock(stock, sq);
    }

    if (kospi || kosdaq) sources.push('네이버 금융');
  }

  if (!next.domestic.heatmapData) {
    const fallbackPeriodItems = buildFallbackPeriodItems(next.domestic.heatmapPeriods, next.domestic.heatmapItems);
    next.domestic.heatmapData = buildHeatmapData(next.domestic.heatmapFilters, next.domestic.heatmapPeriods, fallbackPeriodItems);
  }

  if (!next.overseas.heatmapData) {
    const fallbackPeriodItems = buildFallbackPeriodItems(next.overseas.heatmapPeriods, next.overseas.heatmapItems);
    next.overseas.heatmapData = buildHeatmapData(next.overseas.heatmapFilters, next.overseas.heatmapPeriods, fallbackPeriodItems);
  }

  const now = new Date();
  next.globalMarketBar.updatedAt = now.toLocaleString('ko-KR', { hour12: false });
  next.globalMarketBar.status =
    sources.length > 0 ? `실시간 (${sources.join(', ')})` : 'Mock (프록시 서버 미실행)';

  return { data: next, sources };
};
