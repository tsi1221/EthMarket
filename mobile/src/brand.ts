/** Visible product branding. Keep storage keys and Android package unchanged. */
export const BRAND = {
  name: "EthMarket",
  tagline: "Discover. Compare. Invest.",
  supportLine: "Understand before you act.",
  homeHero: "Explore the Market",
  homeSupport: "Discover assets, understand them, compare, then get a live quote.",
  journey: "Discover → Understand → Compare → Quote",
} as const;

/** Real order placement is intentionally disabled until a live order path is verified. */
export const ORDER_EXECUTION_ENABLED = false;
export const ORDER_EXECUTION_NOTICE =
  "Order execution is currently unavailable. You can review a live quote, but no trade will be placed.";
