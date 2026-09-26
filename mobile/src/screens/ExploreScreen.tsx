import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { AssetCard } from "../components/AssetCard";
import { DataSourceBanner } from "../components/DataSourceBanner";
import { EmptyState } from "../components/EmptyState";
import { ErrorBanner } from "../components/ErrorBanner";
import { FilterChip } from "../components/FilterChip";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { ScreenHeader } from "../components/ScreenHeader";
import { SearchBar } from "../components/SearchBar";
import { SectionHeader } from "../components/SectionHeader";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useFavoriteToggle } from "../hooks/useFavoriteToggle";
import { useMarketsQuery } from "../hooks/useMarketsQuery";
import { useTranslation } from "../i18n/LanguageProvider";
import { getErrorMessage } from "../api/errors";
import type { AppStackParamList } from "../navigation/types";
import { useSelectionStore } from "../store/selectionStore";
import { useWatchlistStore } from "../store/watchlistStore";
import { spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";
import type { MarketCategory } from "../types/market";

const filterIds: MarketCategory[] = ["all", "cefi", "defi"];

type ExploreScreenProps = NativeStackScreenProps<AppStackParamList, "Explore">;

export function ExploreScreen({ navigation, route }: ExploreScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const watchSymbols = useWatchlistStore((state) => state.symbols);
  const isWatched = (symbol: string) =>
    watchSymbols.includes(symbol.trim().toUpperCase());
  const toggleFavorite = useFavoriteToggle();
  const selectedSymbol = useSelectionStore((state) => state.selectedSymbol);
  const isSelected = (symbol: string) =>
    selectedSymbol === symbol.trim().toUpperCase();
  const setSelected = useSelectionStore((state) => state.setSelected);
  const [query, setQuery] = useState(route.params?.query ?? "");
  const [category, setCategory] = useState<MarketCategory>("all");
  const debouncedQuery = useDebouncedValue(query, 350);

  useFocusEffect(
    useCallback(() => {
      if (route.params?.query) {
        setQuery(route.params.query);
      }
    }, [route.params?.query]),
  );

  const markets = useMarketsQuery({
    q: debouncedQuery.trim(),
    category,
  });

  const assets = markets.data?.assets ?? [];
  const trending = markets.data?.trending ?? [];
  const isSearching = debouncedQuery.trim().length > 0;
  const showInitialSkeleton = markets.isLoading && !markets.data;

  const filterLabel = (id: MarketCategory) => {
    if (id === "all") return t("explore.filterAll");
    if (id === "cefi") return t("explore.filterSimple");
    return t("explore.filterOnchain");
  };

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
      <ScreenHeader
        title={t("explore.title")}
        subtitle={t("explore.subtitle")}
        onBack={() => navigation.goBack()}
      />
      <DataSourceBanner />
      <View style={styles.search}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder={t("explore.searchPlaceholder")}
        />
      </View>
      <View style={styles.filters}>
        {filterIds.map((filterId) => (
          <FilterChip
            key={filterId}
            label={filterLabel(filterId)}
            selected={filterId === category}
            onPress={() => setCategory(filterId)}
          />
        ))}
      </View>

      {markets.isError && !markets.data ? (
        <View style={styles.state}>
          <ErrorBanner message={getErrorMessage(markets.error)} />
          <PrimaryButton title={t("common.tryAgain")} onPress={() => void markets.refetch()} />
        </View>
      ) : showInitialSkeleton ? (
        <LoadingSkeleton rows={6} showHero={false} />
      ) : isSearching && assets.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title={t("explore.noResultsTitle", { query: debouncedQuery.trim() })}
          body={t("explore.noResultsBody")}
        />
      ) : (
        <>
          {markets.isError ? (
            <View style={styles.state}>
              <ErrorBanner message={getErrorMessage(markets.error)} />
            </View>
          ) : null}
          {!isSearching && trending.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader title={t("explore.trending")} />
              <View style={styles.list}>
                {trending.map((asset) => (
                  <AssetCard
                    key={`trending-${asset.id}`}
                    asset={asset}
                    selected={isSelected(asset.symbol)}
                    watched={isWatched(asset.symbol)}
                    onToggleWatch={() => void toggleFavorite(asset.symbol)}
                    onPress={() => {
                      setSelected(asset.symbol);
                      navigation.navigate("AssetDetails", { symbol: asset.symbol });
                    }}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <SectionHeader
              title={isSearching ? t("explore.searchResults") : t("explore.allAssets")}
            />
            {assets.length === 0 ? (
              <EmptyState
                icon="file-tray-outline"
                title={t("explore.emptyCategoryTitle")}
                body={t("explore.emptyCategoryBody")}
              />
            ) : (
              <View style={styles.list}>
                {assets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    selected={isSelected(asset.symbol)}
                    watched={isWatched(asset.symbol)}
                    onToggleWatch={() => void toggleFavorite(asset.symbol)}
                    onPress={() => {
                      setSelected(asset.symbol);
                      navigation.navigate("AssetDetails", { symbol: asset.symbol });
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  search: {
    marginBottom: spacing.md,
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  section: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.sm,
  },
  state: {
    gap: spacing.md,
  },
});
