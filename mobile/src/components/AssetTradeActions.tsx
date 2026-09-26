import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../i18n/LanguageProvider";
import { radius, spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";

type AssetTradeActionsProps = {
  symbol: string;
  onBuy: () => void;
  onSell: () => void;
  onCompare: () => void;
  compact?: boolean;
};

export function AssetTradeActions({
  symbol,
  onBuy,
  onSell,
  onCompare,
  compact = false,
}: AssetTradeActionsProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={[styles.row, compact ? styles.compact : null]}>
      <ActionButton
        label={t("common.buy")}
        backgroundColor={colors.accent}
        textColor={colors.white}
        onPress={onBuy}
        accessibilityLabel={t("compare.buySymbol", { symbol })}
      />
      <ActionButton
        label={t("common.sell")}
        backgroundColor={colors.errorLight}
        textColor={colors.error}
        borderColor={colors.errorBorder}
        onPress={onSell}
        accessibilityLabel={t("compare.sellSymbol", { symbol })}
      />
      <ActionButton
        label={t("common.compare")}
        backgroundColor={colors.primaryLight}
        textColor={colors.primaryDark}
        onPress={onCompare}
        accessibilityLabel={`${t("common.compare")} ${symbol}`}
      />
    </View>
  );
}

function ActionButton({
  label,
  backgroundColor,
  textColor,
  borderColor,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  backgroundColor: string;
  textColor: string;
  borderColor?: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          borderWidth: borderColor ? 1 : 0,
          borderColor: borderColor ?? "transparent",
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    width: "100%",
  },
  compact: {
    marginTop: spacing.sm,
  },
  button: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
  },
});
