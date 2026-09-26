import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "../components/Button";
import { DataSourceBanner } from "../components/DataSourceBanner";
import { ErrorBanner } from "../components/ErrorBanner";
import { FilterChip } from "../components/FilterChip";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { PriceChange } from "../components/PriceChange";
import { PriceChart } from "../components/PriceChart";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { ScreenHeader } from "../components/ScreenHeader";
import { getErrorMessage } from "../api/errors";
import { getAssetEducation } from "../data/assetEducation";
import { useFavoriteToggle } from "../hooks/useFavoriteToggle";
import { useMarketChartQuery, useMarketQuery } from "../hooks/useMarketsQuery";
import { useTranslation } from "../i18n/LanguageProvider";
import type { AppStackParamList } from "../navigation/types";
import { MAX_COMPARE_ASSETS, useCompareStore } from "../store/compareStore";
import { useRecentlyViewedStore } from "../store/recentlyViewedStore";
import { useSelectionStore } from "../store/selectionStore";
import { useWatchlistStore } from "../store/watchlistStore";
import { iconButtonStyle, spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";
import { CHART_PERIODS, type ChartPeriod } from "../types/market";
import {
  displayWebsite,
  formatAvailableCurrency,
  formatMarketPrice,
  formatAvailableText,
  formatCompactNumber,
  formatSignedCurrency,
  shortenAddress,
  tradeableLabel,
  venueLabel,
} from "../utils/format";

type AssetDetailsScreenProps = NativeStackScreenProps<
  AppStackParamList,
  "AssetDetails"
>;

type AssetDetailsStyles = ReturnType<typeof createAssetDetailsStyles>;

function createAssetDetailsStyles(
  colors: ReturnType<typeof useTheme>["colors"],
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
    headerButton: {
      ...iconButtonStyle,
    },
    body: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      gap: spacing.sm,
    },
    state: {
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    name: {
      ...typography.title,
    },
    symbol: {
      color: colors.muted,
      fontSize: 16,
      fontWeight: "700",
    },
    price: {
      color: colors.text,
      fontSize: 34,
      fontWeight: "800",
      letterSpacing: -0.6,
      marginTop: spacing.sm,
    },
    chartCard: {
      ...cardStyle,
      marginTop: spacing.lg,
      padding: spacing.md,
      gap: spacing.md,
    },
    chartHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.sm,
    },
    periods: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    periodChip: {
      flex: 1,
    },
    chartState: {
      gap: spacing.md,
    },
    chartEmpty: {
      paddingVertical: spacing.lg,
      alignItems: "center",
      gap: 6,
    },
    chartEmptyTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "800",
    },
    chartEmptyBody: {
      color: colors.muted,
      fontSize: 14,
      textAlign: "center",
      lineHeight: 20,
    },
    card: {
      ...cardStyle,
      marginTop: spacing.md,
      overflow: "hidden",
    },
    cardTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "800",
    },
    cardHeading: {
      color: colors.text,
      fontSize: 16,
      fontWeight: "800",
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    badgeWrap: {
      marginTop: spacing.sm,
    },
    eduLabel: {
      color: colors.primaryDark,
      fontSize: 13,
      fontWeight: "800",
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
    },
    description: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 22,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    bullet: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 22,
      paddingHorizontal: spacing.md,
      paddingBottom: 4,
    },
    disclaimer: {
      color: colors.muted,
      fontSize: 12,
      fontWeight: "600",
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      paddingTop: spacing.sm,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoLabel: {
      color: colors.muted,
      fontSize: 14,
      fontWeight: "600",
    },
    infoValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "700",
      textAlign: "right",
      flexShrink: 1,
    },
    linkText: {
      color: colors.primary,
    },
    gainText: {
      color: colors.gain,
    },
    lossText: {
      color: colors.loss,
    },
    actions: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    tradeRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    tradeButton: {
      flex: 1,
    },
  });
}

