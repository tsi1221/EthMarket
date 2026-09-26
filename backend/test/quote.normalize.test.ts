import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import axios from "axios";
import { normalizeTrueMarketsQuote, quoteProviderFailure } from "../src/services/quote.normalize.ts";
import { tradeQuoteRequestSchema } from "../src/validators/trading.validator.ts";
import {
  QUOTE_ONLY_NOTICE,
  QUOTE_RETRY_LABEL,
  QUOTE_UNREACHABLE_LABEL,
  isLiveTrueMarketsQuote,
  resolveQuoteFailure,
} from "../../mobile/src/utils/quotePresentation.ts";

const request = {
  base_asset: "BTC",
  quote_asset: "USDC",
  qty: "5",
  qty_unit: "quote" as const,
  side: "buy" as const,
};

test("successful quote maps the live True Markets fields and nothing else", () => {
  const quote = normalizeTrueMarketsQuote(request, {
    qty: "0.00005",
    price: "83926",
    access_token: "do-not-expose",
    private_key: { d: "do-not-expose" },
    signature: "do-not-expose",
  });

  assert.equal(quote.kind, "quote");
  assert.equal(quote.isTrade, false);
  assert.equal(quote.live, true);
  assert.equal(quote.source, "truemarkets");
  assert.equal(quote.notice, QUOTE_ONLY_NOTICE);
  assert.equal(quote.baseAsset, "BTC");
  assert.equal(quote.quoteAsset, "USDC");
  assert.equal(quote.side, "buy");
  assert.equal(quote.requestedQty, "5");
  assert.equal(quote.qtyUnit, "quote");
  assert.equal(quote.price, "83926");
  assert.equal(quote.estimatedBaseQty, "0.00005");
  assert.equal(quote.estimatedQuoteQty, null);
  assert.equal(quote.quoteId, null);
  assert.equal(quote.fee, null);
  assert.equal(quote.feeAsset, null);
  assert.equal(quote.expiresAt, null);
  assert.equal(quote.ttlSeconds, null);
  assert.equal(isLiveTrueMarketsQuote(quote), true);

  const serialized = JSON.stringify(quote);
  assert.equal(serialized.includes("do-not-expose"), false);
  assert.equal(serialized.includes("private_key"), false);
  assert.equal(serialized.includes("access_token"), false);
});

test("invalid amount is rejected before a quote is invented", () => {
  const invalid = tradeQuoteRequestSchema.safeParse({ ...request, qty: "0" });
  const blank = tradeQuoteRequestSchema.safeParse({ ...request, qty: "abc" });
  const valid = tradeQuoteRequestSchema.safeParse(request);

  assert.equal(invalid.success, false);
  assert.equal(blank.success, false);
  assert.equal(valid.success, true);
});

test("True Markets errors stay errors", () => {
  const unavailable = quoteProviderFailure({ timedOut: false, responded: false });
  assert.equal(unavailable.statusCode, 503);
  assert.match(unavailable.message, /temporarily unavailable/i);

  const provider = quoteProviderFailure({
    timedOut: false,
    responded: true,
    status: 502,
    bodyMessage: "Venue rejected the quote",
  });
  assert.equal(provider.statusCode, 502);
  assert.match(provider.message, /live quote|try again/i);
  assert.equal(provider.message.toLowerCase().includes("internal server error"), false);
  assert.equal(provider.message.includes("Venue rejected"), false);

  const unsupported = quoteProviderFailure({
    timedOut: false,
    responded: true,
    status: 400,
    bodyMessage: "Unknown asset XYZ",
  });
  assert.equal(unsupported.statusCode, 400);
  assert.match(unsupported.message, /not supported for trading/i);

  const internal = resolveQuoteFailure({
    error: new Error("Internal Server Error"),
    backendUnreachable: false,
  });
  assert.equal(internal.title, "Live quote unavailable");
  assert.equal(internal.message, QUOTE_RETRY_LABEL);
  assert.equal(internal.useSampleData, false);
  assert.equal(internal.message.toLowerCase().includes("internal server error"), false);

  const axiosErr = new axios.AxiosError("Request failed");
  axiosErr.response = {
    status: 500,
    data: { error: "Internal Server Error" },
    statusText: "Internal Server Error",
    headers: {},
    config: { headers: new axios.AxiosHeaders() },
  };
  const axiosInternal = resolveQuoteFailure({
    error: axiosErr,
    backendUnreachable: false,
  });
  assert.equal(axiosInternal.title, "Live quote unavailable");
  assert.equal(axiosInternal.message, QUOTE_RETRY_LABEL);
  assert.equal(axiosInternal.message.toLowerCase().includes("internal server error"), false);

  const unsupportedUi = resolveQuoteFailure({
    error: Object.assign(
      new Error("This asset is currently not supported for trading through True Markets."),
      {},
    ),
    backendUnreachable: false,
  });
  assert.equal(unsupportedUi.title, "Trading unavailable");
  assert.match(unsupportedUi.message, /not supported for trading/i);

  const marketDown = new axios.AxiosError("Bad Gateway");
  marketDown.response = {
    status: 503,
    data: { error: "Live market data is temporarily unavailable." },
    statusText: "Service Unavailable",
    headers: {},
    config: { headers: new axios.AxiosHeaders() },
  };
  const marketUi = resolveQuoteFailure({ error: marketDown, backendUnreachable: false });
  assert.equal(marketUi.title, "Market data temporarily unavailable");
  assert.equal(marketUi.message, "Live market data is temporarily unavailable.");
});

