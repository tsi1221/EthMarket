import { logApi } from "../config/apiLog";
import { useBackendStatus } from "../store/backendStatus";
import { apiClient } from "./client";
import { isUnreachableError } from "./errors";

type HealthBody = {
  status?: unknown;
};

/** GET /api/health. A response means the backend is reachable. Only a missing response marks it unavailable. */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await apiClient.get<HealthBody>("/health", { timeout: 5_000 });
    const ok = response.status === 200 && response.data?.status === "ok";
    useBackendStatus.getState().setStatus("live");
    logApi(ok ? "[API] Backend available" : "[API] Backend reachable");
    if (ok) {
      logApi("[API] Using live backend data");
    }
    return true;
  } catch (error) {
    if (!isUnreachableError(error)) {
      useBackendStatus.getState().setStatus("live");
      logApi("[API] Backend reachable");
      return true;
    }

    useBackendStatus.getState().setStatus("unavailable");
    logApi("[API] Backend unavailable");
    return false;
  }
}
