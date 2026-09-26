import { create } from "zustand";

type ToastState = {
  message: string | null;
  visible: boolean;
  show: (message: string) => void;
  hide: () => void;
};

let hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  visible: false,
  show: (message) => {
    if (hideTimer) {
      clearTimeout(hideTimer);
    }
    set({ message, visible: true });
    hideTimer = setTimeout(() => {
      set({ visible: false, message: null });
      hideTimer = null;
    }, 2200);
  },
  hide: () => {
    if (hideTimer) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
    set({ visible: false, message: null });
  },
}));
