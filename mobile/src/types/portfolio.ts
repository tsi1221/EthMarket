export type PortfolioSource = "demo" | "true_markets" | "preview";

export type PortfolioHoldingView = {
  symbol: string;
  quantity: number;
  averageEntryPrice: number;
  createdAt: string;
  updatedAt: string;
  name: string | null;
  price: number | null;
  changePercent: number | null;
  changeValue: number | null;
  marketValue: number | null;
  costBasis: number;
  unrealizedPnl: number | null;
  allocationPercent: number | null;
};

export type PortfolioResponse = {
  source: PortfolioSource;
  label: string;
  notice: string;
  cash: number;
  holdingsValue: number | null;
  totalValue: number | null;
  todayChangeValue: number | null;
  todayChangePercent: number | null;
  costBasis: number;
  unrealizedPnl: number | null;
  unrealizedPnlPercent: number | null;
  holdings: PortfolioHoldingView[];
};

export type PortfolioBalanceResponse = {
  source: PortfolioSource;
  label: string;
  notice: string;
  currency: "USD";
  cash: number;
  available: number;
  holdingsValue: number | null;
  totalValue: number | null;
};
