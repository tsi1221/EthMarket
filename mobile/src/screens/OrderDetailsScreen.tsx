import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo } from "react";
import { RefreshControl, StyleSheet, Text, View } from "react-native";
import { getErrorMessage } from "../api/errors";
import { ErrorBanner } from "../components/ErrorBanner";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { formatOrderStatus, OrderStatusBadge } from "../components/OrderStatusBadge";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { ScreenHeader } from "../components/ScreenHeader";
import { useOrderStatusQuery, useOrdersQuery } from "../hooks/useOrdersQuery";
import { useTranslation } from "../i18n/LanguageProvider";
import type { AppStackParamList } from "../navigation/types";
import { spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";
import { formatOrderDate } from "../utils/format";

type OrderDetailsScreenProps = NativeStackScreenProps<AppStackParamList, "OrderDetails">;

export function OrderDetailsScreen({ navigation, route }: OrderDetailsScreenProps) {
  const { t } = useTranslation();
  const { colors, cardStyle } = useTheme();
  const { orderId } = route.params;
  const listQuery = useOrdersQuery();
  const statusQuery = useOrderStatusQuery(orderId);
  const cached = listQuery.data?.find((item) => item.id === orderId);
  const refreshed = statusQuery.data;
  const order = refreshed ?? cached;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        state: {
          gap: spacing.md,
        },
        banner: {
          marginBottom: spacing.md,
        },
        statusRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          marginBottom: spacing.md,
        },
        statusHint: {
          flex: 1,
          color: colors.muted,
          fontSize: 13,
          lineHeight: 18,
        },
        card: {
          ...cardStyle,
          padding: spacing.md,
        },
        row: {
          flexDirection: "row",
          justifyContent: "space-between",
          gap: spacing.md,
          paddingVertical: 10,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        rowFirst: {
          borderTopWidth: 0,
          paddingTop: 0,
        },
        rowLabel: {
          color: colors.muted,
          fontSize: 14,
          fontWeight: "600",
        },
        rowValue: {
          color: colors.text,
          fontSize: 14,
          fontWeight: "700",
          textAlign: "right",
          flexShrink: 1,
        },
        notice: {
          color: colors.muted,
          fontSize: 14,
          lineHeight: 20,
          marginVertical: spacing.lg,
        },
      }),
    [colors, cardStyle],
  );

  async function refresh() {
    await statusQuery.refetch();
  }

  return (
    <Screen
      scroll
      edges={["top", "bottom"]}
      refreshControl={
        <RefreshControl
          refreshing={statusQuery.isRefetching && !statusQuery.isLoading}
          onRefresh={() => void refresh()}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <ScreenHeader
        title={t("orders.detailsTitle")}
        subtitle={t("orders.detailsSubtitle")}
        onBack={() => navigation.goBack()}
      />

      {statusQuery.isError && !order ? (
        <View style={styles.state}>
          <ErrorBanner message={getErrorMessage(statusQuery.error)} />
          <PrimaryButton title={t("common.tryAgain")} onPress={() => void refresh()} />
        </View>
      ) : !order && (statusQuery.isLoading || listQuery.isLoading) ? (
        <LoadingSkeleton rows={5} />
      ) : !order ? (
        <ErrorBanner message={t("orders.notFound")} />
      ) : (
        <>
          {statusQuery.isError ? (
            <View style={styles.banner}>
              <ErrorBanner message={getErrorMessage(statusQuery.error)} />
            </View>
          ) : null}

          <View style={styles.statusRow}>
            <OrderStatusBadge status={order.status} />
            <Text style={styles.statusHint}>
              {order.status === "filled"
                ? t("orders.statusFilledHint")
                : t("orders.statusNotFilledHint")}
            </Text>
          </View>

          <View style={styles.card}>
            <Row label={t("orders.assetLabel")} value={order.symbol} first styles={styles} />
            <Row
              label={t("orders.sideLabel")}
              value={order.side === "buy" ? t("common.buy") : t("common.sell")}
              styles={styles}
            />
            <Row label={t("common.amount")} value={order.quantity} styles={styles} />
            <Row label={t("orders.statusLabel")} value={formatOrderStatus(order.status)} styles={styles} />
            <Row label={t("orders.dateLabel")} value={formatOrderDate(order.createdAt)} styles={styles} />
            <Row label={t("orders.orderIdLabel")} value={order.trueMarketsOrderId} styles={styles} />
            <Row
              label={t("orders.typeLabel")}
              value={order.type === "market" ? t("orders.typeMarket") : order.type}
              styles={styles}
            />
            {refreshed?.remoteStatus ? (
              <Row label={t("orders.remoteStatusLabel")} value={refreshed.remoteStatus} styles={styles} />
            ) : null}
            <Row label={t("orders.lastChecked")} value={formatOrderDate(order.updatedAt)} styles={styles} />
          </View>

          <Text style={styles.notice}>
            {refreshed?.notice ?? t("orders.refreshNotice")}
          </Text>

          <PrimaryButton
            title={t("orders.refreshStatus")}
            loading={statusQuery.isFetching}
            onPress={() => void refresh()}
          />
        </>
      )}
    </Screen>
  );
}

function Row({
  label,
  value,
  first = false,
  styles,
}: {
  label: string;
  value: string;
  first?: boolean;
  styles: ReturnType<typeof StyleSheet.create>;
}) {
  return (
    <View style={[styles.row, first ? styles.rowFirst : null]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}
