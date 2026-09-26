import { apiClient } from "./client";

export async function fetchWatchlist(): Promise<string[]> {
  const { data } = await apiClient.get<{ symbols: string[] }>("/watchlist");
  return data.symbols ?? [];
}

export async function toggleWatchlistRequest(
  symbol: string,
): Promise<{ symbols: string[]; watched: boolean }> {
  const { data } = await apiClient.post<{ symbols: string[]; watched: boolean }>(
    "/watchlist/toggle",
    { symbol },
  );
  return data;
}
