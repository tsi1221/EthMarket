import { create } from "zustand";
import { getPreference, savePreference } from "../storage/secureStorage";

const STORAGE_KEY = "ethmarket_recently_viewed";
const MAX_RECENT = 8;

type RecentlyViewedState = {
  symbols: string[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  record: (symbol: string) => void;
};

function normalize(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export const useRecentlyViewedStore = create<RecentlyViewedState>((set, get) => ({
  symbols: [],
  hydrated: false,

  hydrate: async () => {
    const raw = await getPreference(STORAGE_KEY);
    if (!raw) {
      set({ hydrated: true });
      return;
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        set({ hydrated: true });
        return;
      }
      const symbols = parsed
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .map(normalize)
        .filter((symbol, index, all) => all.indexOf(symbol) === index)
        .slice(0, MAX_RECENT);
      set({ symbols, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  record: (symbol) => {
    const next = normalize(symbol);
    if (!next) {
      return;
    }
    const symbols = [next, ...get().symbols.filter((item) => item !== next)].slice(
      0,
      MAX_RECENT,
    );
    set({ symbols });
    void savePreference(STORAGE_KEY, JSON.stringify(symbols));
  },
}));
