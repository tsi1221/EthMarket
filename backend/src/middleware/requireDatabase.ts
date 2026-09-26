import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { AppError } from "../utils/errors";

export function requireDatabase(_req: Request, _res: Response, next: NextFunction) {
  if (mongoose.connection.readyState !== 1) {
    next(
      new AppError(
        "EthMarket data is temporarily unavailable. Please try again shortly.",
        503,
      ),
    );
    return;
  }

  next();
}
