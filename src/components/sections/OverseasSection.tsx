import { useState } from 'react';
import { MarketSectionData } from '../../types/market';
import { Heatmap } from '../heatmap/Heatmap';
import { MarketCard } from '../common/MarketCard';
import { StockList } from '../common/StockList';
import { NewsList } from '../common/NewsList';

interface OverseasSectionProps {
  data: MarketSectionData;
}

export const OverseasSection = ({ data }: OverseasSectionProps) => {
  const [activeTab, setActiveTab] = useState(data.moverTabs[0] ?? '');

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{data.sectionTitle}</h2>
          <p className="text-sm text-slate-600">{data.sectionDescription}</p>
        </div>
        <button type="button" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
          전체보기 →
        </button>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.indexCards.map((item) => (
          <MarketCard key={item.id} item={item} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Heatmap
            title={data.heatmapTitle}
            filters={data.heatmapFilters}
            periods={data.heatmapPeriods}
            items={data.heatmapItems}
            data={data.heatmapData}
          />
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">{data.moversTitle}</h3>
            <button type="button" className="text-xs font-medium text-slate-500 hover:text-slate-700">
              더보기
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {data.moverTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={
                  'rounded-full px-3 py-1 text-xs font-medium transition ' +
                  (activeTab === tab ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
                }
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <StockList items={data.moversByTab?.[activeTab] ?? data.movers} />
          </div>
        </aside>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-slate-900">{data.watchlistTitle}</h3>
          <StockList items={data.watchlist} />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-slate-900">{data.newsTitle}</h3>
          <NewsList items={data.news} />
        </section>
      </div>
    </section>
  );
};
