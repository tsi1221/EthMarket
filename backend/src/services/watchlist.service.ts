import mongoose from "mongoose";
import { Watchlist } from "../models/watchlist.model";
import { AppError } from "../utils/errors";

const MAX_SYMBOLS = 50;

function ownerId(userId: string) {
  return new mongoose.Types.ObjectId(userId);
}

function uniqueSymbols(symbols: string[]): string[] {
  const unique: string[] = [];
  for (const symbol of symbols) {
    const normalized = symbol.trim().toUpperCase();
    if (normalized && !unique.includes(normalized)) {
      unique.push(normalized);
    }
  }
  return unique;
}

export async function getUserWatchlist(userId: string): Promise<string[]> {
  const doc = await Watchlist.findOne({ userId: ownerId(userId) }).lean();
  return doc?.symbols ?? [];
}

export async function replaceUserWatchlist(
  userId: string,
  symbols: string[],
): Promise<string[]> {
  const next = uniqueSymbols(symbols);
  if (next.length > MAX_SYMBOLS) {
    throw new AppError("Watchlist can hold up to 50 assets.", 400);
  }

  const doc = await Watchlist.findOneAndUpdate(
    { userId: ownerId(userId) },
    { userId: ownerId(userId), symbols: next },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return doc.symbols;
}

export async function toggleUserWatchlistSymbol(
  userId: string,
  symbol: string,
): Promise<{ symbols: string[]; watched: boolean }> {
  const normalized = symbol.trim().toUpperCase();
  const current = await getUserWatchlist(userId);
  const exists = current.includes(normalized);
  const next = exists
    ? current.filter((item) => item !== normalized)
    : [normalized, ...current];

  if (next.length > MAX_SYMBOLS) {
    throw new AppError("Watchlist can hold up to 50 assets.", 400);
  }

  const symbols = await replaceUserWatchlist(userId, next);
  return { symbols, watched: symbols.includes(normalized) };
}
