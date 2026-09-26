import {
  mockAssets,
  mockCash,
  mockHoldings,
  mockTrendingIds,
} from "./mocks/market";
import type { Asset, AssetType, MarketOverview, PortfolioSummary } from "../types/market";

/**
 * Temporary market data access.
 * Replace these functions with API calls later. Keep mocks in ./mocks/market.ts.
 */

const MOCK_DELAY_MS = 350;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getAssetMap() {
  return new Map(mockAssets.map((asset) => [asset.id, asset]));
}

function buildPortfolio(): PortfolioSummary {
  const assets = getAssetMap();
  const holdings = mockHoldings.flatMap((holding) => {
    const asset = assets.get(holding.assetId);
    if (!asset) {
      return [];
    }

    return [
      {
        ...holding,
        asset,
        marketValue: holding.quantity * (asset.price ?? 0),
      },
    ];
  });

  const holdingsValue = holdings.reduce((sum, holding) => sum + holding.marketValue, 0);
  const totalValue = holdingsValue + mockCash;
  const todayChangeValue = holdings.reduce(
    (sum, holding) => sum + holding.quantity * (holding.asset.changeValue ?? 0),
    0,
  );
  const previousValue = totalValue - todayChangeValue;

  return {
    totalValue,
    todayChangeValue,
    todayChangePercent: previousValue === 0 ? 0 : (todayChangeValue / previousValue) * 100,
    cash: mockCash,
    holdings,
  };
}

export async function getMarketOverview(): Promise<MarketOverview> {
  await wait(MOCK_DELAY_MS);

  const sorted = [...mockAssets].sort(
    (a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0),
  );

  return {
    trending: mockTrendingIds
      .map((id) => mockAssets.find((asset) => asset.id === id))
      .filter((asset): asset is Asset => Boolean(asset)),
    gainers: sorted.filter((asset) => (asset.changePercent ?? 0) > 0).slice(0, 4),
    losers: [...sorted].reverse().filter((asset) => (asset.changePercent ?? 0) < 0).slice(0, 4),
    portfolio: buildPortfolio(),
  };
}

export async function getAssets(options?: {
  query?: string;
  type?: AssetType | "all";
}): Promise<Asset[]> {
  await wait(MOCK_DELAY_MS);

  const query = options?.query?.trim().toLowerCase() ?? "";
  const type = options?.type ?? "all";

  return mockAssets.filter((asset) => {
    const matchesType = type === "all" || asset.type === type;
    const matchesQuery =
      query.length === 0 ||
      asset.symbol.toLowerCase().includes(query) ||
      asset.name.toLowerCase().includes(query);
    return matchesType && matchesQuery;
  });
}

export async function getAssetsByIds(ids: string[]): Promise<Asset[]> {
  await wait(MOCK_DELAY_MS);
  const assets = getAssetMap();
  return ids.flatMap((id) => {
    const asset = assets.get(id);
    return asset ? [asset] : [];
  });
}

export function findCatalogAsset(id: string): Asset | undefined {
  return getAssetMap().get(id);
}

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  await wait(MOCK_DELAY_MS);
  return buildPortfolio();
}
