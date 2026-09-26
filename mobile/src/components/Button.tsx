import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from "react-native";
import { radius, spacing, touch } from "../theme";
import { useTheme } from "../theme/ThemeProvider";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: ButtonVariant;
};

export function Button({
  title,
  loading = false,
  variant = "primary",
  disabled,
  accessibilityLabel,
  ...props
}: ButtonProps) {
  const { colors, shadows } = useTheme();
  const isDisabled = Boolean(disabled || loading);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === "primary"
          ? { backgroundColor: colors.primary }
          : variant === "secondary"
            ? { backgroundColor: colors.primaryLight }
            : { backgroundColor: "transparent" },
        variant === "primary" ? shadows.card : null,
        pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.white : colors.primary}
        />
      ) : (
        <Text
          style={[
            styles.label,
            {
              color:
                variant === "primary"
                  ? colors.white
                  : colors.primaryDark,
            },
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touch.min + 8,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});
