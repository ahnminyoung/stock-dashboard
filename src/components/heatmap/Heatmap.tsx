import { useEffect, useMemo, useState } from 'react';
import { HeatmapDataMap, HeatmapItem } from '../../types/market';
import { getHeatmapTone } from '../../utils/marketStyle';
import { buildFallbackPeriodItems, buildHeatmapData } from '../../utils/heatmapData';

interface HeatmapProps {
  title: string;
  filters: string[];
  periods: string[];
  items: HeatmapItem[];
  data?: HeatmapDataMap;
}

export const Heatmap = ({ title, filters, periods, items, data }: HeatmapProps) => {
  const [activeFilter, setActiveFilter] = useState(filters[0] ?? '');
  const [activePeriod, setActivePeriod] = useState(periods[0] ?? '');
  const resolvedData = useMemo(
    () => data ?? buildHeatmapData(filters, periods, buildFallbackPeriodItems(periods, items)),
    [data, filters, periods, items],
  );
  const displayedItems = useMemo(
    () =>
      resolvedData[activeFilter]?.[activePeriod] ??
      resolvedData[filters[0] ?? '']?.[periods[0] ?? ''] ??
      items,
    [resolvedData, activeFilter, activePeriod, filters, periods, items],
  );

  useEffect(() => {
    if (!filters.includes(activeFilter)) {
      setActiveFilter(filters[0] ?? '');
    }
  }, [activeFilter, filters]);

  useEffect(() => {
    if (!periods.includes(activePeriod)) {
      setActivePeriod(periods[0] ?? '');
    }
  }, [activePeriod, periods]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <span className="text-xs text-slate-500">기준: {activePeriod} · {activeFilter}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            aria-pressed={activeFilter === filter}
            className={
              'rounded-full border px-3 py-1 text-xs font-medium transition ' +
              (activeFilter === filter
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300')
            }
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {periods.map((period) => (
          <button
            key={period}
            type="button"
            onClick={() => setActivePeriod(period)}
            aria-pressed={activePeriod === period}
            className={
              'rounded-full border px-3 py-1 text-xs font-medium transition ' +
              (activePeriod === period
                ? 'border-slate-300 bg-slate-200 text-slate-900'
                : 'border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200')
            }
          >
            {period}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
        {displayedItems.map((item) => (
          <article key={item.id} className={'rounded-xl p-3 ' + getHeatmapTone(item.changeRate)}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold">{item.name}</p>
              {typeof item.rank === 'number' && <span className="text-xs font-semibold">#{item.rank}</span>}
            </div>
            <p className="mt-1 text-sm font-semibold">{item.changeRate > 0 ? '+' : ''}{item.changeRate.toFixed(1)}%</p>
            <p className="mt-2 text-[11px] opacity-90">{item.leaders.join(' · ')}</p>
            {item.weight && <p className="mt-1 text-[11px] opacity-80">{item.weight}</p>}
          </article>
        ))}
      </div>
    </section>
  );
};
