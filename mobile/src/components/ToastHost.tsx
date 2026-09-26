import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useToastStore } from "../store/toastStore";
import { radius, spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const { colors, shadows } = useTheme();
  const message = useToastStore((state) => state.message);
  const visible = useToastStore((state) => state.visible);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (!visible || !message) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 12, duration: 160, useNativeDriver: true }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [message, opacity, translateY, visible]);

  if (!message && !visible) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        shadows.raised,
        {
          bottom: Math.max(insets.bottom, 16) + 64,
          backgroundColor: colors.surfaceElevated,
          borderColor: colors.border,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={[styles.text, { color: colors.text }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    alignSelf: "center",
    left: spacing.lg,
    right: spacing.lg,
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    zIndex: 1000,
  },
  text: {
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
  },
});
