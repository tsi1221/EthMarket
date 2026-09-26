import { Router } from "express";
import {
  getUserPortfolio,
  getUserPortfolioBalance,
} from "../controllers/portfolio.controller";
import { requireAuth } from "../middleware/auth";
import { requireDatabase } from "../middleware/requireDatabase";
import { asyncHandler } from "../utils/asyncHandler";

export const portfolioRouter = Router();

portfolioRouter.get("/", requireAuth, requireDatabase, asyncHandler(getUserPortfolio));
portfolioRouter.get(
  "/balance",
  requireAuth,
  requireDatabase,
  asyncHandler(getUserPortfolioBalance),
);
