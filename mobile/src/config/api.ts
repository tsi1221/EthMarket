import { NativeModules, Platform } from "react-native";
import { logApi } from "./apiLog";

/**
 * Origin only, no /api suffix.
 *
 * Dev defaults (only when EXPO_PUBLIC_API_BASE_URL is unset):
 *   Web / iOS simulator → http://localhost:5000
 *   Android emulator    → http://10.0.2.2:5000
 *   Expo LAN device     → http://<Metro host>:5000
 *
 * Release / EAS builds must set EXPO_PUBLIC_API_BASE_URL to the HTTPS API origin.
 * Example: EXPO_PUBLIC_API_BASE_URL=https://api.example.com
 * Do not put secrets in this variable.
 */
function expoLanHost(): string | null {
  const scriptURL = NativeModules.SourceCode?.scriptURL as string | undefined;
  const host = scriptURL?.match(/https?:\/\/([^/:]+)/)?.[1]?.trim() ?? "";

  if (!host || host === "localhost" || host === "127.0.0.1") {
    return null;
  }

  return host;
}

function developmentApiBaseUrl(): string {
  if (Platform.OS === "web") {
    return "http://localhost:5000";
  }

  const lanHost = expoLanHost();
  if (lanHost) {
    return `http://${lanHost}:5000`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:5000";
  }

  return "http://localhost:5000";
}

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  return trimmed.replace(/\/api$/i, "");
}

const fromEnv =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
  "";

function resolveApiBaseUrl(): string {
  if (fromEnv) {
    return normalizeBaseUrl(fromEnv);
  }

  if (__DEV__) {
    return developmentApiBaseUrl();
  }

  logApi(
    "[API] EXPO_PUBLIC_API_BASE_URL is missing in this release build. Set it to your HTTPS API origin before shipping.",
  );
  // Intentionally invalid so the app shows unreachable/error states instead of a hardcoded LAN IP.
  return "https://api.invalid";
}

export const API_BASE_URL = resolveApiBaseUrl();
export const API_URL = `${API_BASE_URL}/api`;

logApi(`[API] Base URL: ${API_BASE_URL}`);
