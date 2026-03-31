import { StockRowItem } from '../../types/market';
import { getDirectionTextColor } from '../../utils/marketStyle';

interface StockListProps {
  items: StockRowItem[];
}

export const StockList = ({ items }: StockListProps) => {
  return (
    <ul className="space-y-3">
      {items.map((stock) => (
        <li key={stock.id} className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {stock.name}
                {stock.ticker && <span className="ml-1 text-xs font-medium text-slate-500">{stock.ticker}</span>}
              </p>
              <p className="mt-1 text-sm text-slate-700">{stock.price}</p>
            </div>
            <div className="text-right">
              <p className={'text-sm font-semibold ' + getDirectionTextColor(stock.direction)}>{stock.change}</p>
              <p className={'text-xs font-medium ' + getDirectionTextColor(stock.direction)}>{stock.changeRate}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};
