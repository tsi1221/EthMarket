import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { after, before, test } from "node:test";
import mongoose from "mongoose";

process.env.NODE_ENV = "test";

type AppModule = typeof import("../src/app.ts");
type DbModule = typeof import("../src/config/db.ts");
type UserModule = typeof import("../src/models/user.model.ts");
type WatchlistModule = typeof import("../src/models/watchlist.model.ts");

let createApp: AppModule["createApp"];
let connectDatabase: DbModule["connectDatabase"];
let disconnectDatabase: DbModule["disconnectDatabase"];
let User: UserModule["User"];
let Watchlist: WatchlistModule["Watchlist"];

async function loadApp() {
  const appModule = await import("../src/app.ts");
  const dbModule = await import("../src/config/db.ts");
  const userModule = await import("../src/models/user.model.ts");
  const watchlistModule = await import("../src/models/watchlist.model.ts");
  createApp = appModule.createApp;
  connectDatabase = dbModule.connectDatabase;
  disconnectDatabase = dbModule.disconnectDatabase;
  User = userModule.User;
  Watchlist = watchlistModule.Watchlist;
}

let server: Server;
let baseUrl = "";
const email = `audit-${Date.now()}@marketplace.test`;
const otherEmail = `audit-other-${Date.now()}@marketplace.test`;
const password = "AuditPass123";
let token = "";
let otherToken = "";

function tradingCredentialsConfigured(): boolean {
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

async function request(
  path: string,
  init: RequestInit = {},
): Promise<{ status: number; body: Record<string, unknown> }> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const text = await response.text();
  const body = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  return { status: response.status, body };
}

before(async () => {
  await loadApp();
  await connectDatabase();
  const app = createApp();
  server = createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (mongoose.connection.readyState === 1) {
    const users = await User.find({ email: { $in: [email, otherEmail] } }).select("_id");
    const ids = users.map((user) => user._id);
    if (ids.length > 0) {
      await Watchlist.deleteMany({ userId: { $in: ids } });
      await User.deleteMany({ _id: { $in: ids } });
    }
  }
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await disconnectDatabase();
});

test("health returns ok", async () => {
  const { status, body } = await request("/api/health");
  assert.equal(status, 200);
  assert.equal(body.status, "ok");
  assert.equal("mongodb" in body, false);
  assert.equal("uri" in body, false);
});

test("cors allows configured local origins and rejects unknown browsers", async () => {
  const allowed = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: "http://localhost:8081" },
  });
  assert.equal(allowed.status, 200);
  assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:8081");

  const denied = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: "https://evil.example" },
  });
  assert.equal(denied.headers.get("access-control-allow-origin"), null);
});

test("database health reports connection state without secrets", async () => {
  const { status, body } = await request("/api/health/db");
  const serialized = JSON.stringify(body);
  assert.equal(serialized.toLowerCase().includes("mongodb"), false);
  assert.equal(serialized.includes("@"), false);

  if (mongoose.connection.readyState === 1) {
    assert.equal(status, 200);
    assert.deepEqual(body, { status: "ok", database: "connected" });
    return;
  }

  assert.equal(status, 503);
  assert.deepEqual(body, { status: "error", database: "disconnected" });
});

test("register rejects an invalid email", async () => {
  const { status, body } = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Ada", email: "not-an-email", password: password }),
  });
  assert.equal(status, 400);
  assert.equal(body.error, "Validation failed");
});

test("protected routes reject a missing token", async () => {
  const me = await request("/api/auth/me");
  const watchlist = await request("/api/watchlist");
  const orders = await request("/api/trading/orders");
  assert.equal(me.status, 401);
  assert.equal(watchlist.status, 401);
  assert.equal(orders.status, 401);
});

test("trading capabilities do not claim orders are enabled without credentials", async () => {
  const { status, body } = await request("/api/trading/capabilities");
  assert.equal(status, 200);
  assert.equal(typeof body.quotesEnabled, "boolean");
  assert.equal(typeof body.ordersEnabled, "boolean");
  assert.equal(typeof body.message, "string");
  // Review-only default: orders stay off even when quote credentials exist.
  assert.equal(body.ordersEnabled, false);
  if (!tradingCredentialsConfigured()) {
    assert.equal(body.quotesEnabled, false);
  } else {
    assert.equal(body.quotesEnabled, true);
  }
});

test("register, login, profile update, and wrong password", async (t) => {
  if (mongoose.connection.readyState !== 1) {
    t.skip("MongoDB is not connected");
    return;
  }

  const registered = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Audit User", email, password }),
  });
  assert.equal(registered.status, 201);
  const registeredUser = registered.body.user as { name?: string; email?: string };
  assert.equal(registeredUser.email, email);
  assert.equal(typeof registered.body.token, "string");
  assert.equal("password" in (registered.body.user as object), false);
  assert.equal("passwordHash" in (registered.body.user as object), false);

  const duplicate = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Audit User", email, password }),
  });
  assert.equal(duplicate.status, 409);

  const badLogin = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: "wrong-password" }),
  });
  assert.equal(badLogin.status, 401);

  const login = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  assert.equal(login.status, 200);
  token = String(login.body.token);

  const me = await request("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(me.status, 200);

  const renamed = await request("/api/auth/me", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: "A" }),
  });
  assert.equal(renamed.status, 400);

  const updated = await request("/api/auth/me", {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name: "Updated Audit" }),
  });
  assert.equal(updated.status, 200);
  assert.equal((updated.body.user as { name?: string }).name, "Updated Audit");
});

