import { HeatmapDataMap, HeatmapItem } from '../types/market';

const clampRate = (value: number) => Math.max(Math.min(value, 99.9), -99.9);

const getHashScore = (text: string, salt: number) =>
  [...text].reduce((acc, ch) => acc + ch.charCodeAt(0) * (salt + 1), 0) % 17;

const parseWeightScore = (weight?: string) => {
  if (!weight) return null;
  const match = weight.match(/(\d+(\.\d+)?)/);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
};

const getPeriodFactor = (period: string) => {
  if (period.includes('60')) return 3.2;
  if (period.includes('20')) return 2.1;
  if (period.includes('5')) return 1.35;
  return 1;
};

const withRanks = (items: HeatmapItem[]) =>
  items.map((item, index) => ({
    ...item,
    rank: index < 3 ? index + 1 : undefined,
  }));

const transformForFilter = (filter: string, items: HeatmapItem[]) => {
  const next = items.map((item, index) => ({
    ...item,
    leaders: [...item.leaders],
    weight: item.weight,
    rank: item.rank,
    id: `${item.id}-${filter}-${index}`,
  }));

  if (filter.includes('등락률')) {
    return withRanks([...next].sort((a, b) => b.changeRate - a.changeRate));
  }

  if (filter.includes('유입') || filter.includes('인기') || filter.includes('인기도')) {
    return withRanks(
      [...next].sort((a, b) => {
        const scoreA = a.changeRate * 0.35 + getHashScore(a.name, 1) * 0.65;
        const scoreB = b.changeRate * 0.35 + getHashScore(b.name, 1) * 0.65;
        return scoreB - scoreA;
      }),
    );
  }

  if (filter.includes('종목수')) {
    return withRanks(
      [...next].sort((a, b) => {
        const scoreA = a.leaders.length * 1.8 + getHashScore(a.name, 2) * 0.35 + a.changeRate * 0.1;
        const scoreB = b.leaders.length * 1.8 + getHashScore(b.name, 2) * 0.35 + b.changeRate * 0.1;
        return scoreB - scoreA;
      }),
    );
  }

  if (filter.includes('시총') || filter.includes('시가총액')) {
    return withRanks(
      [...next]
        .sort((a, b) => {
          const aWeight = parseWeightScore(a.weight) ?? 1;
          const bWeight = parseWeightScore(b.weight) ?? 1;
          const scoreA = aWeight * 0.9 + Math.abs(a.changeRate) * 0.4 + getHashScore(a.name, 3) * 0.2;
          const scoreB = bWeight * 0.9 + Math.abs(b.changeRate) * 0.4 + getHashScore(b.name, 3) * 0.2;
          return scoreB - scoreA;
        })
        .map((item, index) => ({
          ...item,
          weight: item.weight ?? `상위 ${index + 1}`,
        })),
    );
  }

  return withRanks(next);
};

export const buildFallbackPeriodItems = (periods: string[], items: HeatmapItem[]) =>
  Object.fromEntries(
    periods.map((period, periodIndex) => [
      period,
      items.map((item, itemIndex) => ({
        ...item,
        id: `${item.id}-${period}-${itemIndex}`,
        changeRate: clampRate(
          Number((item.changeRate * getPeriodFactor(period) + (periodIndex % 2 === 0 ? 0 : -0.35)).toFixed(2)),
        ),
        leaders: [...item.leaders],
      })),
    ]),
  ) as Record<string, HeatmapItem[]>;

export const buildHeatmapData = (
  filters: string[],
  periods: string[],
  periodItems: Record<string, HeatmapItem[]>,
): HeatmapDataMap => {
  const firstPeriod = periods[0] ?? '';
  const fallbackItems = periodItems[firstPeriod] ?? [];

  return Object.fromEntries(
    filters.map((filter) => [
      filter,
      Object.fromEntries(
        periods.map((period) => {
          const source = periodItems[period] ?? fallbackItems;
          return [period, transformForFilter(filter, source)];
        }),
      ),
    ]),
  ) as HeatmapDataMap;
};
