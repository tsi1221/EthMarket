import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { iconButtonStyle, spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  align?: "start" | "center";
};

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  align = "start",
}: ScreenHeaderProps) {
  const { colors, typography } = useTheme();
  const centered = align === "center";

  return (
    <View style={styles.row}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [
            styles.iconButton,
            pressed ? { backgroundColor: colors.overlay } : null,
          ]}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
      ) : null}
      <View style={[styles.copy, centered ? styles.copyCenter : null]}>
        <Text
          style={[
            typography.title,
            { fontSize: 26, lineHeight: 32 },
            centered ? styles.titleCenter : null,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              typography.subtitle,
              { fontSize: 14, lineHeight: 20 },
              centered ? styles.titleCenter : null,
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : onBack ? <View style={styles.iconButton} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  iconButton: {
    ...iconButtonStyle,
  },
  copy: {
    flex: 1,
    gap: 4,
    paddingTop: 8,
  },
  copyCenter: {
    alignItems: "center",
  },
  titleCenter: {
    textAlign: "center",
  },
  right: {
    minWidth: 44,
    alignItems: "flex-end",
  },
});
