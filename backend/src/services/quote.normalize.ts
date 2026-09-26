import type { NormalizedTradeQuote, TradeQuoteRequest } from "../types/trading";

export const QUOTE_NOTICE = "This is a quote only. No trade has been placed.";

export function asText(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return null;
}

export function collectIssues(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (typeof item === "string" && item.trim()) {
      return [item.trim()];
    }
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      return [asText(record.message) ?? asText(record.code)].filter(
        (issue): issue is string => Boolean(issue),
      );
    }
    return [];
  });
}

function unwrapQuote(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== "object") {
    return {};
  }

  const record = data as Record<string, unknown>;
  if (record.quote && typeof record.quote === "object" && !Array.isArray(record.quote)) {
    return record.quote as Record<string, unknown>;
  }
  if (record.data && typeof record.data === "object" && !Array.isArray(record.data)) {
    return record.data as Record<string, unknown>;
  }
  return record;
}

function asAmount(value: unknown): string | null {
  const direct = asText(value);
  if (direct) {
    return direct;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return asText(record.amount) ?? asText(record.value);
  }
  return null;
}

function asTtlSeconds(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return value;
  }
  if (typeof value === "string" && /^\d+(\.\d+)?$/.test(value.trim())) {
    return Number(value.trim());
  }
  return null;
}

/**
 * Maps a True Markets quote body onto the fields it actually sent.
 * The live conductor/gateway quote currently returns only `qty` (base amount) and `price`.
 */
export function normalizeTrueMarketsQuote(
  request: TradeQuoteRequest,
  data: unknown,
): NormalizedTradeQuote {
  const raw = unwrapQuote(data);
  const explicitBase =
    asText(raw.base_qty) ??
    asText(raw.base_quantity) ??
    asText(raw.baseAmount) ??
    asText(raw.qty_out);
  const ttlSeconds =
    asTtlSeconds(raw.expires_in) ??
    asTtlSeconds(raw.expires_in_seconds) ??
    asTtlSeconds(raw.ttl_seconds) ??
    asTtlSeconds(raw.ttl);

  return {
    kind: "quote",
    isTrade: false,
    live: true,
    source: "truemarkets",
    notice: QUOTE_NOTICE,
    quoteId: asText(raw.quote_id) ?? asText(raw.quoteId) ?? asText(raw.id),
    side: request.side,
    baseAsset: request.base_asset,
    quoteAsset: request.quote_asset,
    requestedQty: request.qty,
    qtyUnit: request.qty_unit,
    price: asText(raw.price) ?? asText(raw.rate) ?? asText(raw.effective_price),
    estimatedBaseQty: explicitBase ?? asText(raw.qty),
    estimatedQuoteQty:
      asText(raw.quote_qty) ??
      asText(raw.quote_quantity) ??
      asText(raw.quoteAmount) ??
      asText(raw.quote_amount),
    fee: asAmount(raw.fee) ?? asAmount(raw.fee_amount) ?? asAmount(raw.fees),
    feeAsset: asText(raw.fee_asset) ?? asText(raw.feeAsset),
    expiresAt: asText(raw.expires_at) ?? asText(raw.expiry) ?? asText(raw.expiresAt),
    ttlSeconds,
    issues: collectIssues(raw.issues),
  };
}

export function quoteProviderFailure(input: {
  timedOut: boolean;
  responded: boolean;
  status?: number;
  bodyMessage?: string | null;
}): { statusCode: number; message: string } {
  const message = input.bodyMessage?.trim().toLowerCase() ?? "";

  if (input.timedOut) {
    return {
      statusCode: 504,
      message: "Market data is temporarily unavailable. Please try again in a moment.",
    };
  }

  if (!input.responded) {
    return {
      statusCode: 503,
      message: "Market data is temporarily unavailable. Please try again in a moment.",
    };
  }

  if (input.status === 401 || input.status === 403) {
    return {
      statusCode: 401,
      message: "Please sign in again to continue.",
    };
  }

  if (
    input.status === 402 ||
    message.includes("insufficient") ||
    message.includes("not enough") ||
    message.includes("balance")
  ) {
    return { statusCode: 409, message: "Insufficient funds to quote this trade." };
  }

  if (
    message.includes("invalid asset") ||
    message.includes("unknown asset") ||
    message.includes("unsupported asset") ||
    message.includes("not supported") ||
    message.includes("asset not found") ||
    message.includes("pair not") ||
    message.includes("market not")
  ) {
    return {
      statusCode: 400,
      message: "This asset is currently not supported for trading through True Markets.",
    };
  }

  if (message.includes("qty") || message.includes("quantity") || message.includes("size")) {
    return { statusCode: 400, message: "That quantity is not valid for this asset." };
  }

  if (input.status === 400 || input.status === 422 || input.status === 404) {
    return {
      statusCode: input.status === 404 ? 404 : 400,
      message:
        input.status === 404
          ? "This asset is currently not supported for trading through True Markets."
          : "This quote request is not valid. Check the amount and try again.",
    };
  }

  if (input.status === 429) {
    return {
      statusCode: 429,
      message: "Too many quote requests. Please try again in a moment.",
    };
  }

  if (input.status === 502 || input.status === 503 || input.status === 504) {
    return {
      statusCode: input.status,
      message: "Market data is temporarily unavailable. Please try again in a moment.",
    };
  }

  return {
    statusCode: 502,
    message: "Unable to retrieve a live quote right now. Please try again.",
  };
}
