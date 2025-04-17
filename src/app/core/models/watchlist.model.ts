export interface WatchlistItem {
  id: string;
  userId: string;
  symbol: string;
  companyName: string;
  addedAt: Date;
  currentPrice: number;
  priceChange: number;
  percentChange: number;
  lastUpdated: Date;
}

export interface Watchlist {
  id: string;
  userId: string;
  name: string;
  items: WatchlistItem[];
  createdAt: Date;
  updatedAt: Date;
}
