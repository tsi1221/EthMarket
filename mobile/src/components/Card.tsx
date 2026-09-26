import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";

type CardProps = {
  children: ReactNode;
  padded?: boolean;
  style?: ViewStyle;
};

export function Card({ children, padded = true, style }: CardProps) {
  const { cardStyle } = useTheme();
  return (
    <View style={[cardStyle, styles.overflow, padded ? styles.padded : null, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  overflow: {
    overflow: "hidden",
  },
  padded: {
    padding: spacing.md,
  },
});
