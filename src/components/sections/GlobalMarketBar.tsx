import { MarketCard } from '../common/MarketCard';
import { DashboardData } from '../../types/market';

interface GlobalMarketBarProps {
  data: DashboardData['globalMarketBar'];
}

export const GlobalMarketBar = ({ data }: GlobalMarketBarProps) => {
  return (
    <section className="rounded-3xl border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">글로벌 마켓 요약</h2>
          <p className="text-xs text-slate-500">업데이트 {data.updatedAt}</p>
        </div>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{data.status}</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        {data.cards.map((item) => (
          <MarketCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
};
