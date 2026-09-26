import { z } from "zod";

export const trueMarketsAssetSchema = z
  .object({
    id: z.string().min(1),
    symbol: z.string().min(1),
    name: z.string().min(1),
    chain: z.string().nullish(),
    address: z.string().nullish(),
    venue: z.string().nullish(),
    asset_class: z.string().nullish(),
    type: z.string().nullish(),
    icon: z.string().nullish(),
    image: z
      .object({
        thumb: z.string().optional(),
        small: z.string().optional(),
        large: z.string().optional(),
      })
      .nullish(),
    tradeable: z.boolean().optional(),
    is_active: z.boolean().optional(),
    description: z.string().nullish(),
    website: z.string().nullish(),
    market_data: z.record(z.unknown()).nullish(),
  })
  .passthrough();

export const trueMarketsAssetsResponseSchema = z.object({
  data: z.array(trueMarketsAssetSchema),
  pagination: z
    .object({
      next_cursor: z.string().nullish(),
      limit: z.number().optional(),
    })
    .optional(),
});

export const trueMarketsCandleSchema = z.object({
  interval: z.string(),
  openPrice: z.string(),
  closePrice: z.string(),
  highPrice: z.string().optional(),
  lowPrice: z.string().optional(),
});

export const trueMarketsPriceResponseSchema = z.object({
  symbol: z.string(),
  candles: z.array(trueMarketsCandleSchema),
});

export const marketQuerySchema = z.object({
  q: z.string().trim().max(80).optional().default(""),
  category: z.enum(["all", "cefi", "defi"]).optional().default("all"),
});

export const marketSymbolSchema = z.object({
  symbol: z
    .string()
    .trim()
    .min(1)
    .max(24)
    .regex(/^[A-Za-z0-9._-]+$/, "Enter a valid asset symbol"),
});

export const chartPeriodSchema = z.enum(["1D", "1W", "1M", "1Y"]);

export const chartQuerySchema = z.object({
  period: chartPeriodSchema.optional().default("1D"),
});

export const trueMarketsHistoryResponseSchema = z
  .object({
    symbol: z.string().optional(),
    window: z.string().optional(),
    resolution: z.string().optional(),
    points: z.array(
      z.object({
        t: z.string(),
        price: z.union([z.string(), z.number()]),
      }),
    ),
  })
  .passthrough();
