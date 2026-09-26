import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "../components/Button";
import { ErrorBanner } from "../components/ErrorBanner";
import { FilterChip } from "../components/FilterChip";
import { LiveDataBadge } from "../components/LiveDataBadge";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { ScreenHeader } from "../components/ScreenHeader";
import { TextField } from "../components/TextField";
import { useTradeQuoteMutation } from "../hooks/useTradeQuote";
import { useTradingCapabilities } from "../hooks/useTradingCapabilities";
import { useAuthStore } from "../store/authStore";
import { useBackendStatus } from "../store/backendStatus";
import type { AppStackParamList } from "../navigation/types";
import { radius, spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";
import type { NormalizedTradeQuote, TradeQtyUnit, TradeSide } from "../types/trading";
import {
  isLiveTrueMarketsQuote,
  quoteBtcAmount,
  quoteExpiryLabel,
  quoteFeeLabel,
  quotePriceLabel,
  quoteUsdcAmount,
  resolveQuoteFailure,
} from "../utils/quotePresentation";
import { useTranslation } from "../i18n/LanguageProvider";

type BuyAssetScreenProps = NativeStackScreenProps<AppStackParamList, "BuyAsset">;

const QUOTE_ASSET = "USDC";

export function BuyAssetScreen({ navigation, route }: BuyAssetScreenProps) {
  const { t } = useTranslation();
  const { colors, typography, cardStyle } = useTheme();
  const symbol = route.params.symbol.toUpperCase();
  const [side, setSide] = useState<TradeSide>(route.params.side ?? "buy");
  const [qtyUnit, setQtyUnit] = useState<TradeQtyUnit>(
    route.params.side === "sell" ? "base" : "quote",
  );
  const [amount, setAmount] = useState("");
  const [quote, setQuote] = useState<NormalizedTradeQuote | null>(null);
  const mutation = useTradeQuoteMutation();
  const token = useAuthStore((state) => state.token);
  const backendStatus = useBackendStatus((state) => state.status);
  const capabilities = useTradingCapabilities();
  const quotesEnabled = capabilities.data?.quotesEnabled ?? false;
  const tradingMessage = capabilities.data?.message;
  const backendUnreachable = backendStatus === "unavailable";
  const isBuy = side === "buy";

  const styles = useMemo(
    () =>
      StyleSheet.create({
        section: {
          marginBottom: spacing.md,
          gap: spacing.sm,
        },
        label: {
          ...typography.label,
        },
        form: {
          gap: spacing.md,
        },
        chips: {
          flexDirection: "row",
          gap: spacing.sm,
        },
        chip: {
          flex: 1,
        },
        helper: {
          ...typography.subtitle,
          fontSize: 14,
          marginTop: spacing.md,
        },
        loading: {
          color: colors.primaryDark,
          fontSize: 14,
          fontWeight: "700",
        },
        quoteCard: {
          ...cardStyle,
          marginTop: spacing.lg,
          padding: spacing.md,
          gap: spacing.sm,
        },
        quoteNotice: {
          color: colors.text,
          backgroundColor: colors.primaryLight,
          borderRadius: radius.md,
          overflow: "hidden",
          fontSize: 14,
          lineHeight: 20,
          fontWeight: "700",
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.sm,
        },
        eduNote: {
          ...typography.caption,
          marginTop: spacing.xs,
        },
        quoteRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          gap: spacing.md,
          paddingVertical: 8,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        quoteLabel: {
          color: colors.textSecondary,
          fontSize: 14,
          fontWeight: "600",
        },
        quoteValue: {
          color: colors.text,
          fontSize: 14,
          fontWeight: "700",
          textAlign: "right",
          flexShrink: 1,
        },
        issue: {
          color: colors.error,
          fontSize: 13,
          lineHeight: 18,
        },
        actions: {
          marginTop: spacing.xl,
        },
      }),
    [cardStyle, colors, typography],
  );
  const amountError = useMemo(() => {
    const trimmed = amount.trim();
    if (!trimmed) {
      return null;
    }
    if (!/^\d+(\.\d+)?$/.test(trimmed) || Number(trimmed) <= 0) {
      return t("buy.amountError");
    }
    return null;
  }, [amount, t]);

  async function handleGetQuote() {
    const trimmed = amount.trim();
    if (!trimmed || amountError || backendUnreachable) {
      return;
    }

    setQuote(null);
    try {
      const next = await mutation.mutateAsync({
        base_asset: symbol,
        quote_asset: QUOTE_ASSET,
        qty: trimmed,
        qty_unit: qtyUnit,
        side,
      });
      setQuote(isLiveTrueMarketsQuote(next) ? next : null);
    } catch {
      setQuote(null);
    }
  }

  function handleReview() {
    if (!quote || !isLiveTrueMarketsQuote(quote)) {
      return;
    }

    navigation.navigate("ConfirmOrder", {
      quote,
      request: {
        base_asset: symbol,
        quote_asset: QUOTE_ASSET,
        qty: amount.trim(),
        qty_unit: qtyUnit,
        side,
        type: "market",
      },
    });
  }

  function handleCancel() {
    if (quote || mutation.isError) {
      setQuote(null);
      mutation.reset();
      return;
    }
    navigation.goBack();
  }

  const failure = mutation.isError
    ? resolveQuoteFailure({ error: mutation.error, backendUnreachable })
    : null;
  const usdcAmount = quote ? quoteUsdcAmount(quote) : null;
  const btcAmount = quote ? quoteBtcAmount(quote) : null;
  const priceLabel = quote ? quotePriceLabel(quote) : null;
  const feeLabel = quote ? quoteFeeLabel(quote) : null;
  const expiryLabel = quote ? quoteExpiryLabel(quote) : null;
  const showLiveQuote = Boolean(quote && quote.live && quote.source === "truemarkets");

  return (
    <Screen scroll edges={["top", "bottom"]}>
      <ScreenHeader
        title={isBuy ? t("buy.title", { symbol }) : t("sell.title", { symbol })}
        subtitle={t("quote.subtitle")}
        onBack={() => navigation.goBack()}
      />

      <View style={styles.section}>
        <Text style={styles.label}>{t("quote.action")}</Text>
        <View style={styles.chips}>
          {(["buy", "sell"] as const).map((option) => (
            <FilterChip
              key={option}
              label={option === "buy" ? t("common.buy") : t("common.sell")}
              selected={option === side}
              onPress={() => {
                setSide(option);
                setQtyUnit(option === "sell" ? "base" : "quote");
                setQuote(null);
                mutation.reset();
              }}
              style={styles.chip}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t("quote.amountType")}</Text>
        <View style={styles.chips}>
          <FilterChip
            label={t("quote.usdcAmount")}
            selected={qtyUnit === "quote"}
            onPress={() => {
              setQtyUnit("quote");
              setQuote(null);
              mutation.reset();
            }}
            style={styles.chip}
          />
          <FilterChip
            label={t("quote.assetAmount", { symbol })}
            selected={qtyUnit === "base"}
            onPress={() => {
              setQtyUnit("base");
              setQuote(null);
              mutation.reset();
            }}
            style={styles.chip}
          />
        </View>
      </View>

      <View style={styles.form}>
        <TextField
          label={
            isBuy
              ? qtyUnit === "quote"
                ? t("quote.youPay")
                : t("quote.youBuy", { symbol })
              : qtyUnit === "base"
                ? t("quote.youSell")
                : t("quote.youSellWorth")
          }
          value={amount}
          onChangeText={(value) => {
            setAmount(value);
            setQuote(null);
            mutation.reset();
          }}
          keyboardType="decimal-pad"
          placeholder={qtyUnit === "quote" ? "5" : "0.00005"}
          error={amountError ?? undefined}
          returnKeyType="done"
          onSubmitEditing={() => void handleGetQuote()}
        />

        {capabilities.isLoading ? (
          <Text style={styles.helper}>{t("quote.checkingQuotes")}</Text>
        ) : null}
        {backendUnreachable ? (
          <ErrorBanner
            title={t("quote.fail.live_unavailable.title")}
            message={t("quote.fail.live_unavailable.message")}
          />
        ) : null}
        {token && !backendUnreachable && tradingMessage && !quotesEnabled ? (
          <ErrorBanner message={tradingMessage} />
        ) : null}
        {!token ? (
          <ErrorBanner
            title={t("quote.fail.session_expired.title")}
            message={t("quote.fail.session_expired.message")}
          />
        ) : null}
        {mutation.isPending ? <Text style={styles.loading}>{t("quote.getting")}</Text> : null}
        {failure ? <ErrorBanner title={failure.title} message={failure.message} /> : null}

        <PrimaryButton
          title={t("quote.getLive")}
          loading={mutation.isPending}
          disabled={
            !token || backendUnreachable || !quotesEnabled || !amount.trim() || Boolean(amountError)
          }
          onPress={() => void handleGetQuote()}
        />
        {failure ? (
          <Button title={t("common.tryAgain")} variant="secondary" onPress={() => void handleGetQuote()} />
        ) : null}
      </View>

      {showLiveQuote && quote ? (
        <View style={styles.quoteCard}>
          <LiveDataBadge state="live" compact />
          <Text style={styles.quoteNotice}>{t("quote.onlyNotice")}</Text>
          <QuoteRow
            label={isBuy ? t("quote.estimatedReceive") : t("quote.estimatedUsdc")}
            value={(isBuy ? btcAmount : usdcAmount) ?? "Unavailable"}
            styles={styles}
          />
          {priceLabel ? (
            <QuoteRow label={t("quote.livePrice")} value={priceLabel} styles={styles} />
          ) : null}
          {usdcAmount && isBuy ? (
            <QuoteRow label={t("quote.youPay")} value={usdcAmount} styles={styles} />
          ) : null}
          {btcAmount && !isBuy ? (
            <QuoteRow label={t("quote.youSell")} value={btcAmount} styles={styles} />
          ) : null}
          {quote.quoteId ? <QuoteRow label={t("quote.quoteId")} value={quote.quoteId} styles={styles} /> : null}
          {feeLabel ? <QuoteRow label={t("quote.fee")} value={feeLabel} styles={styles} /> : null}
          {expiryLabel ? <QuoteRow label={t("quote.expires")} value={expiryLabel} styles={styles} /> : null}
          {quote.issues.length > 0 ? <Text style={styles.issue}>{quote.issues.join(" ")}</Text> : null}
          <Text style={styles.eduNote}>
            {t("quote.priceChangeWarning")}
          </Text>
          <PrimaryButton
            title={isBuy ? t("quote.reviewBuy") : t("quote.reviewSell")}
            onPress={handleReview}
          />
        </View>
      ) : (
        <Text style={styles.helper}>{t("quote.enterAmountHint")}</Text>
      )}

      <View style={styles.actions}>
        <Button
          title={quote || mutation.isError ? t("quote.clear") : t("common.cancel")}
          variant="secondary"
          onPress={handleCancel}
        />
      </View>
    </Screen>
  );
}

function QuoteRow({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: {
    quoteRow: object;
    quoteLabel: object;
    quoteValue: object;
  };
}) {
  return (
    <View style={styles.quoteRow}>
      <Text style={styles.quoteLabel}>{label}</Text>
      <Text style={styles.quoteValue}>{value}</Text>
    </View>
  );
}
