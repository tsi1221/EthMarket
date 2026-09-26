import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import axios from "axios";
import { quoteProviderFailure } from "../src/services/quote.normalize.ts";
import { requestTradeQuote } from "../src/services/trading.service.ts";
import { AppError } from "../src/utils/errors.ts";
import { getErrorMessage } from "../../mobile/src/api/errors.ts";
import {
  QUOTE_RETRY_LABEL,
  QUOTE_UNREACHABLE_LABEL,
  resolveQuoteFailure,
} from "../../mobile/src/utils/quotePresentation.ts";

function hasCreds(): boolean {
  const candidates = [process.env.TM_KEY_FILE, process.env.TRUE_MARKETS_KEY_FILE];
  if (
    candidates.some((value) => {
      const trimmed = value?.trim();
      if (!trimmed) {
        return false;
      }
      const resolved = path.isAbsolute(trimmed) ? trimmed : path.resolve(process.cwd(), trimmed);
      return existsSync(resolved);
    })
  ) {
    return true;
  }
  return Boolean(process.env.TRUE_MARKETS_KEY_ID && process.env.TRUE_MARKETS_PRIVATE_KEY);
}

function assertNoInternal(text: string, label: string) {
  assert.equal(
    text.toLowerCase().includes("internal server error"),
    false,
    `${label}: ${text}`,
  );
}

test("UI never surfaces Internal Server Error", () => {
  const internal = resolveQuoteFailure({
    error: new Error("Internal Server Error"),
    backendUnreachable: false,
  });
  assert.equal(internal.title, "Live quote unavailable");
  assert.equal(internal.message, QUOTE_RETRY_LABEL);
  assertNoInternal(`${internal.title} ${internal.message}`, "plain");

  const axios500 = new axios.AxiosError("fail");
  axios500.response = {
    status: 500,
    data: { error: "Internal Server Error" },
    statusText: "Internal Server Error",
    headers: {},
    config: { headers: new axios.AxiosHeaders() },
  };
  const mapped = resolveQuoteFailure({ error: axios500, backendUnreachable: false });
  assert.equal(mapped.title, "Live quote unavailable");
  assert.equal(mapped.message, QUOTE_RETRY_LABEL);
  assertNoInternal(getErrorMessage(axios500), "axios body");
});

test("unsupported asset maps to Trading unavailable", () => {
  const failure = quoteProviderFailure({
    timedOut: false,
    responded: true,
    status: 400,
    bodyMessage: "Unknown asset NOTAREAL",
  });
  assert.equal(failure.statusCode, 400);
  assert.match(failure.message, /not supported for trading/i);
  const ui = resolveQuoteFailure({
    error: new Error(failure.message),
    backendUnreachable: false,
  });
  assert.equal(ui.title, "Trading unavailable");
  assert.equal(
    ui.message,
    "This asset is currently not supported for trading through True Markets.",
  );
});

test("backend unavailable stays an error with Try Again copy", () => {
  const ui = resolveQuoteFailure({ error: null, backendUnreachable: true });
  assert.equal(ui.title, "Live quote unavailable");
  assert.equal(ui.message, QUOTE_UNREACHABLE_LABEL);
  assert.equal(ui.useSampleData, false);
});

test("successful BTC/USDC live quote preserves live:true", { timeout: 30_000 }, async (t) => {
  if (!hasCreds()) {
    t.skip("True Markets credentials not configured");
    return;
  }

  const quote = await requestTradeQuote({
    base_asset: "BTC",
    quote_asset: "USDC",
    qty: "5",
    qty_unit: "quote",
    side: "buy",
  });

  assert.equal(quote.live, true);
  assert.equal(quote.source, "truemarkets");
  assert.equal(quote.isTrade, false);
  assert.match(String(quote.price), /^\d/);
  const serialized = JSON.stringify(quote);
  assert.equal(serialized.includes("private_key"), false);
  assert.equal(serialized.includes("access_token"), false);
  assertNoInternal(serialized, "btc quote");
});

test("unsupported live asset does not invent prices", { timeout: 30_000 }, async (t) => {
  if (!hasCreds()) {
    t.skip("True Markets credentials not configured");
    return;
  }

  await assert.rejects(
    () =>
      requestTradeQuote({
        base_asset: "NOTAREALASSETXYZ",
        quote_asset: "USDC",
        qty: "5",
        qty_unit: "quote",
        side: "buy",
      }),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assertNoInternal(error.message, "unsupported live");
      const ui = resolveQuoteFailure({
        error: new Error(error.message),
        backendUnreachable: false,
      });
      assert.equal(ui.useSampleData, false);
      assertNoInternal(`${ui.title} ${ui.message}`, "unsupported ui");
      return true;
    },
  );
});
