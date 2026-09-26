import { env } from "../config/env";
import { getOrCreateDemoAccount } from "../providers/demoPortfolio.provider";
import { fetchTrueMarketsAccount } from "../providers/trueMarketsPortfolio.provider";
import type {
  PortfolioAccount,
  PortfolioBalanceResponse,
  PortfolioHoldingView,
  PortfolioResponse,
} from "../types/portfolio";
import { getMarketBySymbol } from "./market.service";
import { mapWithConcurrency } from "./trueMarkets.service";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function sumKnown(values: Array<number | null>): number | null {
  const known = values.filter((value): value is number => value != null);
  if (known.length === 0) {
    return null;
  }
  return roundMoney(known.reduce((sum, value) => sum + value, 0));
}

async function loadAccount(userId: string): Promise<PortfolioAccount> {
  if (env.PORTFOLIO_SOURCE === "true_markets") {
    const live = await fetchTrueMarketsAccount(userId);
    if (live) {
      return live;
    }
  }

  return getOrCreateDemoAccount(userId);
}

async function buildHoldings(account: PortfolioAccount): Promise<PortfolioHoldingView[]> {
  const markets = await mapWithConcurrency(account.holdings, 8, async (holding) => {
    try {
      return await getMarketBySymbol(holding.symbol);
    } catch {
      return null;
    }
  });

  return account.holdings.map((holding, index) => {
    const market = markets[index];
    const price = market?.price ?? null;
    const marketValue =
      price != null && Number.isFinite(price) ? roundMoney(holding.quantity * price) : null;
    const costBasis = roundMoney(holding.quantity * holding.averageEntryPrice);
    const unrealizedPnl = marketValue != null ? roundMoney(marketValue - costBasis) : null;

    return {
      symbol: holding.symbol,
      quantity: holding.quantity,
      averageEntryPrice: holding.averageEntryPrice,
      createdAt: holding.createdAt.toISOString(),
      updatedAt: holding.updatedAt.toISOString(),
      name: market?.name ?? null,
      price,
      changePercent: market?.changePercent ?? null,
      changeValue: market?.changeValue ?? null,
      marketValue,
      costBasis,
      unrealizedPnl,
      allocationPercent: null,
    };
  });
}

function withAllocations(
  holdings: PortfolioHoldingView[],
  totalValue: number | null,
): PortfolioHoldingView[] {
  if (totalValue == null || totalValue <= 0) {
    return holdings;
  }

  return holdings.map((holding) => ({
    ...holding,
    allocationPercent:
      holding.marketValue == null
        ? null
        : roundMoney((holding.marketValue / totalValue) * 100),
  }));
}

export async function getPortfolio(userId: string): Promise<PortfolioResponse> {
  const account = await loadAccount(userId);
  const holdings = await buildHoldings(account);
  const holdingsValue = sumKnown(holdings.map((holding) => holding.marketValue));
  const totalValue =
    holdingsValue == null && account.cash === 0
      ? null
      : roundMoney((holdingsValue ?? 0) + account.cash);
  const costBasis = roundMoney(
    holdings.reduce((sum, holding) => sum + holding.costBasis, 0),
  );
  const unrealizedPnl = sumKnown(holdings.map((holding) => holding.unrealizedPnl));
  const todayChanges = holdings.map((holding) =>
    holding.changeValue == null ? null : roundMoney(holding.quantity * holding.changeValue),
  );
  const todayChangeValue = sumKnown(todayChanges);
  const previousValue =
    totalValue != null && todayChangeValue != null
      ? totalValue - todayChangeValue
      : null;
  const todayChangePercent =
    previousValue != null && previousValue !== 0 && todayChangeValue != null
      ? roundMoney((todayChangeValue / previousValue) * 100)
      : null;

  return {
    source: account.source,
    label: account.label,
    notice: account.notice,
    cash: account.cash,
    holdingsValue,
    totalValue,
    todayChangeValue,
    todayChangePercent,
    costBasis,
    unrealizedPnl,
    unrealizedPnlPercent:
      unrealizedPnl != null && costBasis > 0
        ? roundMoney((unrealizedPnl / costBasis) * 100)
        : null,
    holdings: withAllocations(holdings, totalValue),
  };
}

export async function getPortfolioBalance(userId: string): Promise<PortfolioBalanceResponse> {
  const portfolio = await getPortfolio(userId);

  return {
    source: portfolio.source,
    label: portfolio.source === "demo" ? "Demo cash" : "Account balance",
    notice: portfolio.notice,
    currency: "USD",
    cash: portfolio.cash,
    available: portfolio.cash,
    holdingsValue: portfolio.holdingsValue,
    totalValue: portfolio.totalValue,
  };
}
