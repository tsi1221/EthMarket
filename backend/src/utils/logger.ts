import axios from "axios";
import { env } from "../config/env";

function redactText(value: string): string {
  return value
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, "Bearer [redacted]")
    .replace(/mongodb(\+srv)?:\/\/[^@\s/]+@/gi, "mongodb://[redacted]@")
    .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[redacted-jwt]");
}

function summarizeError(error: unknown): Record<string, unknown> {
  if (axios.isAxiosError(error)) {
    const url = error.config?.url ? redactText(error.config.url) : null;
    return {
      name: "AxiosError",
      message: redactText(error.message),
      code: error.code ?? null,
      status: error.response?.status ?? null,
      method: error.config?.method ?? null,
      url,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: redactText(error.message),
    };
  }

  return { name: "UnknownError" };
}

export function logError(scope: string, error: unknown) {
  const summary = summarizeError(error);
  console.error(`[${scope}]`, summary);

  if (
    env.NODE_ENV === "development" &&
    error instanceof Error &&
    error.stack &&
    !axios.isAxiosError(error)
  ) {
    console.error(redactText(error.stack));
  }
}
