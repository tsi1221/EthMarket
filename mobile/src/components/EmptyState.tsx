import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { radius, spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";
import { PrimaryButton } from "./PrimaryButton";

type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export function EmptyState({
  icon = "file-tray-outline",
  title,
  body,
  actionLabel,
  onActionPress,
}: EmptyStateProps) {
  const { colors, typography } = useTheme();

  return (
    <View style={styles.wrap} accessibilityRole="text">
      <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={[typography.titleSmall, styles.center]}>{title}</Text>
      <Text style={[typography.subtitle, styles.body]}>{body}</Text>
      {actionLabel && onActionPress ? (
        <View style={styles.action}>
          <PrimaryButton title={actionLabel} onPress={onActionPress} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  center: {
    textAlign: "center",
  },
  body: {
    textAlign: "center",
    maxWidth: 300,
    marginBottom: spacing.sm,
  },
  action: {
    minWidth: 200,
    alignSelf: "stretch",
    maxWidth: 280,
  },
});
