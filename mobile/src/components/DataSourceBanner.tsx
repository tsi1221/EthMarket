import { LiveDataBadge, type LiveDataBadgeState } from "./LiveDataBadge";
import { useBackendStatus } from "../store/backendStatus";

type DataSourceBannerProps = {
  /** When the backend is reachable but this specific market request failed. */
  forceError?: boolean;
};

export function DataSourceBanner({ forceError = false }: DataSourceBannerProps) {
  const status = useBackendStatus((state) => state.status);

  let state: LiveDataBadgeState = "unknown";
  if (status === "unavailable") {
    state = "development";
  } else if (forceError) {
    state = "error";
  } else if (status === "live") {
    state = "live";
  }

  return <LiveDataBadge state={state} />;
}
