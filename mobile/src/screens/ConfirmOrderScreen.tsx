import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { ORDER_EXECUTION_ENABLED } from "../brand";
import { getErrorMessage } from "../api/errors";
import { Button } from "../components/Button";
import { ErrorBanner } from "../components/ErrorBanner";
import { LiveDataBadge } from "../components/LiveDataBadge";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTradeOrderMutation } from "../hooks/useTradeQuote";
import { useTradingCapabilities } from "../hooks/useTradingCapabilities";
import { useTranslation } from "../i18n/LanguageProvider";
import type { AppStackParamList } from "../navigation/types";
import { spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";
import {
  quoteBtcAmount,
  quoteFeeLabel,
  quotePriceLabel,
  quoteUsdcAmount,
} from "../utils/quotePresentation";
import { UNAVAILABLE } from "../utils/format";

type ConfirmOrderScreenProps = NativeStackScreenProps<AppStackParamList, "ConfirmOrder">;

export function ConfirmOrderScreen({ navigation, route }: ConfirmOrderScreenProps) {
  const { t } = useTranslation();
  const { colors, typography, cardStyle } = useTheme();
  const { quote, request } = route.params;
  const capabilities = useTradingCapabilities();
  const orderMutation = useTradeOrderMutation();
  const isBuy = quote.side === "buy";
  const title = isBuy
    ? t("buy.title", { symbol: quote.baseAsset })
    : t("sell.title", { symbol: quote.baseAsset });
  const usdcAmount = quoteUsdcAmount(quote);
  const btcAmount = quoteBtcAmount(quote);
  const priceLabel = quotePriceLabel(quote);
  const feeLabel = quoteFeeLabel(quote);
  const expiresAt = quote.expiresAt ? Date.parse(quote.expiresAt) : Number.NaN;
  const quoteExpired = Number.isFinite(expiresAt) && expiresAt <= Date.now();
  const ordersEnabled =
    ORDER_EXECUTION_ENABLED && (capabilities.data?.ordersEnabled ?? false);
  const payLabel = isBuy
    ? usdcAmount ??
      (request.qty_unit === "quote"
        ? `${request.qty} ${request.quote_asset}`
        : UNAVAILABLE)
    : btcAmount ??
      (request.qty_unit === "base" ? `${request.qty} ${request.base_asset}` : UNAVAILABLE);
  const receiveLabel = isBuy ? btcAmount ?? UNAVAILABLE : usdcAmount ?? UNAVAILABLE;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          ...cardStyle,
          padding: spacing.md,
          marginTop: spacing.md,
        },
        notice: {
          color: colors.text,
          backgroundColor: colors.primaryLight,
          borderRadius: 12,
          overflow: "hidden",
          fontSize: 14,
          lineHeight: 20,
          fontWeight: "700",
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.sm,
          marginTop: spacing.lg,
        },
        warning: {
          ...typography.caption,
          marginTop: spacing.sm,
        },
        issue: {
          color: colors.error,
          fontSize: 13,
          lineHeight: 18,
          marginTop: spacing.md,
        },
        actions: {
          marginTop: spacing.xl,
          gap: spacing.sm,
        },
        footer: {
          ...typography.caption,
          marginTop: spacing.lg,
        },
      }),
    [cardStyle, colors, typography],
  );

  async function handleConfirm() {
    if (!ordersEnabled || quoteExpired || orderMutation.isPending) {
      return;
    }

    try {
      const order = await orderMutation.mutateAsync(request);
      navigation.replace("OrderDetails", { orderId: order.id });
    } catch {
      // Error banner below uses mutation.error
    }
  }

  return (
    <Screen scroll edges={["top", "bottom"]}>
      <ScreenHeader
        title={title}
        subtitle={t("quote.reviewSubtitle")}
        onBack={() => navigation.goBack()}
      />

      <LiveDataBadge state="live" />

      <View style={styles.card}>
        <Row
          label={isBuy ? t("quote.youPay") : t("quote.youSell")}
          value={payLabel}
          first
        />
        <Row label={t("quote.estimatedReceive")} value={receiveLabel} />
        <Row label={t("common.price")} value={priceLabel ?? UNAVAILABLE} />
        <Row label={t("quote.source")} value="True Markets" />
        {feeLabel ? <Row label={t("quote.fee")} value={feeLabel} /> : null}
        {quote.quoteId ? <Row label={t("quote.quoteId")} value={quote.quoteId} /> : null}
      </View>

      <Text style={styles.notice}>{t("quote.onlyNotice")}</Text>
      <Text style={styles.warning}>{t("quote.priceChangeWarning")}</Text>

      {!ordersEnabled ? (
        <ErrorBanner
          title={t("quote.orderUnavailable")}
          message={t("quote.executionOff")}
        />
      ) : null}

      {quoteExpired ? <Text style={styles.issue}>{t("quote.expired")}</Text> : null}

      {quote.issues.length > 0 ? (
        <Text style={styles.issue}>{quote.issues.join(" ")}</Text>
      ) : null}

      {orderMutation.isError ? (
        <ErrorBanner message={getErrorMessage(orderMutation.error)} />
      ) : null}

      {orderMutation.isPending ? (
        <View style={{ marginTop: spacing.md, alignItems: "center", gap: spacing.sm }}>
          <ActivityIndicator color={colors.primary} />
          <Text style={typography.caption}>{t("quote.submitting")}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button title={t("common.cancel")} variant="secondary" onPress={() => navigation.goBack()} />
        <PrimaryButton
          title={isBuy ? t("quote.confirmBuy") : t("quote.confirmSell")}
          disabled={!ordersEnabled || quoteExpired || orderMutation.isPending}
          loading={orderMutation.isPending}
          onPress={() => void handleConfirm()}
        />
      </View>

      <Text style={styles.footer}>{t("quote.executionOff")}</Text>
    </Screen>
  );
}

function Row({
  label,
  value,
  first = false,
}: {
  label: string;
  value: string;
  first?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        gap: spacing.md,
        paddingVertical: 10,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: colors.border,
        paddingTop: first ? 0 : 10,
      }}
    >
      <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "600" }}>
        {label}
      </Text>
      <Text
        style={{
          color: colors.text,
          fontSize: 14,
          fontWeight: "700",
          textAlign: "right",
          flexShrink: 1,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
