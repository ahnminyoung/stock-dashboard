import { MarketDirection } from '../types/market';

export const toDirection = (percent: number): MarketDirection => {
  if (percent > 0) return 'up';
  if (percent < 0) return 'down';
  return 'flat';
};

export const formatSignedNumber = (value: number, digits = 2) => {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${Math.abs(value).toLocaleString('ko-KR', { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;
};

export const formatSignedPercent = (value: number, digits = 2) => {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}${Math.abs(value).toFixed(digits)}%`;
};

export const formatPrice = (value: number, options?: { currency?: '$' | '원'; digits?: number }) => {
  const digits = options?.digits ?? 2;
  const prefix = options?.currency === '$' ? '$' : '';
  const suffix = options?.currency === '원' ? '원' : '';
  return `${prefix}${value.toLocaleString('ko-KR', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })}${suffix}`;
};
