import assert from "node:assert/strict";
import test from "node:test";
import { parseCorsOrigins } from "../src/config/env.ts";

test("parseCorsOrigins keeps local development defaults", () => {
  assert.deepEqual(parseCorsOrigins(undefined, "development"), [
    "http://localhost:8081",
    "http://127.0.0.1:8081",
  ]);
});

test("parseCorsOrigins accepts comma-separated origins", () => {
  assert.deepEqual(
    parseCorsOrigins("http://localhost:8081, https://app.example.com", "production"),
    ["http://localhost:8081", "https://app.example.com"],
  );
});

test("parseCorsOrigins requires configuration in production", () => {
  assert.throws(() => parseCorsOrigins("", "production"), /CORS_ORIGINS is required/);
});
