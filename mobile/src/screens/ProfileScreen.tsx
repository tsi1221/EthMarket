import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BrandMark } from "../components/BrandMark";
import { ErrorBanner } from "../components/ErrorBanner";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { TextField } from "../components/TextField";
import { useTranslation } from "../i18n/LanguageProvider";
import { useAppNavigation } from "../hooks/useAppNavigation";
import { useAuthStore } from "../store/authStore";
import { radius, spacing, touch } from "../theme";
import { useTheme } from "../theme/ThemeProvider";
import type { ThemePreference } from "../theme/colors";
import type { AppLanguage } from "../i18n/translate";

export function ProfileScreen() {
  const navigation = useAppNavigation();
  const { t, language, setLanguage, options } = useTranslation();
  const { colors, typography, cardStyle, preference, setPreference, isDark } = useTheme();
  const user = useAuthStore((state) => state.user);
  const isPreview = useAuthStore((state) => state.isPreview);
  const logout = useAuthStore((state) => state.logout);
  const updateName = useAuthStore((state) => state.updateName);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [showHelp, setShowHelp] = useState(false);

  const appearanceOptions: { value: ThemePreference; icon: string; label: string }[] = [
    { value: "system", icon: "⚙️", label: t("common.system") },
    { value: "light", icon: "☀️", label: t("common.light") },
    { value: "dark", icon: "🌙", label: t("common.dark") },
  ];

  return (
    <Screen scroll edges={["top"]}>
      <Text style={typography.title}>{t("profile.title")}</Text>

      <View style={[cardStyle, styles.card]}>
        <BrandMark size={56} />
        <View style={styles.identity}>
          <Text style={[styles.name, { color: colors.text }]}>
            {user?.name ?? "EthMarket user"}
          </Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
        </View>
      </View>

      <Text style={[typography.titleSmall, styles.sectionLabel]}>{t("common.appearance")}</Text>
      <View style={[cardStyle, styles.toggleCard]}>
        <View style={styles.toggleRow}>
          {appearanceOptions.map((option) => (
            <ToggleChip
              key={option.value}
              label={`${option.icon} ${option.label}`}
              selected={preference === option.value}
              onPress={() => setPreference(option.value)}
            />
          ))}
        </View>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {isDark ? `🌙 ${t("common.dark")}` : `☀️ ${t("common.light")}`}
          {preference === "system" ? ` · ${t("common.system")}` : ""}
        </Text>
      </View>

      <Text style={[typography.titleSmall, styles.sectionLabel]}>{t("common.language")}</Text>
      <View style={[cardStyle, styles.toggleCard]}>
        <View style={styles.languageGrid}>
          {options.map((option) => (
            <ToggleChip
              key={option.code}
              label={`${option.flag} ${option.nativeLabel}`}
              selected={language === option.code}
              onPress={() => setLanguage(option.code as AppLanguage)}
              wide
            />
          ))}
        </View>
      </View>

      {editing ? (
        <View style={styles.editor}>
          <ErrorBanner message={error} />
          <TextField
            label="Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            placeholder="Your name"
          />
          <PrimaryButton
            title={t("common.save")}
            loading={isSubmitting}
            disabled={name.trim().length < 2 || isPreview}
            onPress={() => {
              void updateName(name).then((saved) => {
                if (saved) {
                  setEditing(false);
                }
              });
            }}
          />
        </View>
      ) : null}

      <Text style={[typography.titleSmall, styles.sectionLabel]}>{t("profile.account")}</Text>
      <View style={[cardStyle, styles.menu]}>
        <MenuRow
          icon="card-outline"
          label={t("profile.virtualCard")}
          onPress={() => navigation.navigate("VirtualCard")}
        />
        <MenuRow
          icon="create-outline"
          label={t("profile.editName")}
          onPress={() => {
            clearError();
            setName(user?.name ?? "");
            setEditing((current) => !current);
          }}
        />
        <MenuRow
          icon="receipt-outline"
          label={t("profile.orders")}
          onPress={() => navigation.navigate("OrderHistory")}
        />
        <MenuRow
          icon="help-circle-outline"
          label={t("profile.howItWorks")}
          last
          onPress={() => setShowHelp((current) => !current)}
        />
      </View>

      {showHelp ? (
        <View style={[cardStyle, styles.help]}>
          <Text style={[styles.helpBody, { color: colors.textSecondary }]}>
            Discover digital assets from True Markets, understand them in plain language, compare
            side by side, and request a live quote. Educational notes are not financial advice.
            Order execution is currently unavailable in this milestone.
          </Text>
        </View>
      ) : null}

      <PrimaryButton title={t("common.logout")} onPress={() => void logout()} />
    </Screen>
  );
}

function ToggleChip({
  label,
  selected,
  onPress,
  wide = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  wide?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        wide ? styles.chipWide : styles.chipFlex,
        {
          backgroundColor: selected ? colors.primary : colors.background,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.9 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.chipLabel,
          { color: selected ? colors.white : colors.text },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
      {selected ? (
        <Ionicons
          name="checkmark-circle"
          size={16}
          color={selected ? colors.white : colors.primary}
        />
      ) : null}
    </Pressable>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.background : colors.surface,
          borderBottomColor: colors.border,
          borderBottomWidth: last ? 0 : 1,
        },
      ]}
      onPress={onPress}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name={icon} size={18} color={colors.primaryDark} />
      </View>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  identity: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
  },
  email: {
    fontSize: 14,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
  },
  toggleCard: {
    padding: spacing.md,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  toggleRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  languageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    minHeight: touch.min,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  chipFlex: {
    flex: 1,
  },
  chipWide: {
    width: "48%",
    flexGrow: 1,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  menu: {
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  editor: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  help: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  helpBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    minHeight: touch.min + 16,
    padding: spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
});
