import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import type { AuthenticatedRequest } from "../types";
import { AppError } from "../utils/errors";
import { verifyAccessToken } from "../utils/jwt";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");

  if (!header || !header.startsWith("Bearer ")) {
    next(new AppError("Authentication token is required", 401));
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  if (!token) {
    next(new AppError("Authentication token is required", 401));
    return;
  }

  try {
    const { userId } = verifyAccessToken(token);
    if (!mongoose.isValidObjectId(userId)) {
      next(new AppError("Invalid or expired authentication token", 401));
      return;
    }
    (req as AuthenticatedRequest).userId = userId;
    next();
  } catch (error) {
    next(error);
  }
}
