import { create } from "zustand";
import { getErrorMessage } from "../api/errors";
import { fetchWatchlist, toggleWatchlistRequest } from "../api/watchlist";
import { getAuthToken, getPreference, savePreference } from "../storage/secureStorage";

const WATCHLIST_KEY = "marketplace_watchlist_symbols";

export type WatchToggleResult = "added" | "removed";

type WatchlistState = {
  symbols: string[];
  persisted: boolean;
  isLoading: boolean;
  hydrated: boolean;
  error: string | null;
  isWatched: (symbol: string) => boolean;
  hydrate: () => Promise<void>;
  toggle: (symbol: string) => Promise<WatchToggleResult | null>;
  resetServerFlag: () => void;
};

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

function uniqueSymbols(symbols: string[]) {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const symbol of symbols) {
    const normalized = normalizeSymbol(symbol);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    next.push(normalized);
  }
  return next;
}

async function loadLocalSymbols(): Promise<string[]> {
  const raw = await getPreference(WATCHLIST_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return uniqueSymbols(parsed.filter((item): item is string => typeof item === "string"));
  } catch {
    return [];
  }
}

async function saveLocalSymbols(symbols: string[]) {
  await savePreference(WATCHLIST_KEY, JSON.stringify(uniqueSymbols(symbols)));
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  symbols: [],
  persisted: false,
  isLoading: false,
  hydrated: false,
  error: null,
  isWatched: (symbol) => get().symbols.includes(normalizeSymbol(symbol)),
  hydrate: async () => {
    set({ isLoading: true, error: null });
    const local = await loadLocalSymbols();
    set({ symbols: local, hydrated: true });

    const token = await getAuthToken();
    if (!token) {
      set({ persisted: false, isLoading: false });
      return;
    }

    try {
      const remote = await fetchWatchlist();
      const merged = uniqueSymbols([...remote, ...local]);
      set({ symbols: merged, persisted: true, isLoading: false, error: null });
      await saveLocalSymbols(merged);
    } catch (error) {
      set({
        persisted: false,
        isLoading: false,
        error: getErrorMessage(error),
      });
    }
  },
  toggle: async (symbol) => {
    const normalized = normalizeSymbol(symbol);
    if (!normalized) {
      return null;
    }

    const previous = get().symbols;
    const exists = previous.includes(normalized);
    const next = exists
      ? previous.filter((item) => item !== normalized)
      : uniqueSymbols([normalized, ...previous]);
    const result: WatchToggleResult = exists ? "removed" : "added";

    set({ symbols: next, error: null });
    await saveLocalSymbols(next);

    const token = await getAuthToken();
    if (!token) {
      set({ persisted: false });
      return result;
    }

    try {
      const remote = await toggleWatchlistRequest(normalized);
      const synced = uniqueSymbols(remote.symbols);
      set({ symbols: synced, persisted: true, error: null });
      await saveLocalSymbols(synced);
      return synced.includes(normalized) ? "added" : "removed";
    } catch (error) {
      set({ symbols: previous, persisted: true, error: getErrorMessage(error) });
      await saveLocalSymbols(previous);
      return null;
    }
  },
  resetServerFlag: () => set({ persisted: false, isLoading: false, error: null }),
}));
