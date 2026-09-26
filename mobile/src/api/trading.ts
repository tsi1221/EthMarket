import { isLiveTrueMarketsQuote, QUOTE_RETRY_LABEL } from "../utils/quotePresentation";
import { apiClient } from "./client";
import type {
  LocalOrder,
  NormalizedTradeQuote,
  OrderStatusRefresh,
  SubmittedOrder,
  TradeOrderRequest,
  TradeQuoteRequest,
} from "../types/trading";

export async function requestTradeQuote(
  payload: TradeQuoteRequest,
): Promise<NormalizedTradeQuote> {
  const { data } = await apiClient.post<{ quote: NormalizedTradeQuote }>(
    "/trading/quote",
    payload,
  );

  if (!isLiveTrueMarketsQuote(data.quote)) {
    throw new Error(QUOTE_RETRY_LABEL);
  }

  return data.quote;
}

export async function submitTradeOrder(
  payload: TradeOrderRequest,
): Promise<SubmittedOrder> {
  const { data } = await apiClient.post<{
    order_id?: string;
    order?: SubmittedOrder;
  }>("/trading/orders", payload, { timeout: 30_000 });

  const orderId = data.order_id?.trim() || data.order?.trueMarketsOrderId?.trim();
  if (!orderId || !data.order) {
    throw new Error("True Markets did not return an order ID. No trade was confirmed.");
  }

  return {
    ...data.order,
    trueMarketsOrderId: orderId,
  };
}

export async function fetchOrders(): Promise<LocalOrder[]> {
  const { data } = await apiClient.get<{ orders: LocalOrder[] }>("/trading/orders");
  return data.orders ?? [];
}

export async function fetchOrderStatus(orderId: string): Promise<OrderStatusRefresh> {
  const { data } = await apiClient.get<{ order?: OrderStatusRefresh }>(
    `/trading/orders/${orderId}/status`,
    { timeout: 30_000 },
  );

  if (!data.order) {
    throw new Error("Could not refresh this order status.");
  }

  return {
    ...data.order,
    isFilled: data.order.status === "filled",
  };
}
