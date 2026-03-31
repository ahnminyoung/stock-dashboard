export type MarketDirection = 'up' | 'down' | 'flat';

export interface MarketIndexCard {
  id: string;
  label: string;
  value: string;
  change: string;
  changeRate: string;
  meta?: string;
  direction: MarketDirection;
}

export interface HeatmapItem {
  id: string;
  name: string;
  changeRate: number;
  leaders: string[];
  weight?: string;
  rank?: number;
}

export interface StockRowItem {
  id: string;
  name: string;
  ticker?: string;
  price: string;
  change: string;
  changeRate: string;
  direction: MarketDirection;
}

export interface NewsRowItem {
  id: string;
  title: string;
  source: string;
  timeAgo: string;
  tags: string[];
}

export interface MarketSectionData {
  sectionTitle: string;
  sectionDescription: string;
  indexCards: MarketIndexCard[];
  heatmapTitle: string;
  heatmapFilters: string[];
  heatmapPeriods: string[];
  heatmapItems: HeatmapItem[];
  moversTitle: string;
  moverTabs: string[];
  movers: StockRowItem[];
  watchlistTitle: string;
  watchlist: StockRowItem[];
  newsTitle: string;
  news: NewsRowItem[];
}

export interface DashboardData {
  globalMarketBar: {
    status: string;
    updatedAt: string;
    cards: MarketIndexCard[];
  };
  domestic: MarketSectionData;
  overseas: MarketSectionData;
}
