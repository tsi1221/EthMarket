/**
 * Development UI preview only.
 * Sample data for opening the app when auth or live APIs are unavailable.
 * This is not True Markets data. Do not import this from backend TM services.
 */
import {
  mockAssets,
  mockCash,
  mockHoldings,
  mockTrendingIds,
} from "./mocks/market";
import type {
  Asset,
  ChartPeriod,
  MarketCategory,
  MarketChart,
  MarketListResponse,
} from "../types/market";
import type { PortfolioResponse } from "../types/portfolio";

export const PREVIEW_NOTICE =
  "Development preview. Sample data for UI only — not live market prices.";

export const PREVIEW_USER = {
  _id: "preview-user",
  name: "Alex Rivera",
  email: "preview@marketplace.local",
  avatar: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function withPreviewMeta(asset: Asset): Asset {
  const category: "cefi" | "defi" =
    asset.symbol === "ETH" || asset.symbol === "BTC" ? "defi" : "cefi";

  return {
    ...asset,
    category: asset.category ?? category,
    venue: asset.venue ?? category,
    tradeable: asset.tradeable ?? true,
    description:
      asset.description ??
      `${asset.name} is included as development preview data so you can explore the EthMarket UI.`,
  };
}

const previewAssets = mockAssets.map(withPreviewMeta);

function matchesCategory(asset: Asset, category: MarketCategory) {
  if (category === "all") {
    return true;
  }
  return (asset.category ?? asset.venue) === category;
}

export function listPreviewMarkets(params?: {
  q?: string;
  category?: MarketCategory;
}): MarketListResponse {
  const query = params?.q?.trim().toLowerCase() ?? "";
  const category = params?.category ?? "all";
  const assets = previewAssets.filter((asset) => {
    const haystack = `${asset.symbol} ${asset.name}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    return matchesQuery && matchesCategory(asset, category);
  });
  const trending = mockTrendingIds
    .map((id) => previewAssets.find((asset) => asset.id === id))
    .filter((asset): asset is Asset => Boolean(asset));

  return {
    assets,
    trending: query ? [] : trending.filter((asset) => matchesCategory(asset, category)),
    count: assets.length,
  };
}

export function getPreviewAsset(symbol: string): Asset | null {
  const key = symbol.trim().toUpperCase();
  return previewAssets.find((asset) => asset.symbol.toUpperCase() === key) ?? null;
}

export function getPreviewChart(symbol: string, period: ChartPeriod): MarketChart {
  const asset = getPreviewAsset(symbol);
  const price = asset?.price;
  if (!asset || price == null) {
    return {
      symbol: symbol.toUpperCase(),
      period,
      available: false,
      points: [],
      changePercent: null,
    };
  }

  const steps = period === "1D" ? 24 : period === "1W" ? 28 : period === "1M" ? 30 : 36;
  const change = (asset.changePercent ?? 0) / 100;
  const start = price / (1 + change);
  const now = Date.now();
  const stepMs =
    period === "1D"
      ? 60 * 60 * 1000
      : period === "1W"
        ? 6 * 60 * 60 * 1000
        : period === "1M"
          ? 24 * 60 * 60 * 1000
          : 10 * 24 * 60 * 60 * 1000;

  const points = Array.from({ length: steps }, (_, index) => {
    const progress = index / (steps - 1);
    const wave = Math.sin(progress * Math.PI * 2) * price * 0.008;
    return {
      time: new Date(now - (steps - 1 - index) * stepMs).toISOString(),
      price: Number((start + (price - start) * progress + wave).toFixed(2)),
    };
  });

  return {
    symbol: asset.symbol,
    period,
    available: true,
    points,
    changePercent: asset.changePercent,
  };
}

export function getPreviewPortfolio(): PortfolioResponse {
  const assets = new Map(previewAssets.map((asset) => [asset.id, asset]));
  const holdings = mockHoldings.flatMap((holding) => {
    const asset = assets.get(holding.assetId);
    if (!asset) {
      return [];
    }

    const price = asset.price;
    const marketValue = price == null ? null : holding.quantity * price;
    const costBasis = holding.quantity * holding.averageCost;
    const unrealizedPnl = marketValue == null ? null : marketValue - costBasis;

    return [
      {
        symbol: asset.symbol,
        quantity: holding.quantity,
        averageEntryPrice: holding.averageCost,
        createdAt: PREVIEW_USER.createdAt,
        updatedAt: PREVIEW_USER.updatedAt,
        name: asset.name,
        price,
        changePercent: asset.changePercent,
        changeValue: asset.changeValue ?? null,
        marketValue,
        costBasis,
        unrealizedPnl,
        allocationPercent: null as number | null,
      },
    ];
  });

  const holdingsValue = holdings.reduce((sum, holding) => sum + (holding.marketValue ?? 0), 0);
  const totalValue = holdingsValue + mockCash;
  const costBasis = holdings.reduce((sum, holding) => sum + holding.costBasis, 0);
  const unrealizedPnl = holdingsValue - costBasis;
  const todayChangeValue = holdings.reduce((sum, holding) => {
    return sum + holding.quantity * (holding.changeValue ?? 0);
  }, 0);

  const withAllocations = holdings.map((holding) => ({
    ...holding,
    allocationPercent:
      totalValue > 0 && holding.marketValue != null
        ? (holding.marketValue / totalValue) * 100
        : null,
  }));

  return {
    source: "preview",
    label: "Preview portfolio",
    notice: PREVIEW_NOTICE,
    cash: mockCash,
    holdingsValue,
    totalValue,
    todayChangeValue,
    todayChangePercent: totalValue === 0 ? 0 : (todayChangeValue / totalValue) * 100,
    costBasis,
    unrealizedPnl,
    unrealizedPnlPercent: costBasis === 0 ? 0 : (unrealizedPnl / costBasis) * 100,
    holdings: withAllocations,
  };
}
