import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import { radius, spacing, touch } from "../theme";
import { useTheme } from "../theme/ThemeProvider";

type FilterChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
};

export function FilterChip({ label, selected = false, onPress, style }: FilterChipProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: selected ? colors.primaryLight : colors.border,
          backgroundColor: selected ? colors.primaryLight : colors.surface,
          opacity: pressed ? 0.88 : 1,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? colors.primaryDark : colors.textSecondary },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: touch.min,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
  },
});
