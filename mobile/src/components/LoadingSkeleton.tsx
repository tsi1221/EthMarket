import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { radius, spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";

type LoadingSkeletonProps = {
  rows?: number;
  showHero?: boolean;
};

export function LoadingSkeleton({ rows = 4, showHero = true }: LoadingSkeletonProps) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View
      style={styles.wrap}
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
    >
      {showHero ? (
        <Animated.View
          style={[styles.hero, { opacity, backgroundColor: colors.border }]}
        />
      ) : null}
      {Array.from({ length: rows }).map((_, index) => (
        <Animated.View
          key={index}
          style={[styles.row, { opacity, backgroundColor: colors.border }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  hero: {
    height: 120,
    borderRadius: radius.lg,
  },
  row: {
    height: 72,
    borderRadius: radius.md,
  },
});
