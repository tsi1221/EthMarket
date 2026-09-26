import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import { liveOrPreview } from "../api/liveOrPreview";
import { fetchMarketBySymbol, fetchMarketChart, fetchMarkets } from "../api/markets";
import {
  getPreviewAsset,
  getPreviewChart,
  listPreviewMarkets,
} from "../data/devPreview";
import { useBackendStatus } from "../store/backendStatus";
import type { ChartPeriod, MarketCategory } from "../types/market";

export const marketKeys = {
  all: ["markets"] as const,
  list: (params: { q: string; category: MarketCategory }) =>
    [...marketKeys.all, "list", params] as const,
  detail: (symbol: string) => [...marketKeys.all, "detail", symbol] as const,
  chart: (symbol: string, period: ChartPeriod) =>
    [...marketKeys.all, "chart", symbol, period] as const,
};

function previewAsset(symbol: string) {
  const asset = getPreviewAsset(symbol);
  if (!asset) {
    throw new Error("Asset not found");
  }
  return asset;
}

export function useMarketsQuery(params: { q: string; category: MarketCategory }) {
  const backendStatus = useBackendStatus((state) => state.status);

  return useQuery({
    queryKey: [...marketKeys.list(params), backendStatus],
    queryFn: () =>
      liveOrPreview(
        () => fetchMarkets(params),
        () => listPreviewMarkets(params),
      ),
    staleTime: 30_000,
  });
}

export function useMarketQuery(symbol: string) {
  const backendStatus = useBackendStatus((state) => state.status);

  return useQuery({
    queryKey: [...marketKeys.detail(symbol), backendStatus],
    queryFn: () => liveOrPreview(() => fetchMarketBySymbol(symbol), () => previewAsset(symbol)),
    enabled: symbol.length > 0,
  });
}

export function useMarketChartQuery(symbol: string, period: ChartPeriod) {
  const backendStatus = useBackendStatus((state) => state.status);

  return useQuery({
    queryKey: [...marketKeys.chart(symbol, period), backendStatus],
    queryFn: () =>
      liveOrPreview(
        () => fetchMarketChart(symbol, period),
        () => getPreviewChart(symbol, period),
      ),
    enabled: symbol.length > 0,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useMarketsBySymbols(symbols: string[]) {
  const backendStatus = useBackendStatus((state) => state.status);

  return useQueries({
    queries: symbols.map((symbol) => ({
      queryKey: [...marketKeys.detail(symbol), backendStatus],
      queryFn: () => liveOrPreview(() => fetchMarketBySymbol(symbol), () => previewAsset(symbol)),
      enabled: symbol.length > 0,
      staleTime: 30_000,
    })),
  });
}
