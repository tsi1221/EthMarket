import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { AppError } from "../utils/errors";

export function validateBody(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      next(new AppError("Validation failed", 400, result.error.flatten()));
      return;
    }

    req.body = result.data;
    next();
  };
}


export function validateParams(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      next(new AppError("Validation failed", 400, result.error.flatten()));
      return;
    }

    req.params = result.data as typeof req.params;
    next();
  };
}
