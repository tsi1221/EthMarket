export type TrueMarketsVenue = "cefi" | "defi";

export type TrueMarketsAsset = {
  id: string;
  symbol: string;
  name: string;
  chain?: string | null;
  address?: string | null;
  venue?: string | null;
  asset_class?: string | null;
  type?: string | null;
  icon?: string | null;
  image?: {
    thumb?: string;
    small?: string;
    large?: string;
  } | null;
  tradeable?: boolean;
  is_active?: boolean;
  description?: string | null;
  website?: string | null;
  market_data?: Record<string, unknown> | null;
};

export type TrueMarketsAssetsResponse = {
  data: TrueMarketsAsset[];
  pagination?: {
    next_cursor?: string | null;
    limit?: number;
  };
};

export type TrueMarketsCandle = {
  interval: string;
  openPrice: string;
  closePrice: string;
  highPrice?: string;
  lowPrice?: string;
};

export type TrueMarketsPriceResponse = {
  symbol: string;
  candles: TrueMarketsCandle[];
};

export type MarketQuote = {
  price: number;
  changePercent: number | null;
  changeValue: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
};

export type TrueMarketsHistoryPoint = {
  t: string;
  price: string | number;
};

export type TrueMarketsHistoryResponse = {
  symbol: string;
  window?: string;
  resolution?: string;
  points: TrueMarketsHistoryPoint[];
};
