export interface Stock {
  symbol: string;
  companyName: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap: number;
  lastUpdated: Date;
}

export interface StockHistoricalData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockSearchResult {
  symbol: string;
  companyName: string;
  exchange: string;
}

export type TimeRange = '1d' | '5d' | '1m' | '3m' | '6m' | '1y' | '5y';
