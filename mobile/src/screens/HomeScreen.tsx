import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { getErrorMessage } from "../api/errors";
import { AssetCard } from "../components/AssetCard";
import { AssetTradeActions } from "../components/AssetTradeActions";
import { BrandMark } from "../components/BrandMark";
import { DataSourceBanner } from "../components/DataSourceBanner";
import { ErrorBanner } from "../components/ErrorBanner";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { PortfolioCard } from "../components/PortfolioCard";
import { PriceChange } from "../components/PriceChange";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { SearchBar } from "../components/SearchBar";
import { SectionHeader } from "../components/SectionHeader";
import { getAssetEducation } from "../data/assetEducation";
import { useTranslation } from "../i18n/LanguageProvider";
import { useFavoriteToggle } from "../hooks/useFavoriteToggle";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useMarketsQuery } from "../hooks/useMarketsQuery";
import { usePortfolioQuery } from "../hooks/usePortfolioQuery";
import { useAuthStore } from "../store/authStore";
import { useBackendStatus } from "../store/backendStatus";
import { MAX_COMPARE_ASSETS, useCompareStore } from "../store/compareStore";
import { useRecentlyViewedStore } from "../store/recentlyViewedStore";
import { useSelectionStore } from "../store/selectionStore";
import { useWatchlistStore } from "../store/watchlistStore";
import { iconButtonStyle, radius, spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";
import type { Asset } from "../types/market";
import { formatMarketPrice, venueLabel } from "../utils/format";

export function HomeScreen() {
  const navigation = useAppNavigation();
  const { t } = useTranslation();
  const { colors, typography, cardStyle } = useTheme();
  const user = useAuthStore((state) => state.user);
  const backendStatus = useBackendStatus((state) => state.status);
  const watchSymbols = useWatchlistStore((state) => state.symbols);
  const isWatched = (symbol: string) =>
    watchSymbols.includes(symbol.trim().toUpperCase());
  const toggleFavorite = useFavoriteToggle();
  const selectedSymbol = useSelectionStore((state) => state.selectedSymbol);
  const isSelected = (symbol: string) =>
    selectedSymbol === symbol.trim().toUpperCase();
  const setSelected = useSelectionStore((state) => state.setSelected);
  const addToCompare = useCompareStore((state) => state.add);
  const recentSymbols = useRecentlyViewedStore((state) => state.symbols);
  const firstName = user?.name.split(" ")[0] ?? "there";
  const [query, setQuery] = useState("");
  const markets = useMarketsQuery({ q: "", category: "all" });
  const portfolioQuery = usePortfolioQuery();

  const assets = markets.data?.assets ?? [];
  const trending = markets.data?.trending ?? [];
  const recentAssets = useMemo(() => {
    return recentSymbols
      .map((symbol) => assets.find((asset) => asset.symbol.toUpperCase() === symbol))
      .filter((asset): asset is Asset => Boolean(asset));
  }, [assets, recentSymbols]);
  const watchlistAssets = useMemo(() => {
    return watchSymbols
      .map((symbol) => assets.find((asset) => asset.symbol.toUpperCase() === symbol))
      .filter((asset): asset is Asset => Boolean(asset))
      .slice(0, 4);
  }, [assets, watchSymbols]);
  const snapshotAsset = useMemo(() => {
    return (
      assets.find((asset) => asset.symbol.toUpperCase() === "BTC") ??
      trending[0] ??
      assets[0] ??
      null
    );
  }, [assets, trending]);
  const marketList = useMemo(() => {
    const preferred = ["BTC", "ETH"];
    const picks = preferred
      .map((symbol) => assets.find((asset) => asset.symbol.toUpperCase() === symbol))
      .filter((asset): asset is Asset => Boolean(asset));
    if (picks.length >= 2) {
      return picks;
    }
    if (trending.length > 0) {
      return trending.slice(0, 6);
    }
    return assets.slice(0, 6);
  }, [assets, trending]);
  const portfolio = portfolioQuery.data;
  const loading = (markets.isLoading && !markets.data) || (portfolioQuery.isLoading && !portfolio);
  const marketsFailed = markets.isError && !markets.data;
  const showMarketError = markets.isError;
  const showPortfolioError = portfolioQuery.isError;
  const education = snapshotAsset
    ? getAssetEducation(snapshotAsset.symbol, snapshotAsset.name)
    : null;

  function openExplore(search = "") {
    navigation.navigate("Explore", search ? { query: search } : undefined);
  }

  function openAsset(asset: Asset) {
    setSelected(asset.symbol);
    navigation.navigate("AssetDetails", { symbol: asset.symbol });
  }

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
          refreshing={(markets.isRefetching || portfolioQuery.isRefetching) && !loading}
          onRefresh={() => {
            void markets.refetch();
            void portfolioQuery.refetch();
          }}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.topBar}>
        <View style={styles.brandRow}>
          <BrandMark size={40} compact />
          <View>
            <Text style={[styles.brandName, { color: colors.primary }]}>{t("app.name")}</Text>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {t("home.greeting", { name: firstName })}
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("portfolio.openProfile")}
          onPress={() => navigation.navigate("Main", { screen: "Profile" })}
          style={({ pressed }) => [
            styles.profileButton,
            { backgroundColor: colors.primaryLight },
            pressed ? styles.pressed : null,
          ]}
        >
          <Ionicons name="person-outline" size={20} color={colors.primaryDark} />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={[typography.title, styles.heroTitle]}>{t("app.name")}</Text>
        <Text style={typography.subtitle}>{t("app.tagline")}</Text>
        <Text style={[typography.caption, { color: colors.primaryDark }]}>
          {t("app.supportLine")}
        </Text>
        <DataSourceBanner forceError={showMarketError && backendStatus === "live"} />
        <Text style={[typography.caption, { marginTop: spacing.xs }]}>
          {t("live.poweredBy")}
        </Text>
      </View>

      <View style={styles.quickActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.compare")}
          onPress={() => navigation.navigate("Main", { screen: "Compare" })}
          style={({ pressed }) => [
            cardStyle,
            styles.quickTile,
            { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
            pressed ? styles.pressed : null,
          ]}
        >
          <Ionicons name="swap-horizontal-outline" size={20} color={colors.primaryDark} />
          <Text style={[styles.quickLabel, { color: colors.primaryDark }]}>
            {t("common.compare")}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("nav.invest")}
          onPress={() => navigation.navigate("Main", { screen: "Invest" })}
          style={({ pressed }) => [
            cardStyle,
            styles.quickTile,
            { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
            pressed ? styles.pressed : null,
          ]}
        >
          <Ionicons name="cash-outline" size={20} color={colors.primaryDark} />
          <Text style={[styles.quickLabel, { color: colors.primaryDark }]}>
            {t("nav.invest")}
          </Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("home.cardShortcut")}
        onPress={() => navigation.navigate("VirtualCard")}
        style={({ pressed }) => [
          cardStyle,
          styles.cardShortcut,
          pressed ? styles.pressed : null,
        ]}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[typography.titleSmall]}>{t("home.cardShortcut")}</Text>
          <Text style={typography.caption}>{t("home.cardSubtitle")}</Text>
        </View>
        <PrimaryButton title={t("home.openCard")} onPress={() => navigation.navigate("VirtualCard")} />
      </Pressable>

      <SearchBar
        value={query}
        onChangeText={setQuery}
        onSubmit={(value) => openExplore(value)}
        placeholder={t("explore.searchPlaceholder")}
      />

      {showMarketError || showPortfolioError ? (
        <View style={styles.section}>
          {showMarketError ? <ErrorBanner message={getErrorMessage(markets.error)} /> : null}
          {showPortfolioError ? (
            <ErrorBanner message={getErrorMessage(portfolioQuery.error)} />
          ) : null}
          <PrimaryButton
            title={t("common.tryAgain")}
            onPress={() => {
              if (showMarketError) {
                void markets.refetch();
              }
              if (showPortfolioError) {
                void portfolioQuery.refetch();
              }
            }}
          />
        </View>
      ) : null}

      {loading ? (
        <View style={styles.section}>
          <LoadingSkeleton rows={5} />
        </View>
      ) : (
        <>
          {recentAssets.length > 0 && !marketsFailed ? (
            <View style={styles.section}>
              <SectionHeader title={t("home.recentlyViewed")} />
              <View style={styles.list}>
                {recentAssets.slice(0, 4).map((asset) => (
                  <View key={`recent-${asset.id}`} style={styles.item}>
                    <AssetCard
                      asset={asset}
                      selected={isSelected(asset.symbol)}
                      watched={isWatched(asset.symbol)}
                      onToggleWatch={() => void toggleFavorite(asset.symbol)}
                      onPress={() => openAsset(asset)}
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
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {watchlistAssets.length > 0 && !marketsFailed ? (
            <View style={styles.section}>
              <SectionHeader
                title={t("home.watchlist")}
                actionLabel={t("common.open")}
                onActionPress={() => navigation.navigate("Main", { screen: "Watchlist" })}
              />
              <View style={styles.list}>
                {watchlistAssets.map((asset) => (
                  <View key={`watch-${asset.id}`} style={styles.item}>
                    <AssetCard
                      asset={asset}
                      selected={isSelected(asset.symbol)}
                      watched
                      onToggleWatch={() => void toggleFavorite(asset.symbol)}
                      onPress={() => openAsset(asset)}
                    />
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {snapshotAsset && education && !marketsFailed ? (
            <View style={styles.section}>
              <SectionHeader title={t("home.marketSnapshot")} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("home.openAssetA11y", { symbol: snapshotAsset.symbol })}
                onPress={() => openAsset(snapshotAsset)}
                style={[cardStyle, styles.snapshotCard]}
              >
                <View style={styles.snapshotHeader}>
                  <View>
                    <Text style={[styles.snapshotSymbol, { color: colors.text }]}>
                      {snapshotAsset.symbol}
                    </Text>
                    <Text style={[styles.snapshotName, { color: colors.textSecondary }]}>
                      {snapshotAsset.name}
                    </Text>
                  </View>
                  <DataSourceBanner />
                </View>
                <Text style={[styles.snapshotPrice, { color: colors.text }]}>
                  {formatMarketPrice(snapshotAsset.price)}
                </Text>
                {snapshotAsset.changePercent != null ? (
                  <View style={styles.snapshotChange}>
                    <Text style={[styles.snapshotMeta, { color: colors.textSecondary }]}>
                      {t("home.change24h")}
                    </Text>
                    <PriceChange percent={snapshotAsset.changePercent} />
                  </View>
                ) : null}
                {venueLabel(snapshotAsset.venue) ? (
                  <Text style={[styles.snapshotMeta, { color: colors.textSecondary }]}>
                    {t("home.marketVenue", { venue: venueLabel(snapshotAsset.venue) ?? "" })}
                  </Text>
                ) : null}
                <Text style={[typography.body, styles.snapshotSummary]}>
                  {education.plainLanguageSummary}
                </Text>
                <Text style={[typography.caption, styles.disclaimer]}>{t("advice.disclaimer")}</Text>
              </Pressable>
            </View>
          ) : null}

          {portfolio ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("home.openPortfolioA11y")}
              onPress={() => navigation.navigate("Portfolio")}
              style={styles.section}
            >
              <PortfolioCard portfolio={portfolio} />
            </Pressable>
          ) : null}

          {marketsFailed ? null : (
            <View style={styles.section}>
              <SectionHeader
                title={t("home.popularAssets")}
                actionLabel={t("home.seeAll")}
                onActionPress={() => openExplore()}
              />
              <View style={styles.list}>
                {marketList.length === 0 ? (
                  <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                    {t("home.noAssetsAvailable")}
                  </Text>
                ) : (
                  marketList.map((asset) => (
                    <View key={asset.id} style={styles.assetBlock}>
                      <AssetCard
                        asset={asset}
                        selected={isSelected(asset.symbol)}
                        watched={isWatched(asset.symbol)}
                        onToggleWatch={() => void toggleFavorite(asset.symbol)}
                        onPress={() => openAsset(asset)}
                      />
                      <AssetTradeActions
                        symbol={asset.symbol}
                        compact
                        onBuy={() =>
                          navigation.navigate("BuyAsset", {
                            symbol: asset.symbol,
                            side: "buy",
                          })
                        }
                        onSell={() =>
                          navigation.navigate("BuyAsset", {
                            symbol: asset.symbol,
                            side: "sell",
                          })
                        }
                        onCompare={() => openCompare(asset)}
                      />
                    </View>
                  ))
                )}
              </View>
              <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                {t("home.compareFootnote", { count: MAX_COMPARE_ASSETS })}
              </Text>
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    width: "100%",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    flexShrink: 1,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  greeting: {
    fontSize: 13,
    fontWeight: "600",
  },
  profileButton: {
    ...iconButtonStyle,
    borderRadius: radius.md,
  },
  pressed: {
    opacity: 0.88,
  },
  hero: {
    marginBottom: spacing.lg,
    gap: spacing.xs,
    alignSelf: "stretch",
    width: "100%",
  },
  heroTitle: {
    fontSize: 30,
    lineHeight: 36,
    width: "100%",
  },
  emptyHint: {
    fontSize: 13,
    fontWeight: "500",
  },
  section: {
    marginTop: spacing.lg,
    gap: spacing.md,
    width: "100%",
    alignSelf: "stretch",
  },
  list: {
    gap: spacing.sm,
    width: "100%",
  },
  item: {
    gap: spacing.sm,
    width: "100%",
  },
  assetBlock: {
    gap: spacing.sm,
    width: "100%",
  },
  quickActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    width: "100%",
  },
  quickTile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  quickLabel: {
    fontSize: 14,
    fontWeight: "800",
  },
  cardShortcut: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  snapshotCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  snapshotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  snapshotSymbol: {
    fontSize: 22,
    fontWeight: "800",
  },
  snapshotName: {
    fontSize: 14,
    fontWeight: "600",
  },
  snapshotPrice: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  snapshotChange: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  snapshotMeta: {
    fontSize: 13,
    fontWeight: "600",
  },
  snapshotSummary: {
    marginTop: spacing.xs,
  },
  disclaimer: {
    marginTop: spacing.xs,
  },
});
