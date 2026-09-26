import { create } from "zustand";

export const MAX_COMPARE_ASSETS = 2;

export type CompareToggleResult = "added" | "removed" | "duplicate" | "limit";

type CompareState = {
  symbols: string[];
  has: (symbol: string) => boolean;
  add: (symbol: string) => CompareToggleResult;
  remove: (symbol: string) => void;
  toggle: (symbol: string) => CompareToggleResult;
  clear: () => void;
};

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

export const useCompareStore = create<CompareState>((set, get) => ({
  symbols: [],
  has: (symbol) => get().symbols.includes(normalizeSymbol(symbol)),
  add: (symbol) => {
    const next = normalizeSymbol(symbol);
    if (!next) {
      return "duplicate";
    }

    const current = get().symbols;
    if (current.includes(next)) {
      return "duplicate";
    }
    if (current.length >= MAX_COMPARE_ASSETS) {
      return "limit";
    }

    set({ symbols: [...current, next] });
    return "added";
  },
  remove: (symbol) =>
    set((state) => ({
      symbols: state.symbols.filter((item) => item !== normalizeSymbol(symbol)),
    })),
  toggle: (symbol) => {
    const next = normalizeSymbol(symbol);
    if (!next) {
      return "duplicate";
    }
    if (get().has(next)) {
      get().remove(next);
      return "removed";
    }
    return get().add(next);
  },
  clear: () => set({ symbols: [] }),
}));
