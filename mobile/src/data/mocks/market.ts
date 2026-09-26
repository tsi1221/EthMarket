/**
 * Isolated development preview fixtures.
 * Not True Markets data. Used only by mobile/src/data/devPreview.ts.
 */
import type { Asset, PortfolioHolding } from "../../types/market";

export const mockAssets: Asset[] = [
  {
    id: "aapl",
    symbol: "AAPL",
    name: "Apple",
    type: "stock",
    price: 227.52,
    changePercent: 1.24,
    changeValue: 2.79,
  },
  {
    id: "msft",
    symbol: "MSFT",
    name: "Microsoft",
    type: "stock",
    price: 428.15,
    changePercent: 0.86,
    changeValue: 3.65,
  },
  {
    id: "nvda",
    symbol: "NVDA",
    name: "NVIDIA",
    type: "stock",
    price: 131.28,
    changePercent: 3.41,
    changeValue: 4.33,
  },
  {
    id: "googl",
    symbol: "GOOGL",
    name: "Alphabet",
    type: "stock",
    price: 165.9,
    changePercent: -0.72,
    changeValue: -1.2,
  },
  {
    id: "amzn",
    symbol: "AMZN",
    name: "Amazon",
    type: "stock",
    price: 186.44,
    changePercent: 0.41,
    changeValue: 0.76,
  },
  {
    id: "ko",
    symbol: "KO",
    name: "Coca-Cola",
    type: "stock",
    price: 68.12,
    changePercent: 0.18,
    changeValue: 0.12,
  },
  {
    id: "tsla",
    symbol: "TSLA",
    name: "Tesla",
    type: "stock",
    price: 241.05,
    changePercent: -2.14,
    changeValue: -5.27,
  },
  {
    id: "vti",
    symbol: "VTI",
    name: "Vanguard Total Market",
    type: "etf",
    price: 283.4,
    changePercent: 0.62,
    changeValue: 1.75,
  },
  {
    id: "spy",
    symbol: "SPY",
    name: "S&P 500 ETF",
    type: "etf",
    price: 562.18,
    changePercent: 0.54,
    changeValue: 3.02,
  },
  {
    id: "qqq",
    symbol: "QQQ",
    name: "Nasdaq 100 ETF",
    type: "etf",
    price: 489.77,
    changePercent: 1.08,
    changeValue: 5.23,
  },
  {
    id: "btc",
    symbol: "BTC",
    name: "Bitcoin",
    type: "crypto",
    price: 64120,
    changePercent: 2.05,
    changeValue: 1288,
  },
  {
    id: "eth",
    symbol: "ETH",
    name: "Ethereum",
    type: "crypto",
    price: 2488,
    changePercent: -1.36,
    changeValue: -34.3,
  },
];

export const mockTrendingIds = ["nvda", "aapl", "btc", "spy"];

export const mockWatchlistIds = ["nvda", "msft", "btc"];

export const mockHoldings: PortfolioHolding[] = [
  { assetId: "vti", quantity: 18, averageCost: 246.1 },
  { assetId: "aapl", quantity: 12, averageCost: 198.4 },
  { assetId: "qqq", quantity: 6, averageCost: 452.75 },
  { assetId: "ko", quantity: 20, averageCost: 61.2 },
];

export const mockCash = 1240.55;
