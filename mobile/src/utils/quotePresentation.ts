import { isUnreachableError, getErrorMessage, getErrorStatus } from "../api/errors";
import { t } from "../i18n/translate";
import type { NormalizedTradeQuote } from "../types/trading";

/** English literals for backend/tests; UI should call t() at render time. */
export const QUOTE_ONLY_NOTICE =
  "This is a quote only. No trade has been placed.";
export const QUOTE_LOADING_LABEL = "Getting live quote...";
export const QUOTE_RETRY_LABEL =
  "Unable to retrieve a live quote right now. Please try again.";
export const QUOTE_UNREACHABLE_LABEL =
  "Unable to connect. Please check your connection and try again.";

export type QuoteFailureCode =
  | "live_unavailable"
  | "asset_unavailable"
  | "session_expired"
  | "market_unavailable"
  | "connection"
  | "rate_limit"
  | "permission"
  | "invalid";

export type QuoteFailure = {
  code: QuoteFailureCode;
  title: string;
  message: string;
  useSampleData: false;
};

export function isLiveTrueMarketsQuote(value: unknown): value is NormalizedTradeQuote {
  if (!value || typeof value !== "object") {
    return false;
  }

  const quote = value as Partial<NormalizedTradeQuote>;
  return (
    quote.kind === "quote" &&
    quote.isTrade === false &&
    quote.live === true &&
    quote.source === "truemarkets" &&
    typeof quote.baseAsset === "string" &&
    typeof quote.quoteAsset === "string" &&
    typeof quote.requestedQty === "string" &&
    (quote.side === "buy" || quote.side === "sell") &&
    (quote.qtyUnit === "quote" || quote.qtyUnit === "base")
  );
}

export function formatQuoteAmount(value: string): string {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return value;
  }

  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 8 }).format(numeric);
}

export function quoteUsdcAmount(quote: NormalizedTradeQuote): string | null {
  if (quote.estimatedQuoteQty) {
    return `${formatQuoteAmount(quote.estimatedQuoteQty)} ${quote.quoteAsset}`;
  }
  if (quote.qtyUnit === "quote") {
    return `${formatQuoteAmount(quote.requestedQty)} ${quote.quoteAsset}`;
  }
  return null;
}

export function quoteBtcAmount(quote: NormalizedTradeQuote): string | null {
  if (!quote.estimatedBaseQty) {
    return null;
  }
  return `${formatQuoteAmount(quote.estimatedBaseQty)} ${quote.baseAsset}`;
}

export function quotePriceLabel(quote: NormalizedTradeQuote): string | null {
  if (!quote.price) {
    return null;
  }
  return `${formatQuoteAmount(quote.price)} ${quote.quoteAsset}`;
}

export function quoteFeeLabel(quote: NormalizedTradeQuote): string | null {
  if (!quote.fee) {
    return null;
  }
  return quote.feeAsset ? `${formatQuoteAmount(quote.fee)} ${quote.feeAsset}` : formatQuoteAmount(quote.fee);
}

export function quoteExpiryLabel(quote: NormalizedTradeQuote): string | null {
  if (quote.expiresAt) {
    const date = new Date(quote.expiresAt);
    if (Number.isNaN(date.getTime())) {
      return quote.expiresAt;
    }
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (quote.ttlSeconds !== null && quote.ttlSeconds !== undefined) {
    return t("quote.expiresIn", { seconds: quote.ttlSeconds });
  }

  return null;
}

function looksLikeUnsupportedAsset(message: string | null | undefined): boolean {
  if (!message) {
    return false;
  }
  const lower = message.toLowerCase();
  return (
    lower.includes("not currently supported") ||
    lower.includes("not supported for live trading") ||
    lower.includes("not supported") ||
    lower.includes("unsupported asset") ||
    lower.includes("unknown asset") ||
    lower.includes("invalid asset") ||
    lower.includes("asset not found") ||
    lower.includes("trading unavailable") ||
    lower.includes("not valid for trading")
  );
}

function failureFromCode(code: QuoteFailureCode): QuoteFailure {
  return {
    code,
    title: t(`quote.fail.${code}.title`),
    message: t(`quote.fail.${code}.message`),
    useSampleData: false,
  };
}

export function resolveQuoteFailure(input: {
  error: unknown;
  backendUnreachable: boolean;
}): QuoteFailure {
  if (input.backendUnreachable || isUnreachableError(input.error)) {
    return failureFromCode("connection");
  }

  const status = getErrorStatus(input.error);
  const serverMessage = getErrorMessage(input.error);

  if (status === 401 || status === 403) {
    return failureFromCode(status === 403 ? "permission" : "session_expired");
  }

  if (status === 429) {
    return failureFromCode("rate_limit");
  }

  if (status === 502 || status === 503 || status === 504) {
    return failureFromCode("market_unavailable");
  }

  if (status === 404 || looksLikeUnsupportedAsset(serverMessage)) {
    return failureFromCode("asset_unavailable");
  }

  if (status === 400 || status === 422) {
    if (looksLikeUnsupportedAsset(serverMessage)) {
      return failureFromCode("asset_unavailable");
    }
    return failureFromCode("invalid");
  }

  if (status !== null && status >= 500) {
    return failureFromCode("live_unavailable");
  }

  if (
    !serverMessage ||
    serverMessage.toLowerCase().includes("internal server error") ||
    serverMessage === t("error.generic") ||
    serverMessage === t("error.server") ||
    serverMessage === QUOTE_RETRY_LABEL
  ) {
    return failureFromCode("live_unavailable");
  }

  if (looksLikeUnsupportedAsset(serverMessage)) {
    return failureFromCode("asset_unavailable");
  }

  if (serverMessage.toLowerCase().includes("sign in") || serverMessage === t("auth.sessionExpired")) {
    return failureFromCode("session_expired");
  }

  if (
    serverMessage.toLowerCase().includes("temporarily unavailable") ||
    serverMessage === t("error.marketUnavailable")
  ) {
    return failureFromCode("market_unavailable");
  }

  return failureFromCode("live_unavailable");
}
