import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../i18n/LanguageProvider";
import { radius } from "../theme";
import { useTheme } from "../theme/ThemeProvider";

export type LiveDataBadgeState = "live" | "development" | "error" | "unknown";

type LiveDataBadgeProps = {
  state: LiveDataBadgeState;
  compact?: boolean;
};

export function LiveDataBadge({ state, compact = false }: LiveDataBadgeProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  if (state === "unknown") {
    return null;
  }

  const isLive = state === "live";
  const isError = state === "error";
  const label = isLive
    ? `${t("live.live")} · ${t("live.liveData")}`
    : state === "development"
      ? `${t("live.preview")} · ${t("live.previewBody")}`
      : `${t("live.unavailable")} · ${t("live.unavailableBody")}`;

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={label}
      style={[
        styles.badge,
        compact ? styles.compact : null,
        {
          backgroundColor: isError ? colors.errorLight : colors.primaryLight,
          borderWidth: isError ? 1 : 0,
          borderColor: isError ? colors.errorBorder : "transparent",
        },
      ]}
    >
      {isLive ? (
        <View style={[styles.dot, { backgroundColor: colors.accent }]} />
      ) : null}
      <Text
        style={[
          styles.text,
          {
            color: isError ? colors.error : colors.primaryDark,
            fontWeight: state === "development" ? "600" : "700",
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: "100%",
  },
  compact: {
    borderRadius: radius.full,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginTop: 4,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
