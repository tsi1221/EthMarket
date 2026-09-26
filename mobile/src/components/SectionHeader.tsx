import { Pressable, StyleSheet, Text, View } from "react-native";
import { touch } from "../theme";
import { useTheme } from "../theme/ThemeProvider";

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function SectionHeader({
  title,
  actionLabel,
  onActionPress,
}: SectionHeaderProps) {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.row}>
      <Text style={typography.titleSmall}>{title}</Text>
      {actionLabel && onActionPress ? (
        <Pressable
          onPress={onActionPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={styles.actionHit}
        >
          <Text style={[styles.action, { color: colors.primary }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: touch.min,
  },
  actionHit: {
    minHeight: touch.min,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  action: {
    fontSize: 14,
    fontWeight: "700",
  },
});
