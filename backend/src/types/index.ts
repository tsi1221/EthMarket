import type { Request } from "express";

export type AuthenticatedRequest = Request & {
  userId: string;
};

export type { AuthResponse, AuthTokenPayload, PublicUser } from "./auth";
export type {
  PortfolioBalanceResponse,
  PortfolioResponse,
  PortfolioSource,
} from "./portfolio";
export type {
  LocalOrderRecord,
  NormalizedTradeQuote,
  OrderStatus,
  OrderStatusView,
  SubmittedOrder,
  TradeOrderRequest,
  TradeQtyUnit,
  TradeQuoteRequest,
  TradeSide,
} from "./trading";
