import axios, { AxiosError } from "axios";
import { env } from "../config/env";
import type { ChartPoint } from "../types/market";
import type {
  MarketQuote,
  TrueMarketsAsset,
  TrueMarketsAssetsResponse,
  TrueMarketsHistoryResponse,
  TrueMarketsPriceResponse,
} from "../types/trueMarkets";
import { AppError } from "../utils/errors";
import {
  trueMarketsAssetsResponseSchema,
  trueMarketsHistoryResponseSchema,
  trueMarketsPriceResponseSchema,
} from "../validators/market.validator";

const client = axios.create({
  baseURL: env.TRUE_MARKETS_API_URL,
  timeout: env.TRUE_MARKETS_TIMEOUT_MS,
  headers: {
    Accept: "application/json",
  },
});

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const catalogCache: { entry: CacheEntry<TrueMarketsAsset[]> | null } = {
  entry: null,
};
const quoteCache = new Map<string, CacheEntry<MarketQuote | null>>();
const historyCache = new Map<string, CacheEntry<ChartPoint[]>>();

const CATALOG_TTL_MS = 60_000;
const QUOTE_TTL_MS = 30_000;
const HISTORY_TTL_MS = 60_000;

function readCache<T>(entry: CacheEntry<T> | undefined | null): T | null {
  if (!entry || entry.expiresAt < Date.now()) {
    return null;
  }
  return entry.value;
}

function toAppError(error: unknown, fallback: string): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (axios.isAxiosError(error)) {
    return fromAxiosError(error, fallback);
  }

  return new AppError(fallback, 502);
}

function fromAxiosError(error: AxiosError, fallback: string): AppError {
  if (error.code === "ECONNABORTED") {
    return new AppError("Market data timed out. Please try again.", 504);
  }

  if (!error.response) {
    return new AppError("Market data is temporarily unavailable.", 503);
  }

  return new AppError(fallback, 502);
}

export async function fetchTrueMarketsAssets(): Promise<TrueMarketsAsset[]> {
  const cached = readCache(catalogCache.entry);
  if (cached) {
    return cached;
  }

  try {
    const { data } = await client.get<TrueMarketsAssetsResponse>(
      "/v1/conductor/assets",
    );
    const parsed = trueMarketsAssetsResponseSchema.safeParse(data);

    if (!parsed.success) {
      throw new AppError("Market catalog response was not valid.", 502);
    }

    catalogCache.entry = {
      value: parsed.data.data,
      expiresAt: Date.now() + CATALOG_TTL_MS,
    };

    return parsed.data.data;
  } catch (error) {
    throw toAppError(error, "Could not load the True Markets catalog.");
  }
}

export async function fetchTrueMarketsQuote(
  symbol: string,
): Promise<MarketQuote | null> {
  const cacheKey = symbol.toUpperCase();
  const cached = quoteCache.get(cacheKey);
  if (cached && cached.expiresAt >= Date.now()) {
    return cached.value;
  }

  try {
    const { data } = await client.get<TrueMarketsPriceResponse>(
      "/v1/defi/market/prices",
      { params: { symbol: cacheKey } },
    );
    const parsed = trueMarketsPriceResponseSchema.safeParse(data);

    if (!parsed.success) {
      quoteCache.set(cacheKey, {
        value: null,
        expiresAt: Date.now() + QUOTE_TTL_MS,
      });
      return null;
    }

    const quote = quoteFromCandles(parsed.data);
    quoteCache.set(cacheKey, {
      value: quote,
      expiresAt: Date.now() + QUOTE_TTL_MS,
    });
    return quote;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      quoteCache.set(cacheKey, {
        value: null,
        expiresAt: Date.now() + QUOTE_TTL_MS,
      });
      return null;
    }

    quoteCache.set(cacheKey, {
      value: null,
      expiresAt: Date.now() + 10_000,
    });
    return null;
  }
}

export async function fetchTrueMarketsHistory(
  symbol: string,
  window: string,
  resolution: string,
): Promise<ChartPoint[]> {
  const cacheKey = `${symbol.toUpperCase()}:${window}:${resolution}`;
  const cached = historyCache.get(cacheKey);
  if (cached && cached.expiresAt >= Date.now()) {
    return cached.value;
  }

  try {
    const { data } = await client.get<TrueMarketsHistoryResponse>(
      "/v1/defi/market/prices/history",
      {
        params: { symbol: symbol.toUpperCase(), window, resolution },
        timeout: Math.max(env.TRUE_MARKETS_TIMEOUT_MS, 12_000),
      },
    );
    const parsed = trueMarketsHistoryResponseSchema.safeParse(data);
    if (!parsed.success) {
      historyCache.set(cacheKey, {
        value: [],
        expiresAt: Date.now() + 10_000,
      });
      return [];
    }

    const points = parsed.data.points
      .map((point) => {
        const price =
          typeof point.price === "number"
            ? point.price
            : asFiniteNumber(point.price);
        return price != null && price > 0
          ? { time: point.t, price }
          : null;
      })
      .filter((point): point is ChartPoint => Boolean(point));

    historyCache.set(cacheKey, {
      value: points,
      expiresAt: Date.now() + HISTORY_TTL_MS,
    });
    return points;
  } catch {
    historyCache.set(cacheKey, {
      value: [],
      expiresAt: Date.now() + 10_000,
    });
    return [];
  }
}

function asFiniteNumber(value: string | undefined): number | null {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function quoteFromCandles(payload: TrueMarketsPriceResponse): MarketQuote | null {
  const candle =
    payload.candles.find((item) => item.interval === "24h") ??
    payload.candles[0];

  if (!candle) {
    return null;
  }

  const price = asFiniteNumber(candle.closePrice);
  const open = asFiniteNumber(candle.openPrice);
  const high = asFiniteNumber(candle.highPrice);
  const low = asFiniteNumber(candle.lowPrice);

  if (price == null || price <= 0) {
    return null;
  }

  const changeValue = open != null ? price - open : null;
  const changePercent =
    open != null && open > 0 ? ((price - open) / open) * 100 : null;

  return { price, changePercent, changeValue, open, high, low };
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await mapper(items[current]);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}
