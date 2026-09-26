import { createPrivateKey, sign, type JsonWebKey } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import axios from "axios";
import { env } from "../config/env";
import type { TrueMarketsTokenSet } from "../types/trading";
import { AppError } from "../utils/errors";

type KeyBundle = {
  keyId: string;
  privateKey: JsonWebKey;
};

type TokenCache = {
  tokens: TrueMarketsTokenSet | null;
};

const tokenCache: TokenCache = { tokens: null };
const AUTH_SKEW_MS = 15_000;

function resolveExistingKeyFile(value: string | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  const resolved = path.isAbsolute(trimmed) ? trimmed : path.resolve(process.cwd(), trimmed);
  return existsSync(resolved) ? resolved : null;
}

function configuredKeyFile(): string | null {
  return resolveExistingKeyFile(env.TM_KEY_FILE) ?? resolveExistingKeyFile(env.TRUE_MARKETS_KEY_FILE);
}

function loadKeyBundle(): KeyBundle {
  const keyFile = configuredKeyFile();

  try {
    if (keyFile) {
      const raw = readFileSync(keyFile, "utf8");
      const parsed = JSON.parse(raw) as {
        key_id?: string;
        private_key?: JsonWebKey;
      };

      if (!parsed.key_id || !parsed.private_key) {
        throw new AppError("True Markets key file is missing key_id or private_key.", 503);
      }

      return { keyId: parsed.key_id, privateKey: parsed.private_key };
    }

    if (env.TRUE_MARKETS_KEY_ID && env.TRUE_MARKETS_PRIVATE_KEY) {
      return {
        keyId: env.TRUE_MARKETS_KEY_ID,
        privateKey: JSON.parse(env.TRUE_MARKETS_PRIVATE_KEY) as JsonWebKey,
      };
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError("True Markets API key credentials could not be loaded.", 503);
  }

  throw new AppError(
    "True Markets trading is not configured. Add API key credentials on the server.",
    503,
  );
}

function signAuthPayload(keyId: string, timestamp: number, privateKey: JsonWebKey): string {
  const key = createPrivateKey({ key: privateKey, format: "jwk" });
  return sign("SHA256", Buffer.from(`${keyId}.${timestamp}`), {
    key,
    dsaEncoding: "ieee-p1363",
  }).toString("base64url");
}

function readExpiry(accessToken: string, expiresIn?: number): number {
  if (typeof expiresIn === "number" && Number.isFinite(expiresIn) && expiresIn > 0) {
    return Date.now() + expiresIn * 1000;
  }

  const payload = accessToken.split(".")[1];
  if (!payload) {
    return Date.now() + 4 * 60 * 1000;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      exp?: number;
    };
    if (typeof decoded.exp === "number") {
      return decoded.exp * 1000;
    }
  } catch {
    // Ignore malformed JWTs and use a short fallback window.
  }

  return Date.now() + 4 * 60 * 1000;
}

function toTokenSet(data: {
  access_token?: string;
  refresh_token?: string | null;
  expires_in?: number;
}): TrueMarketsTokenSet {
  if (!data.access_token) {
    throw new AppError("True Markets did not return an access token.", 502);
  }

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    expiresAt: readExpiry(data.access_token, data.expires_in),
  };
}

async function mintAccessToken(): Promise<TrueMarketsTokenSet> {
  const { keyId, privateKey } = loadKeyBundle();
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signAuthPayload(keyId, timestamp, privateKey);

  try {
    const { data } = await axios.post(
      `${env.TRUE_MARKETS_API_URL}/v1/auth/api-key/token`,
      { key_id: keyId, timestamp, signature },
      {
        timeout: env.TRUE_MARKETS_TIMEOUT_MS,
        headers: { Accept: "application/json", "Content-Type": "application/json" },
      },
    );

    return toTokenSet(data as { access_token?: string; refresh_token?: string; expires_in?: number });
  } catch (error) {
    if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
      throw new AppError("True Markets authentication timed out.", 504);
    }
    throw new AppError("Could not authenticate with True Markets.", 502);
  }
}

async function refreshAccessToken(refreshToken: string): Promise<TrueMarketsTokenSet> {
  const { data } = await axios.post(
    `${env.TRUE_MARKETS_API_URL}/v1/auth/token/refresh`,
    { refresh_token: refreshToken },
    {
      timeout: env.TRUE_MARKETS_TIMEOUT_MS,
      headers: { Accept: "application/json", "Content-Type": "application/json" },
    },
  );

  return toTokenSet(data as { access_token?: string; refresh_token?: string; expires_in?: number });
}

export function isTrueMarketsTradingConfigured(): boolean {
  return Boolean(
    configuredKeyFile() || (env.TRUE_MARKETS_KEY_ID && env.TRUE_MARKETS_PRIVATE_KEY),
  );
}

export function clearTrueMarketsTokens() {
  tokenCache.tokens = null;
}

export async function getTrueMarketsAccessToken(forceRefresh = false): Promise<string> {
  const cached = tokenCache.tokens;
  const stillValid = cached && cached.expiresAt - AUTH_SKEW_MS > Date.now();

  if (!forceRefresh && stillValid) {
    return cached.accessToken;
  }

  if (!forceRefresh && cached?.refreshToken) {
    try {
      tokenCache.tokens = await refreshAccessToken(cached.refreshToken);
      return tokenCache.tokens.accessToken;
    } catch {
      clearTrueMarketsTokens();
    }
  }

  tokenCache.tokens = await mintAccessToken();
  return tokenCache.tokens.accessToken;
}
