import { Ionicons } from "@expo/vector-icons";
import { Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { getErrorMessage } from "../api/errors";
import { AssetCard } from "../components/AssetCard";
import { AssetTradeActions } from "../components/AssetTradeActions";
import { DataSourceBanner } from "../components/DataSourceBanner";
import { EmptyState } from "../components/EmptyState";
import { ErrorBanner } from "../components/ErrorBanner";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { useTranslation } from "../i18n/LanguageProvider";
import { useFavoriteToggle } from "../hooks/useFavoriteToggle";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useMarketsQuery } from "../hooks/useMarketsQuery";
import { MAX_COMPARE_ASSETS, useCompareStore } from "../store/compareStore";
import { useSelectionStore } from "../store/selectionStore";
import { useWatchlistStore } from "../store/watchlistStore";
import { spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";
import type { Asset } from "../types/market";

export function InvestScreen() {
  const navigation = useAppNavigation();
  const { t } = useTranslation();
  const { colors, typography, cardStyle } = useTheme();
  const symbols = useWatchlistStore((state) => state.symbols);
  const isWatched = (symbol: string) => symbols.includes(symbol.trim().toUpperCase());
  const toggleFavorite = useFavoriteToggle();
  const selectedSymbol = useSelectionStore((state) => state.selectedSymbol);
  const isSelected = (symbol: string) =>
    selectedSymbol === symbol.trim().toUpperCase();
  const setSelected = useSelectionStore((state) => state.setSelected);
  const addToCompare = useCompareStore((state) => state.add);
  const markets = useMarketsQuery({ q: "", category: "all" });
  const watched = (markets.data?.assets ?? []).filter((asset) =>
    symbols.includes(asset.symbol.toUpperCase()),
  );

  function openCompare(asset: Asset) {
    setSelected(asset.symbol);
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
      <Text style={typography.title}>{t("invest.title")}</Text>
      <Text style={typography.subtitle}>{t("invest.subtitle")}</Text>
      <Text style={[typography.caption, { color: colors.primaryDark, marginBottom: spacing.sm }]}>
        {t("invest.understandBefore")}
      </Text>
      <DataSourceBanner forceError={markets.isError} />

      <View style={styles.section}>
        <Text style={typography.titleSmall}>{t("invest.quickActions")}</Text>
        <View style={styles.quickRow}>
          <QuickTile
            icon="pie-chart-outline"
            label={t("invest.portfolio")}
            onPress={() => navigation.navigate("Portfolio")}
          />
          <QuickTile
            icon="receipt-outline"
            label={t("invest.orders")}
            onPress={() => navigation.navigate("OrderHistory")}
          />
          <QuickTile
            icon="swap-horizontal-outline"
            label={t("invest.transfers")}
            onPress={() => navigation.navigate("Transfers")}
          />
        </View>
        <View style={styles.quickRow}>
          <QuickTile
            icon="arrow-down-circle-outline"
            label={t("common.buy")}
            onPress={() => navigation.navigate("Explore")}
          />
          <QuickTile
            icon="arrow-up-circle-outline"
            label={t("common.sell")}
            onPress={() => navigation.navigate("Explore")}
          />
          <QuickTile
            icon="star-outline"
            label={t("nav.watchlist")}
            onPress={() => navigation.navigate("Main", { screen: "Watchlist" })}
          />
        </View>
      </View>

      <View style={[cardStyle, styles.cardPanel]}>
        <Text style={typography.titleSmall}>{t("invest.cardTitle")}</Text>
        <Text style={typography.caption}>{t("card.previewLabel")}</Text>
        <PrimaryButton
          title={t("invest.manageCard")}
          onPress={() => navigation.navigate("VirtualCard")}
        />
      </View>

      <View style={styles.section}>
        <Text style={typography.titleSmall}>{t("invest.learnTitle")}</Text>
        <View style={[cardStyle, styles.learnCard, { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight }]}>
          <Text style={[styles.learnItem, { color: colors.text }]}>
            🧠 {t("invest.learnUnderstand")}
          </Text>
          <Text style={[styles.learnItem, { color: colors.text }]}>
            ⚖️ {t("invest.learnCompare")}
          </Text>
          <Text style={[styles.learnItem, { color: colors.text }]}>
            📡 {t("invest.learnQuote")}
          </Text>
          <Text style={typography.caption}>{t("invest.disclaimer")}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={typography.titleSmall}>{t("invest.yourWatchlist")}</Text>
        {markets.isError && !markets.data ? (
          <View style={styles.state}>
            <ErrorBanner message={getErrorMessage(markets.error)} />
            <PrimaryButton title={t("common.tryAgain")} onPress={() => void markets.refetch()} />
          </View>
        ) : markets.isLoading && !markets.data ? (
          <LoadingSkeleton showHero={false} />
        ) : watched.length === 0 ? (
          <EmptyState
            icon="star-outline"
            title={t("watchlist.emptyTitle")}
            body={t("watchlist.emptyBody")}
            actionLabel={t("common.explore")}
            onActionPress={() => navigation.navigate("Explore")}
          />
        ) : (
          <View style={styles.list}>
            {watched.map((asset) => (
              <View key={asset.id} style={styles.item}>
                <AssetCard
                  asset={asset}
                  selected={isSelected(asset.symbol)}
                  watched={isWatched(asset.symbol)}
                  onToggleWatch={() => void toggleFavorite(asset.symbol)}
                  onPress={() => {
                    setSelected(asset.symbol);
                    navigation.navigate("AssetDetails", { symbol: asset.symbol });
                  }}
                />
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
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

function QuickTile({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const { colors, cardStyle } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        cardStyle,
        styles.tile,
        pressed ? { opacity: 0.9 } : null,
      ]}
    >
      <Ionicons name={icon} size={22} color={colors.primaryDark} />
      <Text style={[styles.tileLabel, { color: colors.primaryDark }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  quickRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  tile: {
    flex: 1,
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  tileLabel: {
    fontSize: 13,
    fontWeight: "800",
  },
  cardPanel: {
    marginTop: spacing.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  learnCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  learnItem: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  list: {
    gap: spacing.md,
  },
  item: {
    gap: spacing.sm,
  },
  state: {
    gap: spacing.md,
  },
});
