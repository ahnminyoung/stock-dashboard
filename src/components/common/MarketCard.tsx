import { MarketIndexCard } from '../../types/market';
import { getDirectionBadgeColor, getDirectionTextColor } from '../../utils/marketStyle';

interface MarketCardProps {
  item: MarketIndexCard;
}

export const MarketCard = ({ item }: MarketCardProps) => {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{item.label}</p>
      <p className="mt-2 text-xl font-semibold text-slate-900">{item.value}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className={'text-sm font-semibold ' + getDirectionTextColor(item.direction)}>{item.change}</span>
        <span className={'rounded-full border px-2 py-0.5 text-xs font-medium ' + getDirectionBadgeColor(item.direction)}>
          {item.changeRate}
        </span>
      </div>
      {item.meta && <p className="mt-3 text-xs text-slate-500">{item.meta}</p>}
    </article>
  );
};
