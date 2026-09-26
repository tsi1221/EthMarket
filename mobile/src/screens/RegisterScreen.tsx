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
import { hasFieldErrors, validateRegister } from "../validation/auth";

type RegisterScreenProps = {
  onGoToLogin: () => void;
};

export function RegisterScreen({ onGoToLogin }: RegisterScreenProps) {
  const { t } = useTranslation();
  const { typography } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        header: {
          alignItems: "center",
          gap: spacing.sm,
          paddingTop: spacing.lg,
          paddingBottom: spacing.md,
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
      }),
    [typography],
  );
  const register = useAuthStore((state) => state.register);
  const enterPreview = useAuthStore((state) => state.enterPreview);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    ReturnType<typeof validateRegister>
  >({});
  const [showErrors, setShowErrors] = useState(false);

  function currentValues() {
    return { name, email, password, confirmPassword };
  }

  async function handleRegister() {
    const nextErrors = validateRegister(currentValues());
    setFieldErrors(nextErrors);
    setShowErrors(true);
    clearError();

    if (hasFieldErrors(nextErrors)) {
      return;
    }

    await register({ name, email, password });
  }

  return (
    <Screen scroll tone="plain">
      <View style={styles.header}>
        <BrandMark size={56} />
        <Text style={styles.title}>{t("auth.registerTitle")}</Text>
        <Text style={styles.subtitle}>{t("auth.registerSubtitle")}</Text>
      </View>

      <View style={styles.form}>
        <ErrorBanner message={error} />
        <TextField
          label={t("auth.name")}
          value={name}
          onChangeText={(value) => {
            setName(value);
            if (showErrors) {
              setFieldErrors(validateRegister({ ...currentValues(), name: value }));
            }
          }}
          error={showErrors ? fieldErrors.name : undefined}
          autoComplete="name"
          textContentType="name"
          placeholder="Your name"
          returnKeyType="next"
        />
        <TextField
          label={t("auth.email")}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (showErrors) {
              setFieldErrors(validateRegister({ ...currentValues(), email: value }));
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
              setFieldErrors(
                validateRegister({ ...currentValues(), password: value }),
              );
            }
          }}
          error={showErrors ? fieldErrors.password : undefined}
          password
          autoComplete="password-new"
          textContentType="newPassword"
          placeholder="At least 8 characters"
          returnKeyType="next"
        />
        <TextField
          label="Confirm password"
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            if (showErrors) {
              setFieldErrors(
                validateRegister({ ...currentValues(), confirmPassword: value }),
              );
            }
          }}
          error={showErrors ? fieldErrors.confirmPassword : undefined}
          password
          autoComplete="password-new"
          textContentType="password"
          placeholder="Repeat your password"
          returnKeyType="done"
          onSubmitEditing={() => void handleRegister()}
        />
        <Button
          title={t("common.register")}
          onPress={handleRegister}
          loading={isSubmitting}
        />
        <Button
          title={`Preview ${BRAND.name}`}
          variant="secondary"
          onPress={() => void enterPreview()}
        />
      </View>

      <TextLink
        prompt={t("auth.haveAccount")}
        action={t("common.login")}
        onPress={onGoToLogin}
      />
    </Screen>
  );
}
