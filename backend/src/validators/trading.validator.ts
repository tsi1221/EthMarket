import { z } from "zod";

const assetSymbol = z
  .string()
  .trim()
  .min(1, "Asset is required")
  .max(24, "Enter a valid asset symbol")
  .regex(/^[A-Za-z0-9._-]+$/, "Enter a valid asset symbol")
  .transform((value) => value.toUpperCase());

export const tradeQuoteRequestSchema = z.object({
  base_asset: assetSymbol,
  quote_asset: assetSymbol,
  qty: z
    .string()
    .trim()
    .regex(/^\d+(\.\d+)?$/, "Enter a valid quantity")
    .refine((value) => Number(value) > 0, "Quantity must be greater than 0"),
  qty_unit: z.enum(["quote", "base"], {
    errorMap: () => ({ message: "Quantity unit must be quote or base" }),
  }),
  side: z.enum(["buy", "sell"], {
    errorMap: () => ({ message: "Side must be buy or sell" }),
  }),
});

export const tradeOrderRequestSchema = tradeQuoteRequestSchema.extend({
  type: z.literal("market", {
    errorMap: () => ({ message: "Only market orders are supported" }),
  }),
});

export const orderIdParamSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Enter a valid order id"),
});

export type TradeQuoteInput = z.infer<typeof tradeQuoteRequestSchema>;
export type TradeOrderInput = z.infer<typeof tradeOrderRequestSchema>;
export type OrderIdParam = z.infer<typeof orderIdParamSchema>;
