import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { radius, spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";

type ErrorBannerProps = {
  message: string | null;
  title?: string | null;
};

export function ErrorBanner({ message, title }: ErrorBannerProps) {
  const { colors } = useTheme();

  if (!message && !title) {
    return null;
  }

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.errorLight,
          borderColor: colors.errorBorder,
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Ionicons name="alert-circle" size={18} color={colors.error} />
      <View style={styles.copy}>
        {title ? (
          <Text style={[styles.title, { color: colors.error }]}>{title}</Text>
        ) : null}
        {message ? (
          <Text style={[styles.text, { color: colors.error }]}>{message}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
});
