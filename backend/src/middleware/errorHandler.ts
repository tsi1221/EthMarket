import type { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";
import { logError } from "../utils/logger";

const SAFE_SERVER_ERROR =
  "Unable to complete this request right now. Please try again.";

/**
 * Maps AppError messages that are already safe for clients.
 * Unknown errors are logged in full and never forwarded as technical text.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: sanitizeClientMessage(err.message, err.statusCode),
      details: err.details,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation failed",
      details: err.flatten(),
    });
    return;
  }

  if (err instanceof TokenExpiredError || err instanceof JsonWebTokenError) {
    res.status(401).json({
      error: "Invalid or expired authentication token",
    });
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({
      error: "Request body must be valid JSON",
    });
    return;
  }

  if (isMongoDuplicateError(err)) {
    res.status(409).json({
      error: "An account with this email already exists",
    });
    return;
  }

  if (isDatabaseUnavailable(err)) {
    res.status(503).json({
      error: "EthMarket data is temporarily unavailable. Please try again shortly.",
    });
    return;
  }

  logError("error", err);

  res.status(500).json({
    error: SAFE_SERVER_ERROR,
  });
}

function sanitizeClientMessage(message: string, statusCode: number): string {
  const trimmed = message.trim();
  if (!trimmed) {
    return SAFE_SERVER_ERROR;
  }

  const lower = trimmed.toLowerCase();
  if (
    lower === "internal server error" ||
    lower.includes("stack trace") ||
    lower.includes("private_key") ||
    lower.includes("api key") ||
    lower.includes("jwt secret") ||
    /bearer\s+[a-z0-9._-]+/i.test(trimmed) ||
    /https?:\/\/[^\s]+@(?:.+)/i.test(trimmed)
  ) {
    if (statusCode === 401 || statusCode === 403) {
      return "Please sign in again to continue.";
    }
    if (statusCode === 502 || statusCode === 503 || statusCode === 504) {
      return "Market data is temporarily unavailable. Please try again in a moment.";
    }
    return SAFE_SERVER_ERROR;
  }

  return trimmed;
}

function isMongoDuplicateError(err: Error): boolean {
  return "code" in err && (err as { code?: number }).code === 11000;
}

function isDatabaseUnavailable(err: Error): boolean {
  const name = err.name;
  if (
    name === "MongoServerSelectionError" ||
    name === "MongoNetworkError" ||
    name === "MongoTimeoutError" ||
    name === "MongoNotConnectedError" ||
    name === "MongooseError"
  ) {
    return true;
  }

  const message = err.message.toLowerCase();
  return (
    message.includes("buffering timed out") ||
    message.includes("topology was destroyed") ||
    message.includes("failed to connect")
  );
}
