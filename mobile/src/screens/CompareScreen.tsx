import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AssetCard } from "../components/AssetCard";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { ErrorBanner } from "../components/ErrorBanner";
import { LiveDataBadge } from "../components/LiveDataBadge";
import { PriceChange } from "../components/PriceChange";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { ScreenHeader } from "../components/ScreenHeader";
import { SearchBar } from "../components/SearchBar";
import { getAssetEducation } from "../data/assetEducation";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useFavoriteToggle } from "../hooks/useFavoriteToggle";
import { useMarketsBySymbols, useMarketsQuery } from "../hooks/useMarketsQuery";
import { useTranslation } from "../i18n/LanguageProvider";
import { getErrorMessage } from "../api/errors";
import { MAX_COMPARE_ASSETS, useCompareStore } from "../store/compareStore";
import { useBackendStatus, type BackendStatus } from "../store/backendStatus";
import { useSelectionStore } from "../store/selectionStore";
import { useWatchlistStore } from "../store/watchlistStore";
import { radius, spacing, touch } from "../theme";
import { useTheme } from "../theme/ThemeProvider";
import type { ThemeColors } from "../theme/colors";
import type { Asset } from "../types/market";
import {
  formatMarketPrice,
  formatAvailableText,
  tradeableLabel,
  UNAVAILABLE,
  venueLabel,
} from "../utils/format";

const COLUMN_WIDTH = 168;
const ROW_HEIGHT = 64;
const HEADER_HEIGHT = 92;

type CompareRow = {
  id: string;
  label: string;
  value: (asset: Asset) => string;
  kind?: "text" | "change" | "signed" | "long" | "live";
};

function createCompareRows(
  t: (key: string, params?: Record<string, string | number>) => string,
): CompareRow[] {
  return [
  { id: "price", label: t("compare.price"), value: (asset) => formatMarketPrice(asset.price) },
  {
    id: "type",
    label: t("compare.assetType"),
    value: (asset) => {
      const education = getAssetEducation(asset.symbol, asset.name);
      return education.assetType || t("edu.generic.assetType");
    },
  },
  {
    id: "network",
    label: t("compare.network"),
    value: (asset) => {
      const education = getAssetEducation(asset.symbol, asset.name);
      return education.network ?? formatAvailableText(venueLabel(asset.venue));
    },
  },
  { id: "live", label: t("compare.liveData"), value: () => "", kind: "live" },
  { id: "change", label: t("compare.change24h"), value: () => "", kind: "change" },
  {
    id: "what",
    label: t("compare.whatIsIt"),
    value: (asset) => getAssetEducation(asset.symbol, asset.name).plainLanguageSummary,
    kind: "long",
  },
  {
    id: "why",
    label: t("compare.whyWatching"),
    value: (asset) => getAssetEducation(asset.symbol, asset.name).whyPeopleUseIt,
    kind: "long",
  },
  {
    id: "risk",
    label: t("compare.thingsToUnderstand"),
    value: (asset) => getAssetEducation(asset.symbol, asset.name).riskNotes,
    kind: "long",
  },
  {
    id: "tradeable",
    label: t("compare.availableToQuote"),
    value: (asset) => tradeableLabel(asset.tradeable),
  },
];
}

type CompareStyles = ReturnType<typeof createCompareStyles>;