test("watchlist is stored per user", async (t) => {
  if (!token || mongoose.connection.readyState !== 1) {
    t.skip("Auth user was not created");
    return;
  }

  const auth = { Authorization: `Bearer ${token}` };
  const toggled = await request("/api/watchlist/toggle", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ symbol: "btc" }),
  });
  assert.equal(toggled.status, 200);
  assert.deepEqual(toggled.body.symbols, ["BTC"]);
  assert.equal(toggled.body.watched, true);

  const again = await request("/api/watchlist/toggle", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ symbol: "BTC" }),
  });
  assert.deepEqual(again.body.symbols, []);

  await request("/api/watchlist/toggle", {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ symbol: "ETH" }),
  });

  const other = await request("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name: "Other User", email: otherEmail, password }),
  });
  assert.equal(other.status, 201);
  otherToken = String(other.body.token);

  const otherList = await request("/api/watchlist", {
    headers: { Authorization: `Bearer ${otherToken}` },
  });
  assert.equal(otherList.status, 200);
  assert.deepEqual(otherList.body.symbols, []);
});

test("quote validation and unconfigured trading stay honest", { timeout: 30_000 }, async (t) => {
  if (!token) {
    t.skip("Auth user was not created");
    return;
  }

  const invalid = await request("/api/trading/quote", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      base_asset: "BTC",
      quote_asset: "USDC",
      qty: "0",
      qty_unit: "quote",
      side: "buy",
    }),
  });
  assert.equal(invalid.status, 400);

  const quote = await request("/api/trading/quote", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      base_asset: "BTC",
      quote_asset: "USDC",
      qty: "5",
      qty_unit: "quote",
      side: "buy",
    }),
  });

  if (!tradingCredentialsConfigured()) {
    assert.equal(quote.status, 503);
    assert.match(String(quote.body.error), /not configured/i);
    return;
  }

  assert.equal(quote.status, 200);
  const payload = quote.body.quote as {
    kind?: string;
    isTrade?: boolean;
    live?: boolean;
    source?: string;
    notice?: string;
    price?: string | null;
    estimatedBaseQty?: string | null;
    quoteId?: string | null;
    fee?: string | null;
    expiresAt?: string | null;
  };
  assert.equal(payload.kind, "quote");
  assert.equal(payload.isTrade, false);
  assert.equal(payload.live, true);
  assert.equal(payload.source, "truemarkets");
  assert.equal(payload.notice, "This is a quote only. No trade has been placed.");
  assert.match(String(payload.price), /^\d+(\.\d+)?$/);
  assert.match(String(payload.estimatedBaseQty), /^\d+(\.\d+)?$/);
  assert.ok(payload.quoteId === null || typeof payload.quoteId === "string");
  assert.ok(payload.fee === null || typeof payload.fee === "string");
  assert.ok(payload.expiresAt === null || typeof payload.expiresAt === "string");
  const serialized = JSON.stringify(quote.body);
  assert.equal(serialized.includes("private_key"), false);
  assert.equal(serialized.includes("access_token"), false);
  assert.equal(serialized.includes("refresh_token"), false);
  assert.equal(serialized.toLowerCase().includes("bearer "), false);
});

test("passwords are hashed and quote requests are not faked", async () => {
  const { hashPassword, comparePassword } = await import("../src/utils/password.ts");
  const { requestTradeQuote } = await import("../src/services/trading.service.ts");
  const { AppError } = await import("../src/utils/errors.ts");

  const hash = await hashPassword("AuditPass123");
  assert.notEqual(hash, "AuditPass123");
  assert.equal(hash.startsWith("$2"), true);
  assert.equal(await comparePassword("AuditPass123", hash), true);
  assert.equal(await comparePassword("wrong-password", hash), false);

  if (tradingCredentialsConfigured()) {
    return;
  }

  await assert.rejects(
    () =>
      requestTradeQuote({
        base_asset: "BTC",
        quote_asset: "USDC",
        qty: "25",
        qty_unit: "quote",
        side: "buy",
      }),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 503);
      assert.match(error.message, /not configured/i);
      return true;
    },
  );
});

test("loads one True Markets asset without inventing a price", { timeout: 30_000 }, async () => {
  const { status, body } = await request("/api/markets/BTC");
  assert.equal(status, 200);
  const asset = body.asset as { symbol?: string; name?: string; price?: number | null };
  assert.equal(asset.symbol, "BTC");
  assert.equal(typeof asset.name, "string");
  assert.ok(asset.price === null || typeof asset.price === "number");
});
