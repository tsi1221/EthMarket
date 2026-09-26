import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { useEffect, useMemo } from "react";
import { Platform } from "react-native";
import { BRAND } from "../brand";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { SplashScreen } from "../screens/SplashScreen";
import { useAuthStore } from "../store/authStore";
import { useTheme } from "../theme/ThemeProvider";
import { AppNavigator } from "./AppNavigator";
import { AuthNavigator } from "./AuthNavigator";

export function RootNavigator() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasOnboarded = useAuthStore((state) => state.hasOnboarded);
  const hydrateError = useAuthStore((state) => state.hydrateError);
  const { colors, isDark } = useTheme();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      document.title = BRAND.name;
      document.body.style.backgroundColor = colors.background;
    }
  }, [colors.background]);

  const navigationTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.accent,
      },
    }),
    [colors, isDark],
  );

  const documentTitle = {
    formatter: (options?: { title?: string }) =>
      options?.title ? `${options.title} · ${BRAND.name}` : BRAND.name,
  };

  if (!isHydrated) {
    return (
      <SplashScreen
        error={hydrateError}
        onRetry={() => void hydrate()}
        onPreview={() => void useAuthStore.getState().enterPreview()}
      />
    );
  }

  if (isAuthenticated) {
    return (
      <NavigationContainer theme={navigationTheme} documentTitle={documentTitle}>
        <AppNavigator />
      </NavigationContainer>
    );
  }

  if (!hasOnboarded) {
    return (
      <OnboardingScreen
        onContinue={(entry) => {
          void useAuthStore.getState().completeOnboarding(entry);
        }}
        onPreview={() => {
          void useAuthStore.getState().enterPreview();
        }}
      />
    );
  }

  return (
    <NavigationContainer theme={navigationTheme} documentTitle={documentTitle}>
      <AuthNavigator />
    </NavigationContainer>
  );
}