test("backend unavailable does not fall back to a sample quote", () => {
  const offline = resolveQuoteFailure({
    error: new axios.AxiosError("refused"),
    backendUnreachable: false,
  });
  assert.equal(offline.message, QUOTE_UNREACHABLE_LABEL);
  assert.equal(offline.useSampleData, false);

  const flagged = resolveQuoteFailure({ error: null, backendUnreachable: true });
  assert.equal(flagged.message, QUOTE_UNREACHABLE_LABEL);
  assert.equal(flagged.useSampleData, false);

  const generic = resolveQuoteFailure({
    error: new Error("Something went wrong. Please try again."),
    backendUnreachable: false,
  });
  assert.equal(generic.message, QUOTE_RETRY_LABEL);
  assert.equal(generic.useSampleData, false);
});

test("missing quote fields stay null", () => {
  const quote = normalizeTrueMarketsQuote(request, { price: "83926" });

  assert.equal(quote.price, "83926");
  assert.equal(quote.quoteId, null);
  assert.equal(quote.estimatedBaseQty, null);
  assert.equal(quote.estimatedQuoteQty, null);
  assert.equal(quote.fee, null);
  assert.equal(quote.expiresAt, null);
  assert.equal(quote.ttlSeconds, null);
  assert.deepEqual(quote.issues, []);
});

test("optional True Markets quote fields are kept when present", () => {
  const quote = normalizeTrueMarketsQuote(request, {
    quote: {
      quote_id: "quote-123",
      price: "100",
      base_qty: "0.01",
      quote_qty: "5",
      fee: "0.02",
      fee_asset: "USDC",
      expires_at: "2026-09-25T21:00:00.000Z",
      ttl_seconds: 30,
      issues: [{ message: "Insufficient balance" }],
    },
  });

  assert.equal(quote.quoteId, "quote-123");
  assert.equal(quote.estimatedBaseQty, "0.01");
  assert.equal(quote.estimatedQuoteQty, "5");
  assert.equal(quote.fee, "0.02");
  assert.equal(quote.feeAsset, "USDC");
  assert.equal(quote.expiresAt, "2026-09-25T21:00:00.000Z");
  assert.equal(quote.ttlSeconds, 30);
  assert.deepEqual(quote.issues, ["Insufficient balance"]);
});

test("no True Markets credentials are exposed to the frontend", () => {
  const files = [
    "api/trading.ts",
    "hooks/useTradeQuote.ts",
    "screens/BuyAssetScreen.tsx",
    "utils/quotePresentation.ts",
  ];
  const mobileSrc = path.resolve("..", "mobile", "src");

  for (const file of files) {
    const source = readFileSync(path.join(mobileSrc, file), "utf8");
    assert.equal(source.includes("api.truemarkets.co"), false, file);
    assert.equal(source.includes("private_key"), false, file);
    assert.equal(source.includes("TM_KEY_FILE"), false, file);
    assert.equal(source.includes("access_token"), false, file);
    assert.equal(source.includes("/v1/auth/"), false, file);
    assert.equal(source.includes("/v1/conductor/orders"), false, file);
  }

  const trading = readFileSync(path.join(mobileSrc, "api/trading.ts"), "utf8");
  assert.equal(trading.includes('"/trading/quote"'), true);
});
