import type { Request, Response } from "express";
import { getPortfolio, getPortfolioBalance } from "../services/portfolio.service";
import type { AuthenticatedRequest } from "../types";

export async function getUserPortfolio(req: Request, res: Response) {
  const { userId } = req as AuthenticatedRequest;
  const portfolio = await getPortfolio(userId);

  res.status(200).json(portfolio);
}

export async function getUserPortfolioBalance(req: Request, res: Response) {
  const { userId } = req as AuthenticatedRequest;
  const balance = await getPortfolioBalance(userId);

  res.status(200).json(balance);
}
