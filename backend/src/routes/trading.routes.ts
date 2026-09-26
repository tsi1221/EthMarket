import { Router } from "express";
import {
  createTradeOrder,
  createTradeQuote,
  getTradeOrderStatus,
  getTradingCapabilities,
  listTradeOrders,
} from "../controllers/trading.controller";
import { requireAuth } from "../middleware/auth";
import { tradingRateLimit } from "../middleware/rateLimit";
import { requireDatabase } from "../middleware/requireDatabase";
import { validateBody, validateParams } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import {
  orderIdParamSchema,
  tradeOrderRequestSchema,
  tradeQuoteRequestSchema,
} from "../validators/trading.validator";

export const tradingRouter = Router();

tradingRouter.get("/capabilities", asyncHandler(getTradingCapabilities));

tradingRouter.use(requireAuth, tradingRateLimit);

tradingRouter.post(
  "/quote",
  validateBody(tradeQuoteRequestSchema),
  asyncHandler(createTradeQuote),
);

tradingRouter.get("/orders", requireDatabase, asyncHandler(listTradeOrders));

tradingRouter.post(
  "/orders",
  requireDatabase,
  validateBody(tradeOrderRequestSchema),
  asyncHandler(createTradeOrder),
);

tradingRouter.get(
  "/orders/:id/status",
  requireDatabase,
  validateParams(orderIdParamSchema),
  asyncHandler(getTradeOrderStatus),
);
