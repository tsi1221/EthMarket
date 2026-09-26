import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BRAND } from "../brand";
import { BrandMark } from "../components/BrandMark";
import { Button } from "../components/Button";
import { ErrorBanner } from "../components/ErrorBanner";
import { useTranslation } from "../i18n/LanguageProvider";
import { spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";

type SplashScreenProps = {
  error: string | null;
  onRetry: () => void;
  onPreview?: () => void;
};

export function SplashScreen({ error, onRetry, onPreview }: SplashScreenProps) {
  const { colors, typography, isDark } = useTheme();
  const { t } = useTranslation();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View style={styles.center}>
        <Animated.View style={[styles.brand, { opacity, transform: [{ translateY }] }]}>
          <BrandMark size={88} />
          <Text style={[typography.title, styles.title]} accessibilityRole="header">
            {t("app.name")}
          </Text>
          <Text style={typography.subtitle}>{t("app.tagline")}</Text>
        </Animated.View>
        {error ? (
          <View style={styles.errorBlock}>
            <ErrorBanner message={error} />
            <Button title={t("common.tryAgain")} onPress={onRetry} />
            {onPreview ? (
              <Button title={`Preview ${BRAND.name}`} variant="secondary" onPress={onPreview} />
            ) : null}
          </View>
        ) : (
          <ActivityIndicator color={colors.primary} size="large" />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  brand: {
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    textAlign: "center",
  },
  errorBlock: {
    width: "100%",
    maxWidth: 360,
    gap: spacing.md,
  },
});
