import { StyleSheet, Text, View } from "react-native";
import { t } from "../i18n/translate";
import { colors, radius } from "../theme";
import type { OrderStatus } from "../types/trading";

const STATUS_KEYS: Record<OrderStatus, string> = {
  submitted: "status.submitted",
  pending: "status.pending",
  filled: "status.filled",
  failed: "status.failed",
  cancelled: "status.cancelled",
  unknown: "status.unknown",
};

export function formatOrderStatus(status: string): string {
  if (status in STATUS_KEYS) {
    return t(STATUS_KEYS[status as OrderStatus]);
  }
  return t("status.unknown");
}

export function OrderStatusBadge({ status }: { status: string }) {
  const normalized = status in STATUS_KEYS ? (status as OrderStatus) : "unknown";
  const tone = styles[normalized];

  return (
    <View style={[styles.badge, tone]}>
      <Text style={[styles.label, styles[`${normalized}Label`]]}>
        {formatOrderStatus(normalized)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
  },
  submitted: {
    backgroundColor: colors.primaryLight,
  },
  submittedLabel: {
    color: colors.primaryDark,
  },
  pending: {
    backgroundColor: colors.primaryLight,
  },
  pendingLabel: {
    color: colors.primaryDark,
  },
  filled: {
    backgroundColor: colors.gainLight,
  },
  filledLabel: {
    color: colors.gain,
  },
  failed: {
    backgroundColor: colors.errorLight,
  },
  failedLabel: {
    color: colors.error,
  },
  cancelled: {
    backgroundColor: colors.surface,
  },
  cancelledLabel: {
    color: colors.muted,
  },
  unknown: {
    backgroundColor: colors.surface,
  },
  unknownLabel: {
    color: colors.muted,
  },
});
