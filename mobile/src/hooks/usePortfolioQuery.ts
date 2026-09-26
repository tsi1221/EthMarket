import { useQuery } from "@tanstack/react-query";
import { liveOrPreview } from "../api/liveOrPreview";
import { fetchPortfolio, fetchPortfolioBalance } from "../api/portfolio";
import { getPreviewPortfolio } from "../data/devPreview";
import { useAuthStore } from "../store/authStore";
import { useBackendStatus } from "../store/backendStatus";

export const portfolioKeys = {
  all: ["portfolio"] as const,
  summary: () => [...portfolioKeys.all, "summary"] as const,
  balance: () => [...portfolioKeys.all, "balance"] as const,
};

function previewBalance() {
  const portfolio = getPreviewPortfolio();
  return {
    source: portfolio.source,
    label: portfolio.label,
    notice: portfolio.notice,
    currency: "USD" as const,
    cash: portfolio.cash,
    available: portfolio.cash,
    holdingsValue: portfolio.holdingsValue,
    totalValue: portfolio.totalValue,
  };
}

export function usePortfolioQuery() {
  const token = useAuthStore((state) => state.token);
  const backendStatus = useBackendStatus((state) => state.status);

  return useQuery({
    queryKey: [...portfolioKeys.summary(), backendStatus, Boolean(token)],
    queryFn: () => liveOrPreview(() => fetchPortfolio(), () => getPreviewPortfolio()),
    enabled: Boolean(token) || backendStatus === "unavailable",
    staleTime: 30_000,
  });
}

export function usePortfolioBalanceQuery() {
  const token = useAuthStore((state) => state.token);
  const backendStatus = useBackendStatus((state) => state.status);

  return useQuery({
    queryKey: [...portfolioKeys.balance(), backendStatus, Boolean(token)],
    queryFn: () => liveOrPreview(() => fetchPortfolioBalance(), () => previewBalance()),
    enabled: Boolean(token) || backendStatus === "unavailable",
    staleTime: 30_000,
  });
}
