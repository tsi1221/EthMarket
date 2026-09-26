import { apiClient } from "./client";
import type { AuthResponse, MeResponse } from "../types/auth";

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export async function loginRequest(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function registerRequest(
  payload: RegisterRequest,
): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>("/auth/register", payload);
  return data;
}

export async function getCurrentUserRequest(): Promise<MeResponse> {
  const { data } = await apiClient.get<MeResponse>("/auth/me");
  return data;
}

export async function updateProfileRequest(payload: { name: string }): Promise<MeResponse> {
  const { data } = await apiClient.patch<MeResponse>("/auth/me", payload);
  return data;
}
