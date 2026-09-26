import type { PortfolioAccount } from "../types/portfolio";

/**
 * Placeholder for a future True Markets account/balance integration.
 * Returns null until those APIs are connected so we never invent live balances.
 */
export async function fetchTrueMarketsAccount(
  _userId: string,
): Promise<PortfolioAccount | null> {
  return null;
}