function createCompareStyles(
  colors: ThemeColors,
  typography: ReturnType<typeof useTheme>["typography"],
  cardStyle: ReturnType<typeof useTheme>["cardStyle"],
) {
  return StyleSheet.create({
    screen: {
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
    },
    sessionNote: {
      ...typography.caption,
      marginTop: -spacing.md,
      marginBottom: spacing.md,
    },
    body: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    removeHit: {
      width: touch.min,
      height: touch.min,
      alignItems: "center",
      justifyContent: "center",
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      minHeight: touch.min,
      backgroundColor: colors.primaryLight,
      borderRadius: radius.full,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    chipLabel: {
      color: colors.primaryDark,
      fontSize: 13,
      fontWeight: "800",
    },
    clearChip: {
      borderRadius: radius.full,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    clearLabel: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "700",
    },
    addSection: {
      gap: spacing.sm,
    },
    addHint: {
      color: colors.muted,
      fontSize: 14,
    },
    searchList: {
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    searchEmpty: {
      color: colors.muted,
      fontSize: 14,
    },
    tableCard: {
      ...cardStyle,
      overflow: "hidden",
    },
    table: {
      flexDirection: "row",
    },
    labelColumn: {
      width: 118,
      backgroundColor: colors.surface,
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },
    columns: {
      flexDirection: "row",
    },
    column: {
      width: COLUMN_WIDTH,
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },
    headerCell: {
      height: HEADER_HEIGHT,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    labelHeader: {
      justifyContent: "center",
    },
    columnSymbol: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "800",
    },
    labelCell: {
      height: ROW_HEIGHT,
      justifyContent: "center",
      paddingHorizontal: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    longCell: {
      height: 118,
    },
    rowLabel: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 16,
    },
    valueCell: {
      height: ROW_HEIGHT,
      justifyContent: "center",
      paddingHorizontal: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    valueText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "700",
    },
    longValue: {
      fontSize: 12,
      fontWeight: "600",
      lineHeight: 17,
    },
    unavailable: {
      color: colors.muted,
      fontSize: 13,
      fontWeight: "600",
    },
    gainText: {
      color: colors.gain,
    },
    lossText: {
      color: colors.loss,
    },
    disclaimer: {
      ...typography.caption,
    },
    ctaBlock: {
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    ctaTitle: {
      ...typography.titleSmall,
    },
    ctaRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    ctaButton: {
      flex: 1,
    },
  });
}

export function CompareScreen() {
  const { t } = useTranslation();
  const { colors, typography, cardStyle } = useTheme();
  const compareRows = useMemo(() => createCompareRows(t), [t]);
  const styles = useMemo(
    () => createCompareStyles(colors, typography, cardStyle),
    [colors, typography, cardStyle],
  );
  const navigation = useAppNavigation();
  const compareSymbols = useCompareStore((state) => state.symbols);
  const remove = useCompareStore((state) => state.remove);
  const toggleCompare = useCompareStore((state) => state.toggle);
  const clear = useCompareStore((state) => state.clear);
  const backendStatus = useBackendStatus((state) => state.status);
  const watchSymbols = useWatchlistStore((state) => state.symbols);
  const isWatched = (symbol: string) =>
    watchSymbols.includes(symbol.trim().toUpperCase());
  const toggleFavorite = useFavoriteToggle();
  const selectedSymbol = useSelectionStore((state) => state.selectedSymbol);
  const isSelected = (symbol: string) =>
    selectedSymbol === symbol.trim().toUpperCase();
  const setSelected = useSelectionStore((state) => state.setSelected);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const canAddMore = compareSymbols.length < MAX_COMPARE_ASSETS;
  const remaining = MAX_COMPARE_ASSETS - compareSymbols.length;

  const selectedQueries = useMarketsBySymbols(compareSymbols);
  const search = useMarketsQuery({
    q: debouncedQuery.trim(),
    category: "all",
  });
  const marketsHealth = useMarketsQuery({ q: "", category: "all" });

  const selectedAssets = selectedQueries.map((result, index) => ({
    symbol: compareSymbols[index],
    asset: result.data,
    loading: result.isLoading || result.isFetching,
    error: result.isError,
  }));

  const searchResults = useMemo(() => {
    return search.data?.assets ?? [];
  }, [search.data?.assets]);

  const heading =
    compareSymbols.length === 2
      ? t("compare.vs", { a: compareSymbols[0], b: compareSymbols[1] })
      : compareSymbols[0] ?? t("compare.title");

  function handleToggle(symbol: string) {
    const result = toggleCompare(symbol);
    if (result === "added" || result === "removed") {
      setSelected(symbol);
      setQuery("");
    }
  }

  function hasCompare(symbol: string) {
    return compareSymbols.includes(symbol.trim().toUpperCase());
  }

  return (
    <Screen edges={["top"]} contentStyle={styles.screen}>
      <View style={styles.header}>
        <ScreenHeader
          title={heading}
          subtitle={t("compare.subtitle")}
        />
        <Text style={styles.sessionNote}>
          {t("compare.sessionNote", { count: MAX_COMPARE_ASSETS })}
        </Text>
        {marketsHealth.isError ? (
          <View style={{ gap: spacing.sm, marginBottom: spacing.md }}>
            <ErrorBanner message={getErrorMessage(marketsHealth.error)} />
            <PrimaryButton
              title={t("common.tryAgain")}
              onPress={() => void marketsHealth.refetch()}
            />
          </View>
        ) : null}
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {compareSymbols.length > 0 ? (
          <View style={styles.chips}>
            {compareSymbols.map((symbol) => (
              <Pressable
                key={symbol}
                onPress={() => remove(symbol)}
                style={styles.chip}
                accessibilityRole="button"
                accessibilityLabel={t("compare.removeA11y", { symbol })}
              >
                <Text style={styles.chipLabel}>{symbol}</Text>
                <Ionicons name="close" size={14} color={colors.primaryDark} />
              </Pressable>
            ))}
            <Pressable onPress={clear} style={styles.clearChip} accessibilityRole="button">
              <Text style={styles.clearLabel}>{t("compare.clearAll")}</Text>
            </Pressable>
          </View>
        ) : null}

        {canAddMore ? (
          <View style={styles.addSection}>
            <Text style={styles.addHint}>
              {compareSymbols.length === 0
                ? t("compare.addFirst")
                : t("compare.addMore", { count: remaining })}
            </Text>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder={t("compare.searchPlaceholder")}
            />
            {debouncedQuery.trim().length > 0 ? (
              <View style={styles.searchList}>
                {search.isLoading ? (
                  <ActivityIndicator color={colors.primary} />
                ) : searchResults.length === 0 ? (
                  <Text style={styles.searchEmpty}>{t("compare.noMatches")}</Text>
                ) : (
                  searchResults.slice(0, 8).map((asset) => {
                    const inCompare = hasCompare(asset.symbol);
                    return (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        selected={inCompare || isSelected(asset.symbol)}
                        watched={isWatched(asset.symbol)}
                        onToggleWatch={() => void toggleFavorite(asset.symbol)}
                        onPress={() => handleToggle(asset.symbol)}
                      />
                    );
                  })
                )}
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.addSection}>
            <Text style={styles.addHint}>
              {t("compare.full", { max: MAX_COMPARE_ASSETS })}
            </Text>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder={t("compare.searchSwapPlaceholder")}
            />
            {debouncedQuery.trim().length > 0 ? (
              <View style={styles.searchList}>
                {searchResults.slice(0, 8).map((asset) => {
                  const inCompare = hasCompare(asset.symbol);
                  return (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      selected={inCompare || isSelected(asset.symbol)}
                      watched={isWatched(asset.symbol)}
                      onToggleWatch={() => void toggleFavorite(asset.symbol)}
                      onPress={() => handleToggle(asset.symbol)}
                    />
                  );
                })}
              </View>
            ) : null}
          </View>
        )}

        {compareSymbols.length === 0 ? (
          <EmptyState
            icon="swap-horizontal-outline"
            title={t("compare.emptyTitle")}
            body={t("compare.emptyBody", { count: MAX_COMPARE_ASSETS })}
          />
        ) : (
          <>
            <View style={styles.tableCard}>
              <View style={styles.table}>
                <View style={styles.labelColumn}>
                  <View style={[styles.headerCell, styles.labelHeader]} />
                  {compareRows.map((row) => (
                    <View
                      key={row.id}
                      style={[styles.labelCell, row.kind === "long" ? styles.longCell : null]}
                    >
                      <Text style={styles.rowLabel}>{row.label}</Text>
                    </View>
                  ))}
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.columns}
                >
                  {selectedAssets.map((column) => (
                    <View key={column.symbol} style={styles.column}>
                      <View style={styles.headerCell}>
                        <Text style={styles.columnSymbol}>{column.symbol}</Text>
                        <Pressable
                          onPress={() => remove(column.symbol)}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={t("compare.removeA11y", { symbol: column.symbol })}
                          style={styles.removeHit}
                        >
                          <Ionicons name="close-circle" size={20} color={colors.muted} />
                        </Pressable>
                      </View>
                      {compareRows.map((row) => (
                        <View
                          key={`${column.symbol}-${row.id}`}
                          style={[styles.valueCell, row.kind === "long" ? styles.longCell : null]}
                        >
                          <CompareValue
                            row={row}
                            column={column}
                            backendStatus={backendStatus}
                            colors={colors}
                            styles={styles}
                          />
                        </View>
                      ))}
                    </View>
                  ))}
                </ScrollView>
              </View>
            </View>

            <Text style={styles.disclaimer}>{t("advice.disclaimer")}</Text>

            {compareSymbols.length > 0 ? (
              <View style={styles.ctaBlock}>
                <Text style={styles.ctaTitle}>{t("compare.nextSteps")}</Text>
                <View style={styles.ctaRow}>
                  {compareSymbols.map((symbol) => (
                    <View key={`buy-${symbol}`} style={styles.ctaButton}>
                      <PrimaryButton
                        title={t("compare.buySymbol", { symbol })}
                        onPress={() =>
                          navigation.navigate("BuyAsset", { symbol, side: "buy" })
                        }
                      />
                    </View>
                  ))}
                </View>
                <View style={styles.ctaRow}>
                  {compareSymbols.map((symbol) => (
                    <View key={`sell-${symbol}`} style={styles.ctaButton}>
                      <Button
                        title={t("compare.sellSymbol", { symbol })}
                        variant="secondary"
                        onPress={() =>
                          navigation.navigate("BuyAsset", { symbol, side: "sell" })
                        }
                      />
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function CompareValue({
  row,
  column,
  backendStatus,
  colors,
  styles,
}: {
  row: CompareRow;
  column: {
    asset?: Asset;
    loading: boolean;
    error: boolean;
  };
  backendStatus: BackendStatus;
  colors: ThemeColors;
  styles: CompareStyles;
}) {
  if (column.loading && !column.asset) {
    return <ActivityIndicator color={colors.primary} />;
  }

  if (row.kind === "live") {
    const state =
      column.error
        ? "error"
        : backendStatus === "unavailable"
          ? "development"
          : column.asset && backendStatus === "live"
            ? "live"
            : backendStatus === "unknown"
              ? "unknown"
              : "error";
    return <LiveDataBadge state={state} compact />;
  }

  if (!column.asset) {
    return <Text style={styles.unavailable}>{UNAVAILABLE}</Text>;
  }

  if (row.kind === "change") {
    return <PriceChange percent={column.asset.changePercent} />;
  }

  const value = row.value(column.asset);
  const signed = row.kind === "signed" ? column.asset.changeValue : null;

  return (
    <Text
      style={[
        styles.valueText,
        row.kind === "long" ? styles.longValue : null,
        signed != null && signed > 0 ? styles.gainText : null,
        signed != null && signed < 0 ? styles.lossText : null,
        value === UNAVAILABLE ? styles.unavailable : null,
      ]}
      numberOfLines={row.kind === "long" ? 6 : 2}
    >
      {value}
    </Text>
  );
}
