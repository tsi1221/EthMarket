import { create } from "zustand";

export type BackendStatus = "unknown" | "live" | "unavailable";

type BackendStatusState = {
  status: BackendStatus;
  setStatus: (status: BackendStatus) => void;
};

export const useBackendStatus = create<BackendStatusState>((set) => ({
  status: "unknown",
  setStatus: (status) =>
    set((current) => (current.status === status ? current : { status })),
}));
