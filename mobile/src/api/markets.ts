import { apiClient } from "./client";
import type {
  Asset,
  ChartPeriod,
  MarketCategory,
  MarketChart,
  MarketListResponse,
} from "../types/market";

export async function fetchMarkets(params?: {
  q?: string;
  category?: MarketCategory;
}): Promise<MarketListResponse> {
  const { data } = await apiClient.get<MarketListResponse>("/markets", {
    timeout: 45_000,
    params: {
      q: params?.q || undefined,
      category: params?.category && params.category !== "all" ? params.category : "all",
    },
  });
  return data;
}

export async function fetchMarketBySymbol(symbol: string): Promise<Asset> {
  const { data } = await apiClient.get<{ asset: Asset }>(
    `/markets/${encodeURIComponent(symbol)}`,
    { timeout: 20_000 },
  );
  return data.asset;
}

export async function fetchMarketChart(
  symbol: string,
  period: ChartPeriod,
): Promise<MarketChart> {
  const { data } = await apiClient.get<MarketChart>(
    `/markets/${encodeURIComponent(symbol)}/chart`,
    { params: { period } },
  );
  return data;
}
