export type TradeSide = "buy" | "sell";
export type TradeQtyUnit = "quote" | "base";
export type TradeOrderType = "market";
export type OrderStatus =
  | "submitted"
  | "pending"
  | "filled"
  | "failed"
  | "cancelled"
  | "unknown";

export type TradeQuoteRequest = {
  base_asset: string;
  quote_asset: string;
  qty: string;
  qty_unit: TradeQtyUnit;
  side: TradeSide;
};

export type TradeOrderRequest = TradeQuoteRequest & {
  type: TradeOrderType;
};

export type SubmittedOrder = {
  id: string;
  trueMarketsOrderId: string;
  symbol: string;
  side: TradeSide;
  quantity: string;
  type: TradeOrderType;
  status: OrderStatus;
  createdAt: string;
  notice: string;
};

export type LocalOrderRecord = {
  id: string;
  trueMarketsOrderId: string;
  symbol: string;
  side: TradeSide;
  quantity: string;
  type: TradeOrderType;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
};

export type OrderStatusView = LocalOrderRecord & {
  remoteStatus: string | null;
  isFilled: boolean;
  notice: string;
};

export type NormalizedTradeQuote = {
  kind: "quote";
  isTrade: false;
  live: true;
  source: "truemarkets";
  notice: string;
  quoteId: string | null;
  side: TradeSide;
  baseAsset: string;
  quoteAsset: string;
  requestedQty: string;
  qtyUnit: TradeQtyUnit;
  price: string | null;
  estimatedBaseQty: string | null;
  estimatedQuoteQty: string | null;
  fee: string | null;
  feeAsset: string | null;
  expiresAt: string | null;
  ttlSeconds: number | null;
  issues: string[];
};

export type TrueMarketsTokenSet = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: number;
};
