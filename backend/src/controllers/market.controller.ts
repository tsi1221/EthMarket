import type { Request, Response } from "express";
import {
  getMarketBySymbol,
  getMarketChart,
  listMarkets,
} from "../services/market.service";
import {
  chartQuerySchema,
  marketQuerySchema,
  marketSymbolSchema,
} from "../validators/market.validator";

export async function listMarketAssets(req: Request, res: Response) {
  const { q, category } = marketQuerySchema.parse(req.query);
  const payload = await listMarkets({ query: q, category });

  res.status(200).json(payload);
}

export async function getMarketAsset(req: Request, res: Response) {
  const { symbol } = marketSymbolSchema.parse(req.params);
  const asset = await getMarketBySymbol(symbol);

  res.status(200).json({ asset });
}

export async function getMarketAssetChart(req: Request, res: Response) {
  const { symbol } = marketSymbolSchema.parse(req.params);
  const { period } = chartQuerySchema.parse(req.query);
  const chart = await getMarketChart(symbol, period);

  res.status(200).json(chart);
}
