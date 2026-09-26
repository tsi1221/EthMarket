import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Button } from "../components/Button";
import { PrimaryButton } from "../components/PrimaryButton";
import { Screen } from "../components/Screen";
import { ScreenHeader } from "../components/ScreenHeader";
import { LinearGradientFallback } from "../components/VirtualCardGradient";
import { VirtualCardExportFace } from "../components/VirtualCardExportFace";
import { useTranslation } from "../i18n/LanguageProvider";
import type { AppStackParamList } from "../navigation/types";
import { useAuthStore } from "../store/authStore";
import { useToastStore } from "../store/toastStore";
import {
  VIRTUAL_CARD_DEMO,
  useVirtualCardStore,
} from "../store/virtualCardStore";
import { radius, spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";
import { downloadVirtualCardImage } from "../utils/downloadVirtualCard";

type Props = NativeStackScreenProps<AppStackParamList, "VirtualCard">;

export function VirtualCardScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { colors, typography, cardStyle } = useTheme();
  const showToast = useToastStore((state) => state.show);
  const user = useAuthStore((state) => state.user);
  const frozen = useVirtualCardStore((state) => state.frozen);
  const hydrate = useVirtualCardStore((state) => state.hydrate);
  const setFrozen = useVirtualCardStore((state) => state.setFrozen);
  const [showDetails, setShowDetails] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const exportRef = useRef<View>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const cardholder = user?.name?.trim() || "EthMarket User";
  const styles = useMemo(
    () =>
      StyleSheet.create({
        previewBadge: {
          alignSelf: "flex-start",
          backgroundColor: colors.primaryLight,
          borderRadius: radius.md,
          paddingHorizontal: spacing.sm,
          paddingVertical: 6,
          marginBottom: spacing.md,
        },
        previewText: {
          color: colors.primaryDark,
          fontSize: 12,
          fontWeight: "700",
        },
        cardShell: {
          borderRadius: 22,
          overflow: "hidden",
          marginBottom: spacing.md,
          minHeight: 200,
        },
        cardInner: {
          padding: spacing.lg,
          minHeight: 200,
          justifyContent: "space-between",
        },
        brandRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
        brand: {
          color: "#FFFFFF",
          fontSize: 18,
          fontWeight: "700",
          letterSpacing: 0.3,
        },
        chipRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
          marginTop: spacing.md,
        },
        chip: {
          width: 42,
          height: 32,
          borderRadius: 8,
          backgroundColor: "rgba(255,255,255,0.35)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.45)",
        },
        contactless: {
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: "rgba(255,255,255,0.7)",
          opacity: frozen ? 0.45 : 1,
        },
        number: {
          color: "#FFFFFF",
          fontSize: 22,
          fontWeight: "600",
          letterSpacing: 2.4,
          marginTop: spacing.lg,
          opacity: frozen ? 0.7 : 1,
        },
        footerRow: {
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: spacing.lg,
        },
        metaLabel: {
          color: "rgba(255,255,255,0.75)",
          fontSize: 11,
          fontWeight: "600",
          letterSpacing: 0.8,
          textTransform: "uppercase",
        },
        metaValue: {
          color: "#FFFFFF",
          fontSize: 15,
          fontWeight: "700",
          marginTop: 4,
        },
        statusRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          marginBottom: spacing.md,
        },
        statusDot: {
          width: 10,
          height: 10,
          borderRadius: 999,
          backgroundColor: frozen ? colors.warning : colors.success,
        },
        statusText: {
          ...typography.titleSmall,
          fontSize: 16,
        },
        actions: {
          gap: spacing.sm,
          marginBottom: spacing.lg,
        },
        panel: {
          ...cardStyle,
          padding: spacing.md,
          gap: spacing.sm,
          marginBottom: spacing.md,
        },
        panelTitle: {
          ...typography.titleSmall,
          marginBottom: spacing.xs,
        },
        rowLabel: {
          color: colors.textSecondary,
          fontSize: 14,
          fontWeight: "600",
        },
        rowValue: {
          color: colors.text,
          fontSize: 14,
          fontWeight: "700",
        },
        notice: {
          ...typography.caption,
          marginTop: spacing.sm,
        },
        exportHost: {
          position: "absolute",
          left: -4000,
          top: 0,
          opacity: Platform.OS === "web" ? 0.01 : 1,
        },
      }),
    [cardStyle, colors, frozen, typography],
  );

  async function handleDownload() {
    if (downloading) {
      return;
    }

    setDownloading(true);
    showToast(t("card.downloadSaving"));
    try {
      const result = await downloadVirtualCardImage(exportRef);
      if (result === "saved") {
        showToast(t("card.downloadSaved"));
      } else if (result === "downloaded") {
        showToast(t("card.downloadWeb"));
      } else {
        showToast(t("card.downloadShared"));
      }
    } catch {
      showToast(t("card.downloadFailed"));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Screen scroll edges={["top", "bottom"]}>
      <ScreenHeader title={t("card.title")} onBack={() => navigation.goBack()} />

      <View style={styles.previewBadge}>
        <Text style={styles.previewText}>{t("card.previewLabel")}</Text>
      </View>

      <View style={styles.cardShell}>
        <LinearGradientFallback frozen={frozen}>
          <View style={styles.cardInner}>
            <View style={styles.brandRow}>
              <Text style={styles.brand}>EthMarket</Text>
              <Text style={styles.metaLabel}>{frozen ? "LOCKED" : "VIRTUAL"}</Text>
            </View>
            <View style={styles.chipRow}>
              <View style={styles.chip} />
              <View style={styles.contactless} />
            </View>
            <Text style={styles.number}>{VIRTUAL_CARD_DEMO.maskedNumber}</Text>
            <View style={styles.footerRow}>
              <View>
                <Text style={styles.metaLabel}>{t("card.cardholder")}</Text>
                <Text style={styles.metaValue}>{cardholder}</Text>
              </View>
              <View>
                <Text style={styles.metaLabel}>{t("card.expiry")}</Text>
                <Text style={styles.metaValue}>{VIRTUAL_CARD_DEMO.expiry}</Text>
              </View>
            </View>
          </View>
        </LinearGradientFallback>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          title={t("card.download")}
          loading={downloading}
          onPress={() => void handleDownload()}
        />
      </View>

      <View style={styles.statusRow}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>
          {frozen ? `🔒 ${t("card.frozen")}` : `🟢 ${t("card.active")}`}
        </Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          title={showDetails ? t("card.hideDetails") : t("card.viewDetails")}
          onPress={() => setShowDetails((current) => !current)}
        />
        <Button
          title={frozen ? t("card.unfreeze") : t("card.freeze")}
          variant="secondary"
          onPress={() => setFrozen(!frozen)}
        />
      </View>

      {showDetails ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{t("card.viewDetails")}</Text>
          <DetailRow label={t("card.number")} value={VIRTUAL_CARD_DEMO.maskedNumber} first />
          <DetailRow label={t("card.expiry")} value={VIRTUAL_CARD_DEMO.expiry} />
          <DetailRow
            label={t("card.status")}
            value={frozen ? `🔒 ${t("common.frozen")}` : `🟢 ${t("common.active")}`}
          />
          <DetailRow label={t("card.cvv")} value={VIRTUAL_CARD_DEMO.maskedCvv} />
          <Text style={styles.notice}>{t("card.demoNotice")}</Text>
        </View>
      ) : null}

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{t("card.balance")}</Text>
        <Text style={styles.rowValue}>{t("common.notConnected")}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{t("card.recentActivity")}</Text>
        <Text style={styles.rowLabel}>{t("card.noTransactions")}</Text>
      </View>

      <View style={styles.exportHost} pointerEvents="none">
        <VirtualCardExportFace
          ref={exportRef}
          previewLabel={t("card.previewLabel")}
          frozen={frozen}
        />
      </View>
    </Screen>
  );
}

function DetailRow({
  label,
  value,
  first = false,
}: {
  label: string;
  value: string;
  first?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        gap: spacing.md,
        paddingVertical: 8,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: colors.border,
        paddingTop: first ? 0 : 8,
      }}
    >
      <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: "600" }}>
        {label}
      </Text>
      <Text
        style={{
          color: colors.text,
          fontSize: 14,
          fontWeight: "700",
          textAlign: "right",
          flexShrink: 1,
        }}
      >
        {value}
      </Text>
    </View>
  );
}
