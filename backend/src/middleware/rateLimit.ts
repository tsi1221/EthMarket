import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import type { AuthenticatedRequest } from "../types";
import { AppError } from "../utils/errors";

type RateLimitOptions = {
  windowMs: number;
  max: number;
  key: (req: Request) => string;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Bucket>();
const CLEANUP_EVERY = 200;

function clientIp(req: Request): string {
  return req.socket.remoteAddress?.trim() || "unknown";
}

export function rateLimit({ windowMs, max, key }: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const id = key(req);
    const current = store.get(id);

    if (store.size > CLEANUP_EVERY) {
      for (const [entryKey, bucket] of store) {
        if (bucket.resetAt <= now) {
          store.delete(entryKey);
        }
      }
    }

    if (!current || current.resetAt <= now) {
      store.set(id, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    current.count += 1;

    if (current.count > max) {
      const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      next(new AppError("Too many requests. Please try again later.", 429));
      return;
    }

    next();
  };
}

const skipInTests = (_req: Request, _res: Response, next: NextFunction) => {
  next();
};

export const authRateLimit =
  env.NODE_ENV === "test"
    ? skipInTests
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        key: (req) => `auth:${clientIp(req)}`,
      });

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 180,
  key: (req) => `api:${clientIp(req)}`,
});

export const tradingRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  key: (req) => {
    const userId = (req as AuthenticatedRequest).userId ?? "anon";
    return `trade:${clientIp(req)}:${userId}`;
  },
});
