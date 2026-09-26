import { existsSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import dotenv from "dotenv";

const envPath = [path.resolve(process.cwd(), ".env"), path.resolve(process.cwd(), "backend", ".env")].find(
  (candidate) => existsSync(candidate),
);
dotenv.config(envPath ? { path: envPath } : undefined);

const emptyToUndefined = (value: unknown) =>
  value === "" || value === undefined ? undefined : value;

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  JWT_SECRET: z.preprocess(
    emptyToUndefined,
    z.string({ required_error: "JWT_SECRET is required" }).min(16),
  ),
  JWT_EXPIRES_IN: z.string().default("7d"),
  JWT_ISSUER: z.string().default("marketplace-api"),
  JWT_AUDIENCE: z.string().default("marketplace-mobile"),
  /**
   * Comma-separated browser origins allowed by CORS.
   * Example: http://localhost:8081,https://app.example.com
   * Falls back to CLIENT_ORIGIN when unset.
   */
  CORS_ORIGINS: z.preprocess(emptyToUndefined, z.string().optional()),
  /** @deprecated Prefer CORS_ORIGINS. Kept for local .env compatibility. */
  CLIENT_ORIGIN: z.preprocess(emptyToUndefined, z.string().optional()),
  TRUE_MARKETS_API_URL: z.string().url().default("https://api.truemarkets.co"),
  TRUE_MARKETS_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
  TM_KEY_FILE: z.preprocess(emptyToUndefined, z.string().optional()),
  TRUE_MARKETS_KEY_FILE: z.preprocess(emptyToUndefined, z.string().optional()),
  TRUE_MARKETS_KEY_ID: z.preprocess(emptyToUndefined, z.string().optional()),
  TRUE_MARKETS_PRIVATE_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  PORTFOLIO_SOURCE: z.enum(["demo", "true_markets"]).default("demo"),
  /**
   * When false (default), quotes stay available but POST /api/trading/orders is rejected.
   * Keep aligned with the mobile review-only Confirm flow until live orders are verified.
   */
  ORDER_EXECUTION_ENABLED: z
    .preprocess((value) => {
      if (value === undefined || value === "") {
        return false;
      }
      if (typeof value === "boolean") {
        return value;
      }
      const normalized = String(value).trim().toLowerCase();
      return normalized === "1" || normalized === "true" || normalized === "yes";
    }, z.boolean())
    .default(false),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.parse(process.env);

if (!parsed.MONGODB_URI) {
  console.error("[db] MONGODB_URI is not configured");
}

if (parsed.NODE_ENV === "production" && !parsed.MONGODB_URI) {
  throw new Error("MONGODB_URI is required in production.");
}

if (
  parsed.NODE_ENV === "production" &&
  (parsed.JWT_SECRET.length < 32 ||
    parsed.JWT_SECRET === "change_this_to_a_long_random_secret_key")
) {
  throw new Error("JWT_SECRET must be a unique value of at least 32 characters in production.");
}

export const env: Env = parsed;

const DEFAULT_DEV_ORIGINS = ["http://localhost:8081", "http://127.0.0.1:8081"];

export function parseCorsOrigins(
  raw: string | undefined,
  nodeEnv: Env["NODE_ENV"],
): string[] {
  const configured = (raw ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured.length > 0) {
    return configured;
  }

  if (nodeEnv === "production") {
    throw new Error(
      "CORS_ORIGINS is required in production. Set a comma-separated list of HTTPS web origins.",
    );
  }

  return DEFAULT_DEV_ORIGINS;
}

/** Resolved browser origins for CORS. Never logs the raw env string in callers. */
export function resolveCorsOrigins(): string[] {
  return parseCorsOrigins(env.CORS_ORIGINS ?? env.CLIENT_ORIGIN, env.NODE_ENV);
}
