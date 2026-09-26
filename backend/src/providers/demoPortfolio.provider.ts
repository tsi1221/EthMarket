import mongoose from "mongoose";
import { Holding } from "../models/holding.model";
import { Portfolio } from "../models/portfolio.model";
import type { PortfolioAccount, StoredHolding } from "../types/portfolio";

const DEMO_NOTICE =
  "This is simulated practice data. True Markets account balances are not connected yet.";

const DEMO_CASH = 1250;
const DEMO_HOLDINGS: Array<{
  symbol: string;
  quantity: number;
  averageEntryPrice: number;
}> = [
  { symbol: "BTC", quantity: 0.015, averageEntryPrice: 82_000 },
  { symbol: "ETH", quantity: 0.4, averageEntryPrice: 3_050 },
  { symbol: "SOL", quantity: 8, averageEntryPrice: 138 },
];

function toStoredHolding(holding: {
  symbol: string;
  quantity: number;
  averageEntryPrice: number;
  createdAt: Date;
  updatedAt: Date;
}): StoredHolding {
  return {
    symbol: holding.symbol,
    quantity: holding.quantity,
    averageEntryPrice: holding.averageEntryPrice,
    createdAt: holding.createdAt,
    updatedAt: holding.updatedAt,
  };
}

export async function getOrCreateDemoAccount(userId: string): Promise<PortfolioAccount> {
  const ownerId = new mongoose.Types.ObjectId(userId);
  let portfolio = await Portfolio.findOne({ userId: ownerId });

  if (!portfolio) {
    portfolio = await Portfolio.create({
      userId: ownerId,
      cash: DEMO_CASH,
      source: "demo",
    });
  }

  let holdings = await Holding.find({ userId: ownerId }).sort({ symbol: 1 });

  if (holdings.length === 0) {
    await Holding.insertMany(
      DEMO_HOLDINGS.map((holding) => ({
        userId: ownerId,
        symbol: holding.symbol,
        quantity: holding.quantity,
        averageEntryPrice: holding.averageEntryPrice,
      })),
    );
    holdings = await Holding.find({ userId: ownerId }).sort({ symbol: 1 });
  }

  return {
    userId,
    cash: portfolio.cash,
    source: "demo",
    label: "Demo portfolio",
    notice: DEMO_NOTICE,
    holdings: holdings.map(toStoredHolding),
  };
}
