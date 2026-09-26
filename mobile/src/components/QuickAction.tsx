import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, touch } from "../theme";

type QuickActionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

export function QuickAction({ icon, label, onPress }: QuickActionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed ? styles.pressed : null]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.icon}>
        <Ionicons name={icon} size={20} color={colors.primaryDark} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    alignItems: "center",
    gap: spacing.sm,
    minHeight: touch.min + 28,
  },
  pressed: {
    opacity: 0.86,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
});
