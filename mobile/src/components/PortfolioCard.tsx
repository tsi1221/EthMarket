import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../i18n/LanguageProvider";
import { radius, spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";
import type { PortfolioResponse } from "../types/portfolio";
import {
  formatAvailableCurrency,
  formatSignedCurrency,
  UNAVAILABLE,
} from "../utils/format";
import { PriceChange } from "./PriceChange";

type PortfolioCardProps = {
  portfolio: PortfolioResponse;
};

export function PortfolioCard({ portfolio }: PortfolioCardProps) {
  const { t } = useTranslation();
  const { colors, cardStyle } = useTheme();
  const change = portfolio.todayChangeValue;
  const isPositive = (change ?? 0) >= 0;
  const isDemo = portfolio.source === "demo" || portfolio.source === "preview";

  return (
    <View style={[cardStyle, styles.card]}>
      <View style={[styles.accent, { backgroundColor: colors.primary }]} />
      {isDemo ? (
        <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.badgeText, { color: colors.primaryDark }]}>
            {t("portfolio.demoBadge")}
          </Text>
        </View>
      ) : null}
      <Text style={[styles.label, { color: colors.muted }]}>
        {isDemo ? t("portfolio.simulatedValue") : t("portfolio.totalValue")}
      </Text>
      <Text style={[styles.value, { color: colors.text }]}>
        {formatAvailableCurrency(portfolio.totalValue)}
      </Text>
      <View style={styles.changeRow}>
        <PriceChange percent={portfolio.todayChangePercent} size="md" />
        <Text
          style={[
            styles.changeCopy,
            {
              color:
                change == null
                  ? colors.muted
                  : isPositive
                    ? colors.primaryDark
                    : colors.loss,
            },
          ]}
        >
          {change == null
            ? UNAVAILABLE
            : t("portfolio.today", { amount: formatSignedCurrency(change) })}
        </Text>
      </View>
      <Text style={[styles.cash, { color: colors.muted }]}>
        {t("portfolio.cash", { amount: formatAvailableCurrency(portfolio.cash) })}
        {portfolio.holdingsValue != null
          ? ` · ${t("portfolio.holdings", { amount: formatAvailableCurrency(portfolio.holdingsValue) })}`
          : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    overflow: "hidden",
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: spacing.sm,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  value: {
    fontSize: 32,
    fontWeight: "800",
    marginTop: spacing.xs,
    letterSpacing: -0.6,
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  changeCopy: {
    fontSize: 14,
    fontWeight: "600",
  },
  cash: {
    fontSize: 13,
    marginTop: spacing.sm,
  },
});
