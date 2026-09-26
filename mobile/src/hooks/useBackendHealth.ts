import { useQuery } from "@tanstack/react-query";
import { checkBackendHealth } from "../api/health";

export function useBackendHealth() {
  return useQuery({
    queryKey: ["backend", "health"],
    queryFn: () => checkBackendHealth(),
    refetchInterval: 20_000,
    retry: false,
    staleTime: 10_000,
  });
}
