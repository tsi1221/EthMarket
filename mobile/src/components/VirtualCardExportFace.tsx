import { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BrandMark } from "./BrandMark";
import { LinearGradientFallback } from "./VirtualCardGradient";
import { VIRTUAL_CARD_DEMO } from "../store/virtualCardStore";
import { spacing } from "../theme";
import { useTheme } from "../theme/ThemeProvider";

type VirtualCardExportFaceProps = {
  previewLabel: string;
  frozen?: boolean;
};

/**
 * Clean export-only card face for PNG download.
 * Includes brand, preview label, and masked number only.
 */
export const VirtualCardExportFace = forwardRef<View, VirtualCardExportFaceProps>(
  function VirtualCardExportFace({ previewLabel, frozen = false }, ref) {
    const { colors } = useTheme();

    return (
      <View
        ref={ref}
        collapsable={false}
        style={[styles.shell, { backgroundColor: colors.background }]}
      >
        <View style={styles.card}>
          <LinearGradientFallback frozen={frozen}>
            <View style={styles.inner}>
              <View style={styles.brandRow}>
                <View style={styles.brandBlock}>
                  <BrandMark size={36} />
                  <Text style={styles.brand}>EthMarket</Text>
                </View>
                <Text style={styles.preview}>{previewLabel}</Text>
              </View>
              <View style={styles.chipRow}>
                <View style={styles.chip} />
                <View style={[styles.contactless, frozen ? styles.dimmed : null]} />
              </View>
              <Text style={[styles.number, frozen ? styles.dimmed : null]}>
                {VIRTUAL_CARD_DEMO.maskedNumber}
              </Text>
            </View>
          </LinearGradientFallback>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  shell: {
    width: 720,
    padding: 24,
  },
  card: {
    borderRadius: 22,
    overflow: "hidden",
  },
  inner: {
    padding: 28,
    minHeight: 240,
    justifyContent: "space-between",
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  brandBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  brand: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  preview: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    maxWidth: 160,
    textAlign: "right",
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  chip: {
    width: 48,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  contactless: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
  },
  number: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "600",
    letterSpacing: 3,
    marginTop: spacing.xl,
  },
  dimmed: {
    opacity: 0.7,
  },
});
