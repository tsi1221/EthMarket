import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../theme/ThemeProvider";

/** EthMarket green card face without copying third-party card layouts. */
export function LinearGradientFallback({
  children,
  frozen,
}: {
  children: ReactNode;
  frozen?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const top = frozen ? (isDark ? "#334155" : "#475569") : colors.primaryDark;
  const mid = frozen ? (isDark ? "#1E293B" : "#64748B") : colors.primary;
  const bottom = frozen ? (isDark ? "#0F172A" : "#334155") : "#0F766E";

  return (
    <View style={[styles.shell, { backgroundColor: mid }]}>
      <View style={[styles.washTop, { backgroundColor: top }]} />
      <View style={[styles.washBottom, { backgroundColor: bottom }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 22,
  },
  washTop: {
    position: "absolute",
    top: -40,
    left: -20,
    right: 40,
    height: 140,
    borderBottomRightRadius: 120,
    opacity: 0.85,
  },
  washBottom: {
    position: "absolute",
    bottom: -30,
    left: 40,
    right: -20,
    height: 120,
    borderTopLeftRadius: 100,
    opacity: 0.55,
  },
  content: {
    position: "relative",
    zIndex: 1,
  },
});
