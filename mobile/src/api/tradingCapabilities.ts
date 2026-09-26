import { apiClient } from "./client";

export type TradingCapabilities = {
  quotesEnabled: boolean;
  ordersEnabled: boolean;
  message: string;
};

export async function fetchTradingCapabilities(): Promise<TradingCapabilities> {
  const { data } = await apiClient.get<TradingCapabilities>("/trading/capabilities");
  return data;
}
