import type { Request, Response } from "express";
import {
  getUserWatchlist,
  replaceUserWatchlist,
  toggleUserWatchlistSymbol,
} from "../services/watchlist.service";
import type { AuthenticatedRequest } from "../types";
import type {
  WatchlistReplaceInput,
  WatchlistToggleInput,
} from "../validators/watchlist.validator";

export async function getWatchlist(req: Request, res: Response) {
  const { userId } = req as AuthenticatedRequest;
  const symbols = await getUserWatchlist(userId);
  res.status(200).json({ symbols });
}

export async function replaceWatchlist(req: Request, res: Response) {
  const { userId } = req as AuthenticatedRequest;
  const { symbols: requested } = req.body as WatchlistReplaceInput;
  const symbols = await replaceUserWatchlist(userId, requested);
  res.status(200).json({ symbols });
}

export async function toggleWatchlist(req: Request, res: Response) {
  const { userId } = req as AuthenticatedRequest;
  const { symbol } = req.body as WatchlistToggleInput;
  const result = await toggleUserWatchlistSymbol(userId, symbol);
  res.status(200).json(result);
}
