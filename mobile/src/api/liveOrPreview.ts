import { logApi } from "../config/apiLog";
import { useBackendStatus } from "../store/backendStatus";
import { isUnreachableError } from "./errors";
import { checkBackendHealth } from "./health";

/**
 * Calls the real API. Sample data is used only when the server cannot be reached.
 * HTTP responses, including 400/401/403/500, mean the backend is up and are not replaced with samples.
 */
export async function liveOrPreview<T>(
  request: () => Promise<T>,
  preview: () => T,
): Promise<T> {
  if (useBackendStatus.getState().status === "unavailable") {
    logApi("[API] Backend unavailable");
    logApi("[API] Falling back to sample data");
    return preview();
  }

  try {
    const data = await request();
    useBackendStatus.getState().setStatus("live");
    logApi("[API] Using live backend data");
    return data;
  } catch (error) {
    if (!isUnreachableError(error)) {
      useBackendStatus.getState().setStatus("live");
      throw error;
    }

    const reachable = await checkBackendHealth();
    if (reachable) {
      throw error;
    }

    logApi("[API] Falling back to sample data");
    return preview();
  }
}
