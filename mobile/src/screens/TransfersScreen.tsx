import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { EmptyState } from "../components/EmptyState";
import { Screen } from "../components/Screen";
import { ScreenHeader } from "../components/ScreenHeader";
import { useTranslation } from "../i18n/LanguageProvider";
import type { AppStackParamList } from "../navigation/types";
import { spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";

type TransfersScreenProps = NativeStackScreenProps<AppStackParamList, "Transfers">;

/**
 * True Markets deposit/withdraw/transfer APIs are not wired in this EthMarket build.
 * Show an honest unavailable state instead of inventing addresses or hashes.
 */
export function TransfersScreen({ navigation }: TransfersScreenProps) {
  const { t } = useTranslation();
  const { colors, typography, cardStyle } = useTheme();

  return (
    <Screen scroll edges={["top", "bottom"]}>
      <ScreenHeader
        title={t("transfers.title")}
        subtitle={t("transfers.subtitle")}
        onBack={() => navigation.goBack()}
      />

      <View style={[cardStyle, styles.panel]}>
        <Text style={[typography.titleSmall, { color: colors.text }]}>
          {t("transfers.unavailableTitle")}
        </Text>
        <Text style={[typography.subtitle, { color: colors.textSecondary, marginTop: spacing.sm }]}>
          {t("transfers.unavailableBodyShort")}
        </Text>
      </View>

      <EmptyState
        icon="swap-horizontal-outline"
        title={t("transfers.unavailableTitle")}
        body={t("transfers.currentlyUnavailable")}
        actionLabel={t("common.explore")}
        onActionPress={() => navigation.navigate("Explore")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
});