export function AssetDetailsScreen({ navigation, route }: AssetDetailsScreenProps) {
  const symbol = route.params.symbol;
  const { t } = useTranslation();
  const { colors, typography, cardStyle } = useTheme();
  const styles = useMemo(
    () => createAssetDetailsStyles(colors, typography, cardStyle),
    [colors, typography, cardStyle],
  );
  const [period, setPeriod] = useState<ChartPeriod>("1D");
  const market = useMarketQuery(symbol);
  const chart = useMarketChartQuery(symbol, period);
  const asset = market.data;
  const addToCompare = useCompareStore((state) => state.add);
  const watchSymbols = useWatchlistStore((state) => state.symbols);
  const isWatched = (symbol: string) =>
    watchSymbols.includes(symbol.trim().toUpperCase());
  const toggleFavorite = useFavoriteToggle();
  const setSelected = useSelectionStore((state) => state.setSelected);
  const recordRecentlyViewed = useRecentlyViewedStore((state) => state.record);
  const watched = asset ? isWatched(asset.symbol) : false;
  const education = getAssetEducation(symbol, asset?.name);

  useEffect(() => {
    setSelected(symbol);
    recordRecentlyViewed(symbol);
  }, [setSelected, symbol, recordRecentlyViewed]);

  function openCompare() {
    if (!asset) {
      return;
    }

    const result = addToCompare(asset.symbol);
    if (result === "limit") {
      Alert.alert(
        `Compare up to ${MAX_COMPARE_ASSETS} assets`,
        `${asset.symbol} could not be added because you already selected ${MAX_COMPARE_ASSETS}. Remove one first.`,
        [
          { text: "Open Compare", onPress: () => navigation.navigate("Main", { screen: "Compare" }) },
          { text: "OK" },
        ],
      );
      return;
    }

    navigation.navigate("Main", { screen: "Compare" });
  }

  async function openWebsite() {
    const url = asset?.website?.trim();
    if (!url) {
      return;
    }
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const canOpen = await Linking.canOpenURL(href);
    if (!canOpen) {
      Alert.alert("Unavailable", "This website could not be opened.");
      return;
    }
    await Linking.openURL(href);
  }

  return (
    <Screen edges={["top", "bottom"]} contentStyle={styles.screen}>
      <View style={styles.header}>
        <ScreenHeader
          title={asset?.symbol ?? symbol.toUpperCase()}
          onBack={() => navigation.goBack()}
          align="center"
          right={
            <Pressable
              onPress={() => asset && void toggleFavorite(asset.symbol)}
              disabled={!asset}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityState={{ selected: watched }}
              accessibilityLabel={
                watched
                  ? t("watchlist.removeA11y", { symbol })
                  : t("watchlist.addA11y", { symbol })
              }
              style={styles.headerButton}
            >
              <Ionicons
                name={watched ? "star" : "star-outline"}
                size={22}
                color={watched ? colors.primary : colors.muted}
              />
            </Pressable>
          }
        />
      </View>

      {market.isError ? (
        <View style={styles.state}>
          <ErrorBanner message={getErrorMessage(market.error)} />
          <PrimaryButton title={t("common.tryAgain")} onPress={() => void market.refetch()} />
        </View>
      ) : market.isLoading || !asset ? (
        <View style={styles.body}>
          <LoadingSkeleton rows={6} />
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.name}>{asset.name}</Text>
            <Text style={styles.symbol}>{asset.symbol}</Text>
            <Text style={styles.price}>{formatMarketPrice(asset.price)}</Text>
            <PriceChange percent={asset.changePercent} size="md" />
            <View style={styles.badgeWrap}>
              <DataSourceBanner forceError={market.isError} />
            </View>

            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.cardTitle}>{t("details.priceChart")}</Text>
                {chart.data?.available && chart.data.period === period ? (
                  <PriceChange percent={chart.data.changePercent} />
                ) : null}
              </View>
              <View style={styles.periods}>
                {CHART_PERIODS.map((item) => (
                  <FilterChip
                    key={item}
                    label={item}
                    selected={item === period}
                    onPress={() => setPeriod(item)}
                    style={styles.periodChip}
                  />
                ))}
              </View>
              {chart.isError ? (
                <View style={styles.chartState}>
                  <ErrorBanner message={getErrorMessage(chart.error)} />
                  <PrimaryButton title={t("common.tryAgain")} onPress={() => void chart.refetch()} />
                </View>
              ) : !chart.data || chart.data.period !== period ? (
                <LoadingSkeleton rows={2} />
              ) : chart.data.available && chart.data.points.length >= 2 ? (
                <PriceChart points={chart.data.points} period={period} />
              ) : (
                <View style={styles.chartEmpty}>
                  <Text style={styles.chartEmptyTitle}>{t("details.chartUnavailable")}</Text>
                  <Text style={styles.chartEmptyBody}>
                    {t("details.chartUnavailableBody", { symbol: asset.symbol, period })}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeading}>{t("details.marketInformation")}</Text>
              <InfoRow styles={styles} label={t("details.assetId")} value={formatAvailableText(asset.id)} />
              <InfoRow styles={styles} label={t("compare.change24h")} change={asset.changePercent} />
              <InfoRow
                styles={styles}
                label={t("details.dollarChange")}
                value={
                  asset.changeValue == null
                    ? undefined
                    : formatSignedCurrency(asset.changeValue)
                }
                tone={
                  asset.changeValue == null
                    ? undefined
                    : asset.changeValue > 0
                      ? "gain"
                      : asset.changeValue < 0
                        ? "loss"
                        : undefined
                }
              />
              <InfoRow styles={styles} label={t("details.high24h")} value={formatAvailableCurrency(asset.high)} />
              <InfoRow styles={styles} label={t("details.low24h")} value={formatAvailableCurrency(asset.low)} />
              <InfoRow styles={styles} label={t("details.open24h")} value={formatAvailableCurrency(asset.open)} />
              <InfoRow
                styles={styles}
                label={t("details.whereTrades")}
                value={formatAvailableText(venueLabel(asset.venue))}
              />
              <InfoRow styles={styles} label={t("details.blockchain")} value={formatAvailableText(asset.chain)} />
              <InfoRow
                styles={styles}
                label={t("details.assetClass")}
                value={formatAvailableText(asset.assetClass)}
              />
              <InfoRow
                styles={styles}
                label={t("details.circulatingSupply")}
                value={formatCompactNumber(asset.circulatingSupply)}
              />
              <InfoRow
                styles={styles}
                label={t("details.totalSupply")}
                value={formatCompactNumber(asset.totalSupply)}
              />
              <InfoRow
                styles={styles}
                label={t("details.maxSupply")}
                value={formatCompactNumber(asset.maxSupply)}
              />
              <InfoRow
                styles={styles}
                label={t("details.website")}
                value={displayWebsite(asset.website)}
                onPress={asset.website ? () => void openWebsite() : undefined}
              />
              <InfoRow styles={styles} label={t("details.contract")} value={shortenAddress(asset.address)} />
              <InfoRow
                styles={styles}
                label={t("details.availableToBuy")}
                value={tradeableLabel(asset.tradeable)}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeading}>{t("details.understand", { symbol: asset.symbol })}</Text>
              <Text style={styles.eduLabel}>{t("details.whatIsIt")}</Text>
              <Text style={styles.description}>{education.whatIsIt}</Text>
              <Text style={styles.eduLabel}>{t("details.howItWorks")}</Text>
              <Text style={styles.description}>{education.howItWorks}</Text>
              <Text style={styles.eduLabel}>{t("details.whyMatters")}</Text>
              <Text style={styles.description}>{education.whyPeopleUseIt}</Text>
              <Text style={styles.eduLabel}>{t("details.thingsToUnderstand")}</Text>
              <Text style={styles.description}>{education.beginnerNotes}</Text>
              <Text style={styles.eduLabel}>{t("details.risks")}</Text>
              <Text style={styles.description}>{education.riskNotes}</Text>
              <Text style={styles.disclaimer}>{t("advice.disclaimer")}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHeading}>{t("details.whyThisAsset")}</Text>
              <Text style={styles.description}>
                {t("details.whyPeopleExplore", { name: asset.name })}
              </Text>
              {education.whyExplore.map((item) => (
                <Text key={item} style={styles.bullet}>
                  · {item}
                </Text>
              ))}
              <Text style={styles.disclaimer}>{t("advice.disclaimer")}</Text>
            </View>

            {asset.description ? (
              <View style={styles.card}>
                <Text style={styles.cardHeading}>{t("details.about")}</Text>
                <Text style={styles.description}>{asset.description.trim()}</Text>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.actions}>
            <View style={styles.tradeRow}>
              <View style={styles.tradeButton}>
                <Button
                  title={watched ? t("watchlist.title") : t("watchlist.title")}
                  variant="secondary"
                  onPress={() => void toggleFavorite(asset.symbol)}
                />
              </View>
              <View style={styles.tradeButton}>
                <Button title={t("common.compare")} variant="secondary" onPress={openCompare} />
              </View>
            </View>
            <View style={styles.tradeRow}>
              <View style={styles.tradeButton}>
                <PrimaryButton
                  title={t("common.buy")}
                  onPress={() =>
                    navigation.navigate("BuyAsset", { symbol: asset.symbol, side: "buy" })
                  }
                />
              </View>
              <View style={styles.tradeButton}>
                <Button
                  title={t("common.sell")}
                  variant="secondary"
                  onPress={() =>
                    navigation.navigate("BuyAsset", { symbol: asset.symbol, side: "sell" })
                  }
                />
              </View>
            </View>
          </View>
        </>
      )}
    </Screen>
  );
}

function InfoRow({
  styles,
  label,
  value,
  change,
  tone,
  onPress,
}: {
  styles: AssetDetailsStyles;
  label: string;
  value?: string | null;
  change?: number | null;
  tone?: "gain" | "loss";
  onPress?: () => void;
}) {
  const { t } = useTranslation();
  const content = (
    <>
      <Text style={styles.infoLabel}>{label}</Text>
      {change !== undefined ? (
        <PriceChange percent={change} />
      ) : (
        <Text
          style={[
            styles.infoValue,
            tone === "gain" ? styles.gainText : null,
            tone === "loss" ? styles.lossText : null,
            onPress ? styles.linkText : null,
          ]}
        >
          {value ?? t("common.unavailable")}
        </Text>
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={styles.infoRow} accessibilityRole="link">
        {content}
      </Pressable>
    );
  }

  return <View style={styles.infoRow}>{content}</View>;
}
