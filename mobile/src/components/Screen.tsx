import type { ComponentProps, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { layout, spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  edges?: Edge[];
  tone?: "app" | "plain";
  refreshControl?: ComponentProps<typeof ScrollView>["refreshControl"];
};

export function Screen({
  children,
  scroll = false,
  style,
  contentStyle,
  edges = ["top", "bottom"],
  tone = "app",
  refreshControl,
}: ScreenProps) {
  const { colors } = useTheme();
  const background = tone === "plain" ? colors.surface : colors.background;

  const frame = (
    <View style={styles.frame}>
      <View style={[styles.inner, contentStyle]}>{children}</View>
    </View>
  );

  const body = scroll ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {frame}
      </ScrollView>
    </KeyboardAvoidingView>
  ) : (
    <View style={styles.flex}>{frame}</View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: background }, style]} edges={edges}>
      {body}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
  },
  frame: {
    width: "100%",
    maxWidth: layout.maxContentWidth,
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  inner: {
    width: "100%",
    flexGrow: 1,
  },
});
