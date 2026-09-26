import "react-native-gesture-handler";
import { QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LanguageProvider } from "./src/i18n/LanguageProvider";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { queryClient } from "./src/query/queryClient";
import { ThemeProvider, useTheme } from "./src/theme/ThemeProvider";
import { ToastHost } from "./src/components/ToastHost";

function AppShell() {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <RootNavigator />
      <ToastHost />
    </View>
  );
}

export default function App() {
  if (Platform.OS === "web" && typeof document !== "undefined") {
    const id = "ethmarket-inter-font";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";
      document.head.appendChild(link);
    }
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <LanguageProvider>
              <AppShell />
            </LanguageProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
