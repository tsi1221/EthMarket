import { useMemo } from "react";

import { Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { DataSourceBanner } from "../components/DataSourceBanner";

import { EmptyState } from "../components/EmptyState";

import { ErrorBanner } from "../components/ErrorBanner";

import { LoadingSkeleton } from "../components/LoadingSkeleton";

import { PortfolioCard } from "../components/PortfolioCard";

import { PriceChange } from "../components/PriceChange";

import { PrimaryButton } from "../components/PrimaryButton";

import { Screen } from "../components/Screen";

import { ScreenHeader } from "../components/ScreenHeader";

import { SectionHeader } from "../components/SectionHeader";

import { getErrorMessage } from "../api/errors";

import { useAppNavigation } from "../hooks/useAppNavigation";

import { usePortfolioQuery } from "../hooks/usePortfolioQuery";

import { useTranslation } from "../i18n/LanguageProvider";

import { useAuthStore } from "../store/authStore";

import { useBackendStatus } from "../store/backendStatus";

import { radius, spacing } from "../theme";

import { useTheme } from "../theme/ThemeProvider";

import type { PortfolioHoldingView, PortfolioResponse } from "../types/portfolio";

import {

  formatAvailableCurrency,

  formatQuantity,

  formatSignedCurrency,

  UNAVAILABLE,

} from "../utils/format";



const ALLOCATION_COLORS = ["#16A34A", "#14532D", "#4ADE80", "#86EFAC", "#166534"];

const CASH_COLOR = "#9CA3AF";



type PortfolioStyles = ReturnType<typeof createPortfolioStyles>;



function createPortfolioStyles(

  colors: ReturnType<typeof useTheme>["colors"],

  typography: ReturnType<typeof useTheme>["typography"],

  cardStyle: ReturnType<typeof useTheme>["cardStyle"],

) {

  return StyleSheet.create({

    title: {

      ...typography.title,

    },

    subtitle: {

      ...typography.subtitle,

      marginTop: 4,

      marginBottom: spacing.md,

    },

    notice: {

      backgroundColor: colors.primaryLight,

      borderRadius: radius.md,

      padding: spacing.md,

      marginBottom: spacing.lg,

    },

    noticeText: {

      color: colors.primaryDark,

      fontSize: 13,

      lineHeight: 18,

      fontWeight: "600",

    },

    state: {

      gap: spacing.md,

    },

    section: {

      marginTop: spacing.xl,

      gap: spacing.md,

    },

    card: {

      ...cardStyle,

      borderRadius: radius.md,

      padding: spacing.md,

      gap: spacing.md,

    },

    bar: {

      flexDirection: "row",

      height: 14,

      borderRadius: radius.full,

      overflow: "hidden",

      backgroundColor: colors.surface,

    },

    legend: {

      gap: 10,

    },

    legendRow: {

      flexDirection: "row",

      alignItems: "center",

      gap: spacing.sm,

    },

    dot: {

      width: 10,

      height: 10,

      borderRadius: 5,

    },

    legendLabel: {

      flex: 1,

      color: colors.text,

      fontSize: 14,

      fontWeight: "600",

    },

    legendValue: {

      color: colors.muted,

      fontSize: 14,

      fontWeight: "700",

    },

    perfRow: {

      flexDirection: "row",

      alignItems: "center",

      justifyContent: "space-between",

      gap: spacing.md,

      paddingBottom: spacing.sm,

      borderBottomWidth: 1,

      borderBottomColor: colors.border,

    },

    perfRowLast: {

      borderBottomWidth: 0,

      paddingBottom: 0,

    },

    perfLabel: {

      color: colors.muted,

      fontSize: 14,

      fontWeight: "600",

    },

    perfValue: {

      color: colors.text,

      fontSize: 14,

      fontWeight: "700",

    },

    perfChange: {

      alignItems: "flex-end",

      gap: 6,

    },

    unavailable: {

      color: colors.muted,

      fontSize: 14,

      fontWeight: "600",

    },

    list: {

      gap: spacing.sm,

    },

    holding: {

      ...cardStyle,

      flexDirection: "row",

      justifyContent: "space-between",

      alignItems: "center",

      borderRadius: radius.md,

      padding: spacing.md,

      gap: spacing.md,

    },

    pressed: {

      opacity: 0.92,

    },

    holdingCopy: {

      flex: 1,

    },

    symbol: {

      color: colors.text,

      fontSize: 16,

      fontWeight: "700",

    },

    meta: {

      color: colors.muted,

      fontSize: 13,

      marginTop: 3,

    },

    name: {

      color: colors.muted,

      fontSize: 12,

      marginTop: 2,

    },

    quote: {

      alignItems: "flex-end",

      gap: 6,

    },

    value: {

      color: colors.text,

      fontSize: 16,

      fontWeight: "700",

    },

    gain: {

      color: colors.gain,

    },

    loss: {

      color: colors.loss,

    },

  });

}



export function PortfolioScreen() {
  const { t } = useTranslation();
  const { colors, typography, cardStyle } = useTheme();

  const styles = useMemo(

    () => createPortfolioStyles(colors, typography, cardStyle),

    [colors, typography, cardStyle],

  );

  const navigation = useAppNavigation();

  const token = useAuthStore((state) => state.token);

  const backendStatus = useBackendStatus((state) => state.status);

  const portfolioQuery = usePortfolioQuery();

  const portfolio = portfolioQuery.data;

  const needsAccount = !token && backendStatus === "live";



  return (

    <Screen

      scroll

      edges={["top"]}

      refreshControl={

        <RefreshControl

          refreshing={portfolioQuery.isRefetching && !portfolioQuery.isLoading}

          onRefresh={() => void portfolioQuery.refetch()}

          tintColor={colors.primary}

          colors={[colors.primary]}

        />

      }

    >

      <ScreenHeader

        title={t("portfolio.title")}

        subtitle={t("portfolio.subtitle")}

        onBack={() => navigation.goBack()}

      />

      <DataSourceBanner />



      {needsAccount ? (

        <EmptyState

          icon="person-outline"

          title={t("portfolio.signInTitle")}

          body={t("portfolio.signInBody")}

          actionLabel={t("portfolio.openProfile")}

          onActionPress={() => navigation.navigate("Profile")}

        />

      ) : portfolioQuery.isError && !portfolio ? (

        <View style={styles.state}>

          <ErrorBanner message={getErrorMessage(portfolioQuery.error)} />

          <PrimaryButton title={t("common.tryAgain")} onPress={() => void portfolioQuery.refetch()} />

        </View>

      ) : portfolioQuery.isLoading || !portfolio ? (

        <LoadingSkeleton rows={5} />

      ) : (

        <>

          {portfolioQuery.isError ? (

            <View style={styles.state}>

              <ErrorBanner message={getErrorMessage(portfolioQuery.error)} />

            </View>

          ) : null}

          {portfolio.source === "preview" ? null : (

            <View style={styles.notice}>

              <Text style={styles.noticeText}>{portfolio.notice}</Text>

            </View>

          )}



          {portfolio.holdings.length === 0 ? (

            <EmptyState

              icon="pie-chart-outline"

              title={t("portfolio.noHoldingsTitle")}

              body={t("portfolio.noHoldingsBody")}

              actionLabel={t("common.explore")}

              onActionPress={() => navigation.navigate("Explore")}

            />

          ) : (

            <>

              <PortfolioCard portfolio={portfolio} />

              <AllocationCard portfolio={portfolio} styles={styles} t={t} />

              <PerformanceCard portfolio={portfolio} styles={styles} t={t} />

              <View style={styles.section}>

                <SectionHeader title={t("portfolio.sectionHoldings")} />

                <View style={styles.list}>

                  {portfolio.holdings.map((holding) => (

                    <HoldingRow

                      key={holding.symbol}

                      holding={holding}

                      styles={styles}

                      t={t}

                      onPress={() =>

                        navigation.navigate("AssetDetails", { symbol: holding.symbol })

                      }

                    />

                  ))}

                </View>

              </View>

            </>

          )}

        </>

      )}

    </Screen>

  );

}



function AllocationCard({

  portfolio,

  styles,

  t,

}: {

  portfolio: PortfolioResponse;

  styles: PortfolioStyles;

  t: ReturnType<typeof useTranslation>["t"];

}) {

  const cashShare =

    portfolio.totalValue != null && portfolio.totalValue > 0

      ? (portfolio.cash / portfolio.totalValue) * 100

      : null;

  const slices = [

    ...portfolio.holdings.map((holding, index) => ({

      key: holding.symbol,

      label: holding.symbol,

      percent: holding.allocationPercent,

      color: ALLOCATION_COLORS[index % ALLOCATION_COLORS.length],

    })),

    {

      key: "cash",

      label: t("portfolio.cashLegend"),

      percent: cashShare,

      color: CASH_COLOR,

    },

  ];

  const known = slices.filter((slice) => slice.percent != null && slice.percent > 0);



  return (

    <View style={styles.section}>

      <SectionHeader title={t("portfolio.allocation")} />

      <View style={styles.card}>

        {known.length === 0 ? (

          <Text style={styles.unavailable}>{t("portfolio.allocationUnavailable")}</Text>

        ) : (

          <>

            <View style={styles.bar}>

              {known.map((slice) => (

                <View

                  key={slice.key}

                  style={{

                    flex: Math.max(slice.percent ?? 0, 1),

                    backgroundColor: slice.color,

                  }}

                />

              ))}

            </View>

            <View style={styles.legend}>

              {slices.map((slice) => (

                <View key={slice.key} style={styles.legendRow}>

                  <View style={[styles.dot, { backgroundColor: slice.color }]} />

                  <Text style={styles.legendLabel}>{slice.label}</Text>

                  <Text style={styles.legendValue}>

                    {slice.percent == null ? UNAVAILABLE : `${slice.percent.toFixed(1)}%`}

                  </Text>

                </View>

              ))}

            </View>

          </>

        )}

      </View>

    </View>

  );

}



function PerformanceCard({

  portfolio,

  styles,

  t,

}: {

  portfolio: PortfolioResponse;

  styles: PortfolioStyles;

  t: ReturnType<typeof useTranslation>["t"];

}) {

  const pnl = portfolio.unrealizedPnl;



  return (

    <View style={styles.section}>

      <SectionHeader title={t("portfolio.performance")} />

      <View style={styles.card}>

        <PerfRow

          label={t("portfolio.amountInvested")}

          value={formatAvailableCurrency(portfolio.costBasis)}

          styles={styles}

        />

        <PerfRow

          label={t("portfolio.currentHoldings")}

          value={formatAvailableCurrency(portfolio.holdingsValue)}

          styles={styles}

        />

        <View style={styles.perfRow}>

          <Text style={styles.perfLabel}>{t("portfolio.unrealizedGl")}</Text>

          {pnl == null ? (

            <Text style={styles.unavailable}>{UNAVAILABLE}</Text>

          ) : (

            <View style={styles.perfChange}>

              <Text

                style={[

                  styles.perfValue,

                  pnl > 0 ? styles.gain : pnl < 0 ? styles.loss : null,

                ]}

              >

                {formatSignedCurrency(pnl)}

              </Text>

              <PriceChange percent={portfolio.unrealizedPnlPercent} />

            </View>

          )}

        </View>

        <View style={[styles.perfRow, styles.perfRowLast]}>

          <Text style={styles.perfLabel}>{t("portfolio.todayLabel")}</Text>

          {portfolio.todayChangeValue == null ? (

            <Text style={styles.unavailable}>{UNAVAILABLE}</Text>

          ) : (

            <View style={styles.perfChange}>

              <Text

                style={[

                  styles.perfValue,

                  portfolio.todayChangeValue > 0

                    ? styles.gain

                    : portfolio.todayChangeValue < 0

                      ? styles.loss

                      : null,

                ]}

              >

                {formatSignedCurrency(portfolio.todayChangeValue)}

              </Text>

              <PriceChange percent={portfolio.todayChangePercent} />

            </View>

          )}

        </View>

      </View>

    </View>

  );

}



function PerfRow({

  label,

  value,

  styles,

}: {

  label: string;

  value: string;

  styles: PortfolioStyles;

}) {

  return (

    <View style={styles.perfRow}>

      <Text style={styles.perfLabel}>{label}</Text>

      <Text style={styles.perfValue}>{value}</Text>

    </View>

  );

}



function HoldingRow({

  holding,

  onPress,

  styles,

  t,

}: {

  holding: PortfolioHoldingView;

  onPress: () => void;

  styles: PortfolioStyles;

  t: ReturnType<typeof useTranslation>["t"];

}) {

  return (

    <Pressable

      onPress={onPress}

      style={({ pressed }) => [styles.holding, pressed ? styles.pressed : null]}

      accessibilityRole="button"

      accessibilityLabel={t("portfolio.holdingA11y", { symbol: holding.symbol })}

    >

      <View style={styles.holdingCopy}>

        <Text style={styles.symbol}>{holding.symbol}</Text>

        <Text style={styles.meta}>

          {t("portfolio.quantityAvg", {

            quantity: formatQuantity(holding.quantity),

            price: formatAvailableCurrency(holding.averageEntryPrice),

          })}

        </Text>

        {holding.name ? <Text style={styles.name}>{holding.name}</Text> : null}

      </View>

      <View style={styles.quote}>

        <Text style={styles.value}>{formatAvailableCurrency(holding.marketValue)}</Text>

        <PriceChange percent={holding.changePercent} />

      </View>

    </Pressable>

  );

}

