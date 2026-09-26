export type MarketCategory = "all" | "cefi" | "defi";
export type ChartPeriod = "1D" | "1W" | "1M" | "1Y";

export type MarketAsset = {
  id: string;
  symbol: string;
  name: string;
  type: "crypto";
  category: "cefi" | "defi";
  venue: "cefi" | "defi";
  chain: string | null;
  icon: string | null;
  description: string | null;
  website: string | null;
  address: string | null;
  assetClass: string | null;
  circulatingSupply: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
  price: number | null;
  changePercent: number | null;
  changeValue: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  tradeable: boolean;
};

export type ChartPoint = {
  time: string;
  price: number;
};

export type MarketChartResponse = {
  symbol: string;
  period: ChartPeriod;
  available: boolean;
  points: ChartPoint[];
  changePercent: number | null;
};

export type MarketListResponse = {
  assets: MarketAsset[];
  trending: MarketAsset[];
  count: number;
};
