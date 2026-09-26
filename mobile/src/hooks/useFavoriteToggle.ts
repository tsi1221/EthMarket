import { useCallback } from "react";
import { useTranslation } from "../i18n/LanguageProvider";
import { useToastStore } from "../store/toastStore";
import { useWatchlistStore } from "../store/watchlistStore";

export function useFavoriteToggle() {
  const toggle = useWatchlistStore((state) => state.toggle);
  const showToast = useToastStore((state) => state.show);
  const { t } = useTranslation();

  return useCallback(
    async (symbol: string) => {
      const result = await toggle(symbol);
      if (result === "added") {
        showToast(t("watchlist.added"));
      } else if (result === "removed") {
        showToast(t("watchlist.removed"));
      }
      return result;
    },
    [showToast, t, toggle],
  );
}
