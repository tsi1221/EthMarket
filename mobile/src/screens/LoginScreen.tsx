import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BrandMark } from "../components/BrandMark";
import { Button } from "../components/Button";
import { ErrorBanner } from "../components/ErrorBanner";
import { Screen } from "../components/Screen";
import { TextField } from "../components/TextField";
import { TextLink } from "../components/TextLink";
import { BRAND } from "../brand";
import { useTranslation } from "../i18n/LanguageProvider";
import { useAuthStore } from "../store/authStore";
import { spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";
import { hasFieldErrors, validateLogin } from "../validation/auth";

type LoginScreenProps = {
  onGoToRegister: () => void;
};

export function LoginScreen({ onGoToRegister }: LoginScreenProps) {
  const { t } = useTranslation();
  const { typography } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          alignItems: "center",
          gap: spacing.sm,
          paddingTop: spacing.xl,
          paddingBottom: spacing.lg,
        },
        title: {
          ...typography.title,
          textAlign: "center",
        },
        subtitle: {
          ...typography.subtitle,
          textAlign: "center",
        },
        form: {
          gap: spacing.md,
          marginBottom: spacing.lg,
        },
        previewHint: {
          ...typography.caption,
          textAlign: "center",
        },
      }),
    [typography],
  );
  const login = useAuthStore((state) => state.login);
  const enterPreview = useAuthStore((state) => state.enterPreview);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    ReturnType<typeof validateLogin>
  >({});
  const [showErrors, setShowErrors] = useState(false);

  async function handleLogin() {
    const nextErrors = validateLogin({ email, password });
    setFieldErrors(nextErrors);
    setShowErrors(true);
    clearError();

    if (hasFieldErrors(nextErrors)) {
      return;
    }

    await login(email, password);
  }

  return (
    <Screen scroll tone="plain">
      <View style={styles.header}>
        <BrandMark size={56} />
        <Text style={styles.title}>{t("auth.welcomeBack")}</Text>
        <Text style={styles.subtitle}>{t("auth.loginSubtitle")}</Text>
      </View>

      <View style={styles.form}>
        <ErrorBanner message={error} />
        <TextField
          label={t("auth.email")}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (showErrors) {
              setFieldErrors(validateLogin({ email: value, password }));
            }
          }}
          error={showErrors ? fieldErrors.email : undefined}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder={t("auth.emailPlaceholder")}
          returnKeyType="next"
        />
        <TextField
          label={t("auth.password")}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (showErrors) {
              setFieldErrors(validateLogin({ email, password: value }));
            }
          }}
          error={showErrors ? fieldErrors.password : undefined}
          password
          autoComplete="password"
          textContentType="password"
          placeholder={t("auth.passwordPlaceholder")}
          returnKeyType="done"
          onSubmitEditing={() => void handleLogin()}
        />
        <Button title={t("common.login")} onPress={handleLogin} loading={isSubmitting} />
        <Button
          title={t("onboarding.preview", { name: BRAND.name })}
          variant="secondary"
          onPress={() => void enterPreview()}
        />
        <Text style={styles.previewHint}>
          {t("auth.previewHint")}
        </Text>
      </View>

      <TextLink
        prompt={t("auth.noAccount")}
        action={t("common.register")}
        onPress={onGoToRegister}
      />
    </Screen>
  );
}
