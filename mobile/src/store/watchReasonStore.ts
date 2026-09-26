import { create } from "zustand";
import { getPreference, savePreference } from "../storage/secureStorage";

export type WatchReason = "learn" | "compare" | "track" | "research";

const REASONS_KEY = "marketplace_watch_reasons";

type WatchReasonState = {
  reasons: Record<string, WatchReason>;
  hydrate: () => Promise<void>;
  setReason: (symbol: string, reason: WatchReason) => void;
  getReason: (symbol: string) => WatchReason | null;
};

export const useWatchReasonStore = create<WatchReasonState>((set, get) => ({
  reasons: {},
  hydrate: async () => {
    const raw = await getPreference(REASONS_KEY);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Record<string, WatchReason>;
      set({ reasons: parsed });
    } catch {
      set({ reasons: {} });
    }
  },
  setReason: (symbol, reason) => {
    const key = symbol.trim().toUpperCase();
    const next = { ...get().reasons, [key]: reason };
    set({ reasons: next });
    void savePreference(REASONS_KEY, JSON.stringify(next));
  },
  getReason: (symbol) => get().reasons[symbol.trim().toUpperCase()] ?? null,
}));
