import axios from "axios";
import { logApi } from "../config/apiLog";
import { env } from "../config/env";
import { getAuthToken } from "../storage/secureStorage";

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

function requestLabel(method: string | undefined, url: string | undefined): string {
  const verb = (method ?? "get").toUpperCase();
  const path = url?.startsWith("http") ? url : `/api${url ?? ""}`;
  return `${verb} ${path}`;
}

apiClient.interceptors.request.use(async (config) => {
  const token = await getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  logApi(`[API] ${requestLabel(config.method, config.url)}`);
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    logApi(
      `[API] ${response.status} ${requestLabel(response.config.method, response.config.url)}`,
    );
    return response;
  },
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status ?? "no-response";
      logApi(`[API] ${status} ${requestLabel(error.config?.method, error.config?.url)}`);

      const path = error.config?.url ?? "";
      const isAuthCredentialCall =
        path.includes("/auth/login") || path.includes("/auth/register");

      if (error.response?.status === 401 && !isAuthCredentialCall) {
        void import("../store/authStore").then(({ useAuthStore }) => {
          const state = useAuthStore.getState();
          if (state.token) {
            void state.expireSession(
              "Your session has expired. Please sign in again.",
            );
          }
        });
      }
    }
    return Promise.reject(error);
  },
);
