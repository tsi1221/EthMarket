import axios, { type AxiosError } from "axios";
import mongoose from "mongoose";
import { env } from "../config/env";
import { Order, type IOrder } from "../models/order.model";
import type {
  LocalOrderRecord,
  NormalizedTradeQuote,
  OrderStatus,
  OrderStatusView,
  SubmittedOrder,
  TradeOrderRequest,
  TradeQuoteRequest,
} from "../types/trading";
import { AppError } from "../utils/errors";
import { asText, collectIssues, normalizeTrueMarketsQuote, quoteProviderFailure } from "./quote.normalize";
import {
  clearTrueMarketsTokens,
  getTrueMarketsAccessToken,
} from "./trueMarketsAuth.service";

function messageFromBody(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;
  return (
    asText(record.error) ??
    asText(record.message) ??
    asText(record.detail) ??
    collectIssues(record.issues)[0] ??
    null
  );
}

function mapTradeError(error: AxiosError, action: "quote" | "order" | "status"): AppError {
  const status = error.response?.status;
  const message = messageFromBody(error.response?.data)?.toLowerCase() ?? "";
  const noun = action === "quote" ? "quote" : action === "status" ? "status" : "order";

  if (action === "quote") {
    const failure = quoteProviderFailure({
      timedOut: error.code === "ECONNABORTED",
      responded: Boolean(error.response),
      status,
      bodyMessage: messageFromBody(error.response?.data),
    });
    return new AppError(failure.message, failure.statusCode);
  }

  if (error.code === "ECONNABORTED") {
    return new AppError(`The ${noun} request timed out. Please try again.`, 504);
  }

  if (!error.response) {
    return new AppError("True Markets is temporarily unavailable.", 503);
  }

  if (status === 401 || status === 403) {
    return new AppError(
      action === "status"
        ? "True Markets session expired. Pull to refresh and try again."
        : "True Markets session expired. Please try again.",
      401,
    );
  }

  if (
    status === 402 ||
    message.includes("insufficient") ||
    message.includes("not enough") ||
    message.includes("balance")
  ) {
    return new AppError("Insufficient funds to submit this order.", 409);
  }

  if (message.includes("invalid asset") || message.includes("unknown asset")) {
    return new AppError("One of the selected assets is not valid for trading.", 400);
  }

  if (message.includes("qty") || message.includes("quantity") || message.includes("size")) {
    return new AppError("That quantity is not valid for this asset.", 400);
  }

  if (status === 400 || status === 422) {
    return new AppError(
      messageFromBody(error.response.data) ?? `This ${noun} request is not valid.`,
      400,
    );
  }

  if (action === "status") {
    return new AppError("Could not refresh this order status from True Markets.", 502);
  }

  return new AppError("Could not submit the order from True Markets.", 502);
}

