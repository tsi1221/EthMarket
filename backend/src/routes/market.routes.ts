import { Router } from "express";
import {
  getMarketAsset,
  getMarketAssetChart,
  listMarketAssets,
} from "../controllers/market.controller";
import { asyncHandler } from "../utils/asyncHandler";

export const marketRouter = Router();

marketRouter.get("/", asyncHandler(listMarketAssets));
marketRouter.get("/:symbol/chart", asyncHandler(getMarketAssetChart));
marketRouter.get("/:symbol", asyncHandler(getMarketAsset));
