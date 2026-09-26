import { Router } from "express";
import { login, me, register, updateMe } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { authRateLimit } from "../middleware/rateLimit";
import { requireDatabase } from "../middleware/requireDatabase";
import { validateBody } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { loginSchema, registerSchema, updateProfileSchema } from "../validators/auth.validator";

export const authRouter = Router();

authRouter.post(
  "/register",
  authRateLimit,
  validateBody(registerSchema),
  requireDatabase,
  asyncHandler(register),
);

authRouter.post(
  "/login",
  authRateLimit,
  validateBody(loginSchema),
  requireDatabase,
  asyncHandler(login),
);

authRouter.get("/me", requireAuth, requireDatabase, asyncHandler(me));
authRouter.patch(
  "/me",
  requireAuth,
  requireDatabase,
  validateBody(updateProfileSchema),
  asyncHandler(updateMe),
);