async function postQuote(request: TradeQuoteRequest, accessToken: string) {
  return axios.post(
    `${env.TRUE_MARKETS_API_URL}/v1/conductor/quotes`,
    request,
    {
      timeout: env.TRUE_MARKETS_TIMEOUT_MS,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export async function requestTradeQuote(
  request: TradeQuoteRequest,
): Promise<NormalizedTradeQuote> {
  const token = await getTrueMarketsAccessToken();

  try {
    const { data } = await postQuote(request, token);
    return normalizeTrueMarketsQuote(request, data);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearTrueMarketsTokens();
      const nextToken = await getTrueMarketsAccessToken(true);
      try {
        const { data } = await postQuote(request, nextToken);
        return normalizeTrueMarketsQuote(request, data);
      } catch (retryError) {
        if (axios.isAxiosError(retryError)) {
          throw mapTradeError(retryError, "quote");
        }
        throw new AppError("Could not get a quote from True Markets.", 502);
      }
    }

    if (axios.isAxiosError(error)) {
      throw mapTradeError(error, "quote");
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Could not get a quote from True Markets.", 502);
  }
}

const SUBMITTED_NOTICE =
  "Order submitted. This means True Markets accepted the request, not that the trade is filled.";

const FILLED_REMOTE = new Set(["filled", "complete", "completed"]);
const PENDING_REMOTE = new Set([
  "pending",
  "submitted",
  "initialized",
  "open",
  "new",
  "accepted",
  "working",
  "queued",
  "processing",
  "active",
  "cancel_pending",
]);
const FAILED_REMOTE = new Set(["failed", "error", "rejected", "expired", "declined"]);
const CANCELLED_REMOTE = new Set(["cancelled", "canceled"]);

function unwrapOrder(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object") {
    return {};
  }

  const record = data as Record<string, unknown>;
  if (record.order && typeof record.order === "object") {
    return record.order as Record<string, unknown>;
  }
  if (record.data && typeof record.data === "object" && !Array.isArray(record.data)) {
    return record.data as Record<string, unknown>;
  }
  return record;
}

function mapRemoteStatus(value: string | null, missing: OrderStatus = "unknown"): OrderStatus {
  if (!value) {
    return missing;
  }

  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!normalized) {
    return missing;
  }

  if (FILLED_REMOTE.has(normalized)) {
    return "filled";
  }
  if (PENDING_REMOTE.has(normalized)) {
    return normalized === "submitted" ? "submitted" : "pending";
  }
  if (FAILED_REMOTE.has(normalized)) {
    return "failed";
  }
  if (CANCELLED_REMOTE.has(normalized)) {
    return "cancelled";
  }

  return "unknown";
}

function noticeForStatus(status: OrderStatus): string {
  if (status === "filled") {
    return "True Markets reported this order as filled.";
  }
  if (status === "unknown") {
    return "True Markets returned a status we do not recognize. It is not treated as filled.";
  }
  if (status === "failed") {
    return "True Markets reported this order as failed.";
  }
  if (status === "cancelled") {
    return "True Markets reported this order as cancelled.";
  }
  return "True Markets has not reported this order as filled.";
}

function toOrderRecord(order: IOrder & { _id: mongoose.Types.ObjectId }): LocalOrderRecord {
  return {
    id: order._id.toString(),
    trueMarketsOrderId: order.trueMarketsOrderId,
    symbol: order.symbol,
    side: order.side,
    quantity: order.quantity,
    type: order.type,
    status: mapRemoteStatus(order.status, "unknown"),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

function readRemoteStatus(data: unknown): string | null {
  const raw = unwrapOrder(data);
  return (
    asText(raw.status) ??
    asText(raw.order_status) ??
    asText(raw.orderStatus) ??
    asText(raw.state)
  );
}

async function postOrder(request: TradeOrderRequest, accessToken: string) {
  return axios.post(
    `${env.TRUE_MARKETS_API_URL}/v1/conductor/orders`,
    request,
    {
      timeout: env.TRUE_MARKETS_TIMEOUT_MS,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

async function submitRemoteOrder(request: TradeOrderRequest) {
  const token = await getTrueMarketsAccessToken();

  try {
    return await postOrder(request, token);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearTrueMarketsTokens();
      const nextToken = await getTrueMarketsAccessToken(true);
      return postOrder(request, nextToken);
    }
    throw error;
  }
}

export async function submitTradeOrder(
  userId: string,
  request: TradeOrderRequest,
): Promise<SubmittedOrder> {
  let response;

  try {
    response = await submitRemoteOrder(request);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw mapTradeError(error, "order");
    }
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("Could not submit the order to True Markets.", 502);
  }

  const raw = unwrapOrder(response.data);
  const trueMarketsOrderId = asText(raw.order_id) ?? asText(raw.id);
  const issues = collectIssues(raw.issues);

  if (!trueMarketsOrderId) {
    if (issues.some((issue) => issue.toLowerCase().includes("insufficient"))) {
      throw new AppError("Insufficient funds to submit this order.", 409);
    }
    throw new AppError("True Markets did not create an order. No trade was submitted.", 502);
  }

  const saved = await Order.create({
    userId: new mongoose.Types.ObjectId(userId),
    trueMarketsOrderId,
    symbol: request.base_asset,
    side: request.side,
    quantity: request.qty,
    type: request.type,
    status: mapRemoteStatus(asText(raw.status), "submitted"),
  });

  return {
    id: saved._id.toString(),
    trueMarketsOrderId: saved.trueMarketsOrderId,
    symbol: saved.symbol,
    side: saved.side,
    quantity: saved.quantity,
    type: saved.type,
    status: mapRemoteStatus(saved.status, "submitted"),
    createdAt: saved.createdAt.toISOString(),
    notice: SUBMITTED_NOTICE,
  };
}

export async function listUserOrders(userId: string): Promise<LocalOrderRecord[]> {
  const rows = await Order.find({ userId: new mongoose.Types.ObjectId(userId) })
    .sort({ createdAt: -1 })
    .lean();

  return rows.map((row) => toOrderRecord(row));
}

async function getRemoteOrderStatus(trueMarketsOrderId: string, accessToken: string) {
  return axios.get(
    `${env.TRUE_MARKETS_API_URL}/v1/conductor/orders/${encodeURIComponent(trueMarketsOrderId)}/status`,
    {
      timeout: env.TRUE_MARKETS_TIMEOUT_MS,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

async function fetchRemoteOrderStatus(trueMarketsOrderId: string) {
  const token = await getTrueMarketsAccessToken();

  try {
    return await getRemoteOrderStatus(trueMarketsOrderId, token);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      clearTrueMarketsTokens();
      const nextToken = await getTrueMarketsAccessToken(true);
      return getRemoteOrderStatus(trueMarketsOrderId, nextToken);
    }
    throw error;
  }
}

export async function refreshUserOrderStatus(
  userId: string,
  orderId: string,
): Promise<OrderStatusView> {
  const order = await Order.findOne({
    _id: orderId,
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (!order) {
    throw new AppError("Order not found.", 404);
  }

  let remoteStatus: string | null = null;
  let nextStatus: OrderStatus;

  try {
    const response = await fetchRemoteOrderStatus(order.trueMarketsOrderId);
    remoteStatus = readRemoteStatus(response.data);
    nextStatus = mapRemoteStatus(remoteStatus, "unknown");
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      remoteStatus = null;
      nextStatus = "unknown";
    } else if (axios.isAxiosError(error)) {
      throw mapTradeError(error, "status");
    } else if (error instanceof AppError) {
      throw error;
    } else {
      throw new AppError("Could not refresh this order status from True Markets.", 502);
    }
  }

  order.status = nextStatus;
  await order.save();

  return {
    ...toOrderRecord(order),
    remoteStatus,
    isFilled: nextStatus === "filled",
    notice: noticeForStatus(nextStatus),
  };
}
