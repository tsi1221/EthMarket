import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BRAND } from "../brand";
import { BrandMark } from "../components/BrandMark";
import { Button } from "../components/Button";
import { Screen } from "../components/Screen";
import { spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";
import { useTranslation } from "../i18n/LanguageProvider";

type OnboardingScreenProps = {
  onContinue: (entry: "Login" | "Register") => void;
  onPreview?: () => void;
};

const STEP_IDS = ["discover", "understand", "compare", "quotes"] as const;

export function OnboardingScreen({ onContinue, onPreview }: OnboardingScreenProps) {
  const { t } = useTranslation();
  const { colors, typography } = useTheme();
  const [step, setStep] = useState(0);
  const stepId = STEP_IDS[step];
  const isLast = step === STEP_IDS.length - 1;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        content: {
          justifyContent: "space-between",
          gap: spacing.xl,
        },
        hero: {
          alignItems: "center",
          gap: spacing.sm,
          paddingTop: spacing.xl,
        },
        product: {
          ...typography.display,
          color: colors.primaryDark,
          marginTop: spacing.sm,
        },
        tagline: {
          color: colors.primary,
          fontSize: 17,
          fontWeight: "700",
          textAlign: "center",
        },
        journey: {
          ...typography.caption,
          textAlign: "center",
          marginTop: spacing.xs,
        },
        card: {
          backgroundColor: colors.primaryLight,
          borderRadius: 20,
          padding: spacing.lg,
          gap: spacing.sm,
        },
        stepLabel: {
          color: colors.primaryDark,
          fontSize: 12,
          fontWeight: "800",
          letterSpacing: 0.4,
          textTransform: "uppercase",
        },
        stepTitle: {
          ...typography.titleSmall,
          color: colors.primaryDark,
        },
        stepBody: {
          ...typography.subtitle,
          color: colors.text,
        },
        dots: {
          flexDirection: "row",
          gap: 8,
          marginTop: spacing.sm,
        },
        dot: {
          width: 8,
          height: 8,
          borderRadius: 999,
          backgroundColor: colors.border,
        },
        dotActive: {
          backgroundColor: colors.primary,
          width: 18,
        },
        actions: {
          gap: spacing.sm,
          paddingBottom: spacing.md,
          width: "100%",
        },
      }),
    [colors, typography],
  );

  return (
    <Screen tone="plain" contentStyle={styles.content}>
      <View style={styles.hero}>
        <BrandMark size={72} />
        <Text style={styles.product} accessibilityRole="header">
          {BRAND.name}
        </Text>
        <Text style={styles.tagline}>{BRAND.tagline}</Text>
        <Text style={styles.journey}>{BRAND.journey}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.stepLabel}>
          {t("onboarding.stepOf", { current: step + 1, total: STEP_IDS.length })}
        </Text>
        <Text style={styles.stepTitle}>{t(`onboarding.step.${stepId}.title`)}</Text>
        <Text style={styles.stepBody}>{t(`onboarding.step.${stepId}.body`)}</Text>
        <View style={styles.dots}>
          {STEP_IDS.map((id, index) => (
            <View
              key={id}
              style={[styles.dot, index === step ? styles.dotActive : null]}
            />
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        {isLast ? (
          <>
            <Button title={t("onboarding.getStarted")} onPress={() => onContinue("Register")} />
            <Button title={t("common.login")} variant="secondary" onPress={() => onContinue("Login")} />
          </>
        ) : (
          <Button title={t("onboarding.continue")} onPress={() => setStep((value) => value + 1)} />
        )}
        {onPreview ? (
          <Button
            title={t("onboarding.preview", { name: BRAND.name })}
            variant="ghost"
            onPress={onPreview}
          />
        ) : null}
      </View>
    </Screen>
  );
}
