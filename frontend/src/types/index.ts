export type DebatePhase = 'idle' | 'fetching' | 'bull' | 'bear' | 'judge' | 'complete' | 'error';

export interface PricePoint {
  date: string;
  price: number;
  volume: number;
}

export interface MarketIndex {
  name: string;
  value: number;
  changePercent: number;
}

export interface StockData {
  ticker: string;
  companyName: string;
  exchange: string;
  currentPrice: number;
  changePercent: number;
  peRatio: number;
  pbRatio: number;
  eps: number;
  bookValue: number;
  beta: number;
  marketCap: number;
  debtToEquity: number;
  returnOnEquity: number;
  revenueGrowth: number;
  profitMargin: number;
  dividendYield: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  targetPrice: number;
  sector: string;
  industry: string;
  analystRecommendations: Record<string, number>;
  shareholdingPattern: Record<string, number>;
  priceHistory: PricePoint[];
  recentNews: string[];
}

export interface StreamMessage {
  type: string;
  content: string;
  data?: any;
  sessionId: string;
  debateId?: number;
}

export interface DebateSummary {
  id: number;
  ticker: string;
  verdictOutcome: string;
  status: string;
  createdAt: string;
}

export interface DebateRequest {
  ticker: string;
  exchange: string;
  holdingPeriod: string;
  rounds: number;
}

export interface DebateStartResponse {
  sessionId: string;
  debateId: number;
}
