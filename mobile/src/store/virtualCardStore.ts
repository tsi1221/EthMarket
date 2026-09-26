import { create } from "zustand";
import { getPreference, savePreference } from "../storage/secureStorage";

const CARD_FROZEN_KEY = "marketplace_virtual_card_frozen";

/** Demo-only masked virtual card UI values. Not real payment credentials. */
export const VIRTUAL_CARD_DEMO = {
  maskedNumber: "•••• •••• •••• 4821",
  lastFour: "4821",
  expiry: "09/30",
  maskedCvv: "•••",
  previewLabel: "Virtual Card Preview",
} as const;

type VirtualCardState = {
  frozen: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setFrozen: (frozen: boolean) => void;
  toggleFrozen: () => void;
};

export const useVirtualCardStore = create<VirtualCardState>((set, get) => ({
  frozen: false,
  hydrated: false,
  hydrate: async () => {
    const saved = await getPreference(CARD_FROZEN_KEY);
    set({ frozen: saved === "true", hydrated: true });
  },
  setFrozen: (frozen) => {
    set({ frozen });
    void savePreference(CARD_FROZEN_KEY, frozen ? "true" : "false");
  },
  toggleFrozen: () => {
    const next = !get().frozen;
    get().setFrozen(next);
  },
}));
