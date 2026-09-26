import { create } from "zustand";

type SelectionState = {
  selectedSymbol: string | null;
  setSelected: (symbol: string | null) => void;
  isSelected: (symbol: string) => boolean;
  clear: () => void;
};

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedSymbol: null,
  setSelected: (symbol) =>
    set({
      selectedSymbol: symbol ? normalizeSymbol(symbol) : null,
    }),
  isSelected: (symbol) => get().selectedSymbol === normalizeSymbol(symbol),
  clear: () => set({ selectedSymbol: null }),
}));
