export type AssetType = "crypto" | "stock" | "etf";
export type MarketCategory = "all" | "cefi" | "defi";
export type ChartPeriod = "1D" | "1W" | "1M" | "1Y";

export const CHART_PERIODS: ChartPeriod[] = ["1D", "1W", "1M", "1Y"];

export type Asset = {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  category?: "cefi" | "defi";
  venue?: "cefi" | "defi";
  chain?: string | null;
  icon?: string | null;
  description?: string | null;
  website?: string | null;
  address?: string | null;
  assetClass?: string | null;
  circulatingSupply?: number | null;
  totalSupply?: number | null;
  maxSupply?: number | null;
  price: number | null;
  changePercent: number | null;
  changeValue?: number | null;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  tradeable?: boolean;
};

export type ChartPoint = {
  time: string;
  price: number;
};

export type MarketChart = {
  symbol: string;
  period: ChartPeriod;
  available: boolean;
  points: ChartPoint[];
  changePercent: number | null;
};

export type PortfolioHolding = {
  assetId: string;
  quantity: number;
  averageCost: number;
};

export type PortfolioSummary = {
  totalValue: number;
  todayChangeValue: number;
  todayChangePercent: number;
  cash: number;
  holdings: Array<PortfolioHolding & { asset: Asset; marketValue: number }>;
};

export type MarketOverview = {
  trending: Asset[];
  gainers: Asset[];
  losers: Asset[];
  portfolio: PortfolioSummary;
};

export type MarketListResponse = {
  assets: Asset[];
  trending: Asset[];
  count: number;
};
