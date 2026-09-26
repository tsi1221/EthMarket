import { apiClient } from "./client";
import type { PortfolioBalanceResponse, PortfolioResponse } from "../types/portfolio";

export async function fetchPortfolio(): Promise<PortfolioResponse> {
  const { data } = await apiClient.get<PortfolioResponse>("/portfolio");
  return data;
}

export async function fetchPortfolioBalance(): Promise<PortfolioBalanceResponse> {
  const { data } = await apiClient.get<PortfolioBalanceResponse>("/portfolio/balance");
  return data;
}
