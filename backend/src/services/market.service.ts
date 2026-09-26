import type {
  ChartPeriod,
  MarketAsset,
  MarketCategory,
  MarketChartResponse,
  MarketListResponse,
} from "../types/market";
import type { MarketQuote, TrueMarketsAsset } from "../types/trueMarkets";
import { AppError } from "../utils/errors";
import {
  fetchTrueMarketsAssets,
  fetchTrueMarketsHistory,
  fetchTrueMarketsQuote,
  mapWithConcurrency,
} from "./trueMarkets.service";

const CHART_WINDOWS: Record<ChartPeriod, { window: string; resolution: string }> = {
  "1D": { window: "1d", resolution: "15m" },
  "1W": { window: "7d", resolution: "1h" },
  "1M": { window: "1M", resolution: "1d" },
  "1Y": { window: "12M", resolution: "1d" },
};

const TRENDING_SYMBOLS = [
  "BTC",
  "ETH",
  "SOL",
  "USDC",
  "LINK",
  "UNI",
  "AAVE",
  "DOGE",
];

function asVenue(value: string | null | undefined): "cefi" | "defi" {
  return value?.toLowerCase() === "cefi" ? "cefi" : "defi";
}

function readPositiveNumber(
  record: Record<string, unknown> | null | undefined,
  key: string,
): number | null {
  const value = record?.[key];
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : null;
  return parsed != null && Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function cleanText(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toMarketAsset(asset: TrueMarketsAsset, quote: MarketQuote | null): MarketAsset {
  return {
    id: asset.id,
    symbol: asset.symbol,
    name: asset.name,
    type: "crypto",
    category: asVenue(asset.venue),
    venue: asVenue(asset.venue),
    chain: cleanText(asset.chain),
    icon: asset.image?.small ?? asset.icon ?? null,
    description: cleanText(asset.description),
    website: cleanText(asset.website),
    address: cleanText(asset.address),
    assetClass: cleanText(asset.asset_class),
    circulatingSupply: readPositiveNumber(asset.market_data, "circulating_supply"),
    totalSupply: readPositiveNumber(asset.market_data, "total_supply"),
    maxSupply: readPositiveNumber(asset.market_data, "max_supply"),
    price: quote?.price ?? null,
    changePercent: quote?.changePercent ?? null,
    changeValue: quote?.changeValue ?? null,
    open: quote?.open ?? null,
    high: quote?.high ?? null,
    low: quote?.low ?? null,
    tradeable: asset.tradeable ?? false,
  };
}

function matchesQuery(asset: TrueMarketsAsset, query: string): boolean {
  if (!query) {
    return true;
  }

  const haystack = `${asset.symbol} ${asset.name}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function uniqueCatalog(catalog: TrueMarketsAsset[]): TrueMarketsAsset[] {
  const uniqueBySymbol = new Map<string, TrueMarketsAsset>();

  for (const asset of catalog) {
    if (!asset.symbol || asset.is_active === false) {
      continue;
    }

    const key = asset.symbol.toUpperCase();
    const existing = uniqueBySymbol.get(key);
    if (!existing || (asset.venue === "cefi" && existing.venue !== "cefi")) {
      uniqueBySymbol.set(key, asset);
    }
  }

  return [...uniqueBySymbol.values()];
}

async function withQuotes(assets: TrueMarketsAsset[]): Promise<MarketAsset[]> {
  const quotes = await mapWithConcurrency(assets, 12, (asset) =>
    fetchTrueMarketsQuote(asset.symbol),
  );

  return assets.map((asset, index) => toMarketAsset(asset, quotes[index]));
}

export async function listMarkets(options: {
  query?: string;
  category?: MarketCategory;
}): Promise<MarketListResponse> {
  const uniqueAssets = uniqueCatalog(await fetchTrueMarketsAssets());
  const query = options.query?.trim() ?? "";

  let selected = uniqueAssets;

  if (options.category && options.category !== "all") {
    selected = selected.filter((asset) => asVenue(asset.venue) === options.category);
  }

  if (query) {
    selected = selected.filter((asset) => matchesQuery(asset, query));
  }

  const trendingSource = TRENDING_SYMBOLS.map((symbol) =>
    uniqueAssets.find((asset) => asset.symbol.toUpperCase() === symbol),
  ).filter((asset): asset is TrueMarketsAsset => Boolean(asset));

  const quoteTargets = new Map<string, TrueMarketsAsset>();
  for (const asset of [...selected, ...trendingSource]) {
    quoteTargets.set(asset.symbol.toUpperCase(), asset);
  }

  const quoted = await withQuotes([...quoteTargets.values()]);
  const quotedBySymbol = new Map(
    quoted.map((asset) => [asset.symbol.toUpperCase(), asset]),
  );

  const assets = selected
    .map((asset) => quotedBySymbol.get(asset.symbol.toUpperCase()))
    .filter((asset): asset is MarketAsset => Boolean(asset))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  const trending = trendingSource
    .map((asset) => quotedBySymbol.get(asset.symbol.toUpperCase()))
    .filter((asset): asset is MarketAsset => Boolean(asset));

  return {
    assets,
    trending: trending.length > 0 ? trending : assets.slice(0, 6),
    count: assets.length,
  };
}

export async function getMarketBySymbol(symbol: string): Promise<MarketAsset> {
  const uniqueAssets = uniqueCatalog(await fetchTrueMarketsAssets());
  const match = uniqueAssets.find(
    (asset) => asset.symbol.toLowerCase() === symbol.trim().toLowerCase(),
  );

  if (!match) {
    throw new AppError("Asset not found", 404);
  }

  const quote = await fetchTrueMarketsQuote(match.symbol);
  return toMarketAsset(match, quote);
}

export async function getMarketChart(
  symbol: string,
  period: ChartPeriod,
): Promise<MarketChartResponse> {
  const uniqueAssets = uniqueCatalog(await fetchTrueMarketsAssets());
  const match = uniqueAssets.find(
    (asset) => asset.symbol.toLowerCase() === symbol.trim().toLowerCase(),
  );

  if (!match) {
    throw new AppError("Asset not found", 404);
  }

  const config = CHART_WINDOWS[period];
  const points = await fetchTrueMarketsHistory(
    match.symbol,
    config.window,
    config.resolution,
  );
  const available = points.length >= 2;
  const first = available ? points[0].price : null;
  const last = available ? points[points.length - 1].price : null;
  const changePercent =
    first != null && last != null && first > 0
      ? ((last - first) / first) * 100
      : null;

  return {
    symbol: match.symbol.toUpperCase(),
    period,
    available,
    points: available ? points : [],
    changePercent,
  };
}
