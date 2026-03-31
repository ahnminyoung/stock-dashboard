import { MarketDirection } from '../types/market';

export const getDirectionTextColor = (direction: MarketDirection) => {
  if (direction === 'up') return 'text-rose-500';
  if (direction === 'down') return 'text-blue-500';
  return 'text-slate-500';
};

export const getDirectionBadgeColor = (direction: MarketDirection) => {
  if (direction === 'up') return 'bg-rose-50 text-rose-600 border-rose-100';
  if (direction === 'down') return 'bg-blue-50 text-blue-600 border-blue-100';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

export const getHeatmapTone = (changeRate: number) => {
  if (changeRate >= 4) return 'bg-rose-600 text-white';
  if (changeRate >= 2) return 'bg-rose-500 text-white';
  if (changeRate >= 0.5) return 'bg-rose-200 text-rose-900';
  if (changeRate > -0.5) return 'bg-slate-100 text-slate-700';
  if (changeRate > -2) return 'bg-blue-200 text-blue-900';
  if (changeRate > -4) return 'bg-blue-500 text-white';
  return 'bg-blue-700 text-white';
};
