import { NewsRowItem } from '../../types/market';

interface NewsListProps {
  items: NewsRowItem[];
}

export const NewsList = ({ items }: NewsListProps) => {
  return (
    <ul className="space-y-3">
      {items.map((news) => (
        <li key={news.id} className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-sm font-medium text-slate-900">{news.title}</p>
          <p className="mt-1 text-xs text-slate-500">
            {news.source} · {news.timeAgo}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {news.tags.map((tag) => (
              <span key={news.id + '-' + tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                #{tag}
              </span>
            ))}
          </div>
        </li>
      ))}
    </ul>
  );
};
