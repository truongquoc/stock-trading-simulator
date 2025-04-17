export interface PortfolioItem {
  id: string;
  userId: string;
  symbol: string;
  companyName: string;
  quantity: number;
  averagePurchasePrice: number;
  currentPrice: number;
  totalValue: number;
  totalGainLoss: number;
  percentGainLoss: number;
  lastUpdated: Date;
}

export interface Portfolio {
  userId: string;
  items: PortfolioItem[];
  totalValue: number;
  totalGainLoss: number;
  percentGainLoss: number;
  cashBalance: number;
  lastUpdated: Date;
}

export interface Trade {
  id: string;
  userId: string;
  symbol: string;
  companyName: string;
  quantity: number;
  price: number;
  type: TradeType;
  total: number;
  timestamp: Date;
}

export enum TradeType {
  BUY = 'BUY',
  SELL = 'SELL'
}
