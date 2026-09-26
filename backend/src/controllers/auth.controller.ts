import type { Request, Response } from "express";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  updateUserProfile,
} from "../services/auth.service";
import type { AuthenticatedRequest } from "../types";
import type {
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from "../validators/auth.validator";

export async function register(req: Request, res: Response) {
  const payload = await registerUser(req.body as RegisterInput);

  res.status(201).json(payload);
}

export async function login(req: Request, res: Response) {
  const payload = await loginUser(req.body as LoginInput);

  res.status(200).json(payload);
}

export async function me(req: Request, res: Response) {
  const { userId } = req as AuthenticatedRequest;
  const user = await getCurrentUser(userId);

  res.status(200).json({ user });
}

export async function updateMe(req: Request, res: Response) {
  const { userId } = req as AuthenticatedRequest;
  const user = await updateUserProfile(userId, req.body as UpdateProfileInput);

  res.status(200).json({ user });
}
