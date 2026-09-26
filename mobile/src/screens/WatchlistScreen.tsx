import { useEffect } from "react";
import { Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { AssetCard } from "../components/AssetCard";
import { AssetTradeActions } from "../components/AssetTradeActions";
import { DataSourceBanner } from "../components/DataSourceBanner";
import { EmptyState } from "../components/EmptyState";
import { ErrorBanner } from "../components/ErrorBanner";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { getErrorMessage } from "../api/errors";
import { useTranslation } from "../i18n/LanguageProvider";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useFavoriteToggle } from "../hooks/useFavoriteToggle";
import { useMarketsQuery } from "../hooks/useMarketsQuery";
import { MAX_COMPARE_ASSETS, useCompareStore } from "../store/compareStore";
import { useAuthStore } from "../store/authStore";
import {
  useWatchReasonStore,
  type WatchReason,
} from "../store/watchReasonStore";
import { useSelectionStore } from "../store/selectionStore";
import { useWatchlistStore } from "../store/watchlistStore";
import { radius, spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";
import type { Asset } from "../types/market";

const REASON_KEYS: { id: WatchReason; labelKey: string }[] = [
  { id: "learn", labelKey: "watchlist.reason.learn" },
  { id: "compare", labelKey: "watchlist.reason.compare" },
  { id: "track", labelKey: "watchlist.reason.track" },
  { id: "research", labelKey: "watchlist.reason.research" },
];

export function WatchlistScreen() {
  const navigation = useAppNavigation();
  const { t } = useTranslation();
  const { colors, typography } = useTheme();
  const symbols = useWatchlistStore((state) => state.symbols);
  const persisted = useWatchlistStore((state) => state.persisted);
  const watchlistError = useWatchlistStore((state) => state.error);
  const token = useAuthStore((state) => state.token);
  const toggleFavorite = useFavoriteToggle();
  const selectedSymbol = useSelectionStore((state) => state.selectedSymbol);
  const isSelected = (symbol: string) =>
    selectedSymbol === symbol.trim().toUpperCase();
  const setSelected = useSelectionStore((state) => state.setSelected);
  const addToCompare = useCompareStore((state) => state.add);
  const hydrateReasons = useWatchReasonStore((state) => state.hydrate);
  const setReason = useWatchReasonStore((state) => state.setReason);
  const reasons = useWatchReasonStore((state) => state.reasons);
  const markets = useMarketsQuery({ q: "", category: "all" });
  const assets = (markets.data?.assets ?? []).filter((asset) =>
    symbols.includes(asset.symbol.toUpperCase()),
  );

  useEffect(() => {
    void hydrateReasons();
  }, [hydrateReasons]);

  function openCompare(asset: Asset) {
    addToCompare(asset.symbol);
    navigation.navigate("Main", { screen: "Compare" });
  }

  return (
    <Screen
      scroll
      edges={["top"]}
      refreshControl={
        <RefreshControl
          refreshing={markets.isRefetching && !markets.isLoading}
          onRefresh={() => void markets.refetch()}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <Text style={typography.title}>{t("watchlist.title")}</Text>
      <Text style={[typography.subtitle, { marginBottom: spacing.sm }]}>
        {t("watchlist.subtitle")}
      </Text>
      <DataSourceBanner forceError={markets.isError} />
      {token ? null : (
        <Text style={[typography.caption, { marginBottom: spacing.sm }]}>
          Sign in to save your watchlist across devices.
        </Text>
      )}
      {token && persisted ? (
        <Text style={[typography.caption, { marginBottom: spacing.sm }]}>
          Saved to your account.
        </Text>
      ) : null}
      {watchlistError ? <ErrorBanner message={watchlistError} /> : null}
      {markets.isError && !markets.data ? (
        <View style={styles.state}>
          <ErrorBanner message={getErrorMessage(markets.error)} />
          <PrimaryButton title={t("common.tryAgain")} onPress={() => void markets.refetch()} />
        </View>
      ) : markets.isError ? (
        <View style={styles.state}>
          <ErrorBanner message={getErrorMessage(markets.error)} />
        </View>
      ) : null}
      {markets.isError && !markets.data ? null : markets.isLoading && !markets.data ? (
        <LoadingSkeleton showHero={false} />
      ) : assets.length === 0 ? (
        <EmptyState
          icon="bookmark-outline"
          title={t("watchlist.emptyTitle")}
          body={t("watchlist.emptyBody")}
          actionLabel={t("common.explore")}
          onActionPress={() => navigation.navigate("Explore")}
        />
      ) : (
        <View style={styles.list}>
          {assets.map((asset) => {
            const selected = reasons[asset.symbol.toUpperCase()] ?? null;
            return (
              <View key={asset.id} style={styles.item}>
                <AssetCard
                  asset={asset}
                  selected={isSelected(asset.symbol)}
                  watched
                  onToggleWatch={() => void toggleFavorite(asset.symbol)}
                  onPress={() => {
                    setSelected(asset.symbol);
                    navigation.navigate("AssetDetails", { symbol: asset.symbol });
                  }}
                />
                <Text style={typography.caption}>{t("watchlist.whyWatching")}</Text>
                <View style={styles.reasons}>
                  {REASON_KEYS.map((reason) => {
                    const active = selected === reason.id;
                    return (
                      <Pressable
                        key={reason.id}
                        onPress={() => setReason(asset.symbol, reason.id)}
                        style={[
                          styles.reasonChip,
                          {
                            backgroundColor: active
                              ? colors.primaryLight
                              : colors.surface,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: active ? colors.primaryDark : colors.textSecondary,
                            fontSize: 12,
                            fontWeight: "700",
                          }}
                        >
                          {t(reason.labelKey)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <AssetTradeActions
                  symbol={asset.symbol}
                  compact
                  onBuy={() =>
                    navigation.navigate("BuyAsset", { symbol: asset.symbol, side: "buy" })
                  }
                  onSell={() =>
                    navigation.navigate("BuyAsset", { symbol: asset.symbol, side: "sell" })
                  }
                  onCompare={() => openCompare(asset)}
                />
                <Text style={typography.caption}>
                  Compare holds up to {MAX_COMPARE_ASSETS} assets on this device.
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  item: {
    gap: spacing.sm,
  },
  reasons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  reasonChip: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  state: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
