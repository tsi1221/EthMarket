import type { Request, Response } from "express";
import { env } from "../config/env";
import { isTrueMarketsTradingConfigured } from "../services/trueMarketsAuth.service";
import {
  listUserOrders,
  refreshUserOrderStatus,
  requestTradeQuote,
  submitTradeOrder,
} from "../services/trading.service";
import type { AuthenticatedRequest } from "../types";
import { AppError } from "../utils/errors";
import type { OrderIdParam, TradeOrderInput, TradeQuoteInput } from "../validators/trading.validator";

export async function getTradingCapabilities(_req: Request, res: Response) {
  const configured = isTrueMarketsTradingConfigured();
  const ordersEnabled = configured && env.ORDER_EXECUTION_ENABLED;

  res.status(200).json({
    quotesEnabled: configured,
    ordersEnabled,
    message: !configured
      ? "True Markets trading credentials are not configured on the server. You can still discover and compare assets. Quotes and orders are unavailable."
      : ordersEnabled
        ? "Quotes and orders are sent to the configured True Markets API. Confirming an order can use real funds if that environment is live."
        : "Live quotes are available. Order execution is currently disabled — you can review a quote, but no trade will be placed.",
  });
}

export async function createTradeQuote(req: Request, res: Response) {
  const quote = await requestTradeQuote(req.body as TradeQuoteInput);

  res.status(200).json({ quote });
}

export async function createTradeOrder(req: Request, res: Response) {
  if (!env.ORDER_EXECUTION_ENABLED) {
    throw new AppError(
      "Order execution is currently unavailable. You can review a live quote, but no trade will be placed.",
      503,
    );
  }

  const { userId } = req as AuthenticatedRequest;
  const order = await submitTradeOrder(userId, req.body as TradeOrderInput);

  res.status(201).json({
    order_id: order.trueMarketsOrderId,
    order,
  });
}

export async function listTradeOrders(req: Request, res: Response) {
  const { userId } = req as AuthenticatedRequest;
  const orders = await listUserOrders(userId);

  res.status(200).json({ orders });
}

export async function getTradeOrderStatus(req: Request, res: Response) {
  const { userId } = req as AuthenticatedRequest;
  const { id } = req.params as OrderIdParam;
  const order = await refreshUserOrderStatus(userId, id);

  res.status(200).json({ order });
}
