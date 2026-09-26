import { z } from "zod";

const symbolSchema = z
  .string()
  .trim()
  .min(1, "Asset is required")
  .max(24, "Enter a valid asset symbol")
  .regex(/^[A-Za-z0-9._-]+$/, "Enter a valid asset symbol")
  .transform((value) => value.toUpperCase());

export const watchlistToggleSchema = z.object({
  symbol: symbolSchema,
});

export const watchlistReplaceSchema = z.object({
  symbols: z.array(symbolSchema).max(50, "Watchlist can hold up to 50 assets"),
});

export type WatchlistToggleInput = z.infer<typeof watchlistToggleSchema>;
export type WatchlistReplaceInput = z.infer<typeof watchlistReplaceSchema>;
