import { StyleSheet, Text, View } from "react-native";
import { radius, spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";
import { formatPercent } from "../utils/format";

type PriceChangeProps = {
  percent: number | null | undefined;
  size?: "sm" | "md";
};

export function PriceChange({ percent, size = "sm" }: PriceChangeProps) {
  const { colors } = useTheme();

  if (percent === null || percent === undefined || !Number.isFinite(percent)) {
    return (
      <View
        style={[
          styles.pill,
          { backgroundColor: colors.background },
          size === "md" ? styles.md : null,
        ]}
      >
        <Text
          style={[
            styles.label,
            { color: colors.textSecondary },
            size === "md" ? styles.mdText : null,
          ]}
        >
          Unavailable
        </Text>
      </View>
    );
  }

  const isPositive = percent >= 0;

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: isPositive ? colors.gainLight : colors.lossLight,
        },
        size === "md" ? styles.md : null,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: isPositive ? colors.gain : colors.loss },
          size === "md" ? styles.mdText : null,
        ]}
      >
        {formatPercent(percent)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  md: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
  mdText: {
    fontSize: 15,
  },
});
