import { useQuery } from "@tanstack/react-query";
import { fetchTradingCapabilities } from "../api/tradingCapabilities";
import { useBackendStatus } from "../store/backendStatus";

export function useTradingCapabilities() {
  const backendStatus = useBackendStatus((state) => state.status);

  return useQuery({
    queryKey: ["trading", "capabilities", backendStatus],
    queryFn: fetchTradingCapabilities,
    enabled: backendStatus !== "unavailable",
    staleTime: 60_000,
  });
}
