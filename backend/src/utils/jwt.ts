import jwt, { type SignOptions } from "jsonwebtoken";
import mongoose from "mongoose";
import { env } from "../config/env";
import type { AuthTokenPayload } from "../types/auth";
import { AppError } from "./errors";

const signOptions: SignOptions = {
  expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
  issuer: env.JWT_ISSUER,
  audience: env.JWT_AUDIENCE,
};

export function signAccessToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, signOptions);
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    });

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      typeof decoded.userId !== "string" ||
      !mongoose.isValidObjectId(decoded.userId)
    ) {
      throw new AppError("Invalid authentication token", 401);
    }

    return { userId: decoded.userId };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError("Invalid or expired authentication token", 401);
  }
}
