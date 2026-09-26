import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo } from "react";
import { Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { getErrorMessage } from "../api/errors";
import { EmptyState } from "../components/EmptyState";
import { ErrorBanner } from "../components/ErrorBanner";
import { LoadingSkeleton } from "../components/LoadingSkeleton";
import { OrderStatusBadge } from "../components/OrderStatusBadge";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { ScreenHeader } from "../components/ScreenHeader";
import { useOrdersQuery } from "../hooks/useOrdersQuery";
import { useTranslation } from "../i18n/LanguageProvider";
import type { AppStackParamList } from "../navigation/types";
import { radius, spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";
import type { LocalOrder, OrderStatus } from "../types/trading";
import { formatOrderDate } from "../utils/format";

type OrderHistoryScreenProps = NativeStackScreenProps<AppStackParamList, "OrderHistory">;

function isOpenStatus(status: OrderStatus): boolean {
  return status === "submitted" || status === "pending" || status === "unknown";
}

export function OrderHistoryScreen({ navigation }: OrderHistoryScreenProps) {
  const { t } = useTranslation();
  const { colors, typography, cardStyle } = useTheme();
  const ordersQuery = useOrdersQuery();
  const orders = ordersQuery.data ?? [];

  const groups = useMemo(() => {
    const open: LocalOrder[] = [];
    const completed: LocalOrder[] = [];
    const failed: LocalOrder[] = [];
    const cancelled: LocalOrder[] = [];

    for (const order of orders) {
      if (order.status === "filled") {
        completed.push(order);
      } else if (order.status === "failed") {
        failed.push(order);
      } else if (order.status === "cancelled") {
        cancelled.push(order);
      } else if (isOpenStatus(order.status)) {
        open.push(order);
      } else {
        open.push(order);
      }
    }

    return [
      { key: "open", title: t("orders.open"), items: open },
      { key: "completed", title: t("orders.completed"), items: completed },
      { key: "failed", title: t("orders.failed"), items: failed },
      { key: "cancelled", title: t("orders.cancelled"), items: cancelled },
    ].filter((group) => group.items.length > 0);
  }, [orders, t]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        state: {
          gap: spacing.md,
        },
        list: {
          gap: spacing.md,
        },
        sectionTitle: {
          ...typography.titleSmall,
          marginBottom: spacing.sm,
        },
        section: {
          gap: spacing.sm,
        },
        card: {
          ...cardStyle,
          borderRadius: radius.md,
          padding: spacing.md,
          gap: 6,
        },
        pressed: {
          opacity: 0.92,
        },
        cardTop: {
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: spacing.md,
        },
        cardCopy: {
          flex: 1,
        },
        symbol: {
          color: colors.text,
          fontSize: 18,
          fontWeight: "800",
        },
        side: {
          color: colors.muted,
          fontSize: 14,
          fontWeight: "700",
          marginTop: 2,
        },
        amount: {
          color: colors.text,
          fontSize: 15,
          fontWeight: "600",
        },
        meta: {
          color: colors.muted,
          fontSize: 13,
        },
        orderId: {
          color: colors.muted,
          fontSize: 12,
          fontWeight: "600",
        },
      }),
    [colors, cardStyle, typography],
  );

  return (
    <Screen
      scroll
      edges={["top", "bottom"]}
      refreshControl={
        <RefreshControl
          refreshing={ordersQuery.isRefetching && !ordersQuery.isLoading}
          onRefresh={() => void ordersQuery.refetch()}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <ScreenHeader
        title={t("orders.title")}
        subtitle={t("orders.subtitle")}
        onBack={() => navigation.goBack()}
      />

      {ordersQuery.isError && orders.length === 0 && !ordersQuery.data ? (
        <View style={styles.state}>
          <ErrorBanner message={getErrorMessage(ordersQuery.error)} />
          <PrimaryButton
            title={t("common.tryAgain")}
            onPress={() => void ordersQuery.refetch()}
          />
        </View>
      ) : ordersQuery.isLoading && !ordersQuery.data ? (
        <LoadingSkeleton rows={4} />
      ) : (
        <>
          {ordersQuery.isError ? (
            <View style={styles.state}>
              <ErrorBanner message={getErrorMessage(ordersQuery.error)} />
              <PrimaryButton
                title={t("common.tryAgain")}
                onPress={() => void ordersQuery.refetch()}
              />
            </View>
          ) : null}
          {orders.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title={t("orders.emptyTitle")}
              body={t("orders.emptyBody")}
              actionLabel={t("common.explore")}
              onActionPress={() => navigation.navigate("Explore")}
            />
          ) : (
            <View style={styles.list}>
              {groups.map((group) => (
                <View key={group.key} style={styles.section}>
                  <Text style={styles.sectionTitle}>{group.title}</Text>
                  {group.items.map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      styles={styles}
                      onPress={() =>
                        navigation.navigate("OrderDetails", { orderId: order.id })
                      }
                    />
                  ))}
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}

function OrderRow({
  order,
  onPress,
  styles,
}: {
  order: LocalOrder;
  onPress: () => void;
  styles: ReturnType<typeof StyleSheet.create>;
}) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
      accessibilityRole="button"
      accessibilityLabel={`${order.symbol} ${order.side} order`}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardCopy}>
          <Text style={styles.symbol}>{order.symbol}</Text>
          <Text style={styles.side}>
            {order.side === "buy" ? t("common.buy") : t("common.sell")}
          </Text>
        </View>
        <OrderStatusBadge status={order.status} />
      </View>
      <Text style={styles.amount}>{t("orders.amount", { qty: order.quantity })}</Text>
      <Text style={styles.meta}>{formatOrderDate(order.createdAt)}</Text>
      <Text style={styles.orderId} numberOfLines={1}>
        {t("orders.orderId", { id: order.trueMarketsOrderId })}
      </Text>
    </Pressable>
  );
}
