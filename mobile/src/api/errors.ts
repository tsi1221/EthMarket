import axios, { type AxiosError } from "axios";
import { t } from "../i18n/translate";
import type { ApiErrorBody } from "../types/auth";

/** True when the request never reached the API (offline, timeout, connection refused). */
export function isUnreachableError(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}

export function getErrorStatus(error: unknown): number | null {
  if (axios.isAxiosError(error) && error.response?.status) {
    return error.response.status;
  }
  return null;
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return getAxiosErrorMessage(error);
  }

  if (error instanceof Error && error.message) {
    return sanitizeClientErrorMessage(error.message) ?? t("error.generic");
  }

  return t("error.generic");
}

function getAxiosErrorMessage(error: AxiosError<ApiErrorBody>): string {
  if (!error.response) {
    return t("error.timeout");
  }

  const status = error.response.status;
  const apiError = error.response.data?.error;
  const detail = firstValidationMessage(error.response.data?.details);
  const serverMessage =
    typeof apiError === "string" && apiError.trim()
      ? apiError === "Validation failed" && detail
        ? detail
        : apiError
      : null;

  if (status === 400) {
    return sanitizeClientErrorMessage(serverMessage) ?? t("error.validation");
  }

  if (status === 401 || status === 403) {
    return t("auth.sessionExpired");
  }

  if (status === 404) {
    return sanitizeClientErrorMessage(serverMessage) ?? t("error.notFound");
  }

  if (status === 429) {
    return t("error.rateLimit");
  }

  if (status === 502 || status === 503 || status === 504) {
    return t("error.marketUnavailable");
  }

  if (status >= 500) {
    return t("error.server");
  }

  return sanitizeClientErrorMessage(serverMessage) ?? t("error.generic");
}

function sanitizeClientErrorMessage(message: string | null | undefined): string | null {
  if (!message || !message.trim()) {
    return null;
  }

  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();

  if (
    lower === "internal server error" ||
    lower.includes("internal server error") ||
    lower.includes("stack trace") ||
    lower.includes("private_key") ||
    lower.includes("api key") ||
    lower.includes("jwt secret") ||
    /bearer\s+[a-z0-9._-]+/i.test(trimmed) ||
    /https?:\/\/[^\s]+@[^\s]+/i.test(trimmed) ||
    trimmed.includes("\n    at ")
  ) {
    return null;
  }

  return trimmed;
}

function firstValidationMessage(details: unknown): string | null {
  if (!details || typeof details !== "object") {
    return null;
  }

  const fieldErrors = (details as { fieldErrors?: Record<string, string[] | undefined> })
    .fieldErrors;
  if (!fieldErrors) {
    return null;
  }

  for (const messages of Object.values(fieldErrors)) {
    const message = messages?.find((item) => item.trim());
    if (message) {
      return message;
    }
  }

  return null;
}
