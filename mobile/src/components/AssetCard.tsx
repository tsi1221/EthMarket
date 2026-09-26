import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useTranslation } from "../i18n/LanguageProvider";
import { radius, spacing, touch } from "../theme";
import { useTheme } from "../theme/ThemeProvider";
import type { Asset } from "../types/market";
import { assetTypeLabel, formatMarketPrice, venueLabel } from "../utils/format";
import { PriceChange } from "./PriceChange";

type AssetCardProps = {
  asset: Asset;
  onPress?: () => void;
  selected?: boolean;
  watched?: boolean;
  onToggleWatch?: () => void;
};

export function AssetCard({
  asset,
  onPress,
  selected = false,
  watched = false,
  onToggleWatch,
}: AssetCardProps) {
  const { colors, cardStyle } = useTheme();
  const { t } = useTranslation();
  const scale = useRef(new Animated.Value(1)).current;
  const [reduceMotion, setReduceMotion] = useState(false);
  const [starPressed, setStarPressed] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setReduceMotion(enabled);
      }
    });
    const subscription = AccessibilityInfo.addEventListener?.(
      "reduceMotionChanged",
      setReduceMotion,
    );
    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  function animatePressIn() {
    if (reduceMotion) {
      return;
    }
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      friction: 7,
      tension: 160,
    }).start();
  }

  function animatePressOut() {
    if (reduceMotion) {
      return;
    }
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 7,
      tension: 160,
    }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        onPressIn={animatePressIn}
        onPressOut={animatePressOut}
        accessibilityRole={onPress ? "button" : "none"}
        accessibilityState={{ selected }}
        accessibilityLabel={`${asset.symbol}, ${formatMarketPrice(asset.price)}`}
        style={({ pressed }) => [
          cardStyle,
          styles.card,
          {
            backgroundColor: selected ? colors.primaryLight : colors.surface,
            borderColor: selected ? colors.primary : colors.border,
            borderWidth: selected ? 2 : 1,
            opacity: pressed && onPress ? 0.92 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.symbolMark,
            {
              backgroundColor: selected ? colors.primary : colors.primaryLight,
            },
          ]}
        >
          <Text
            style={[
              styles.symbolMarkText,
              { color: selected ? colors.white : colors.primaryDark },
            ]}
          >
            {asset.symbol.slice(0, 2)}
          </Text>
        </View>
        <View style={styles.meta}>
          <Text style={[styles.symbol, { color: colors.text }]}>{asset.symbol}</Text>
          <Text style={[styles.name, { color: colors.textSecondary }]} numberOfLines={1}>
            {asset.name} · {venueLabel(asset.venue) || assetTypeLabel(asset.type)}
          </Text>
        </View>
        <View style={styles.quote}>
          <Text style={[styles.price, { color: colors.text }]}>
            {formatMarketPrice(asset.price)}
          </Text>
          {asset.changePercent === null || asset.changePercent === undefined ? (
            <Text style={[styles.noChange, { color: colors.textSecondary }]}>Unavailable</Text>
          ) : (
            <PriceChange percent={asset.changePercent} />
          )}
        </View>
        {onToggleWatch ? (
          <Pressable
            onPress={(event) => {
              event?.stopPropagation?.();
              onToggleWatch();
            }}
            onPressIn={() => setStarPressed(true)}
            onPressOut={() => setStarPressed(false)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityState={{ selected: watched }}
            accessibilityLabel={
              watched
                ? t("watchlist.removeA11y", { symbol: asset.symbol })
                : t("watchlist.addA11y", { symbol: asset.symbol })
            }
            style={[
              styles.watch,
              {
                transform: [{ scale: starPressed && !reduceMotion ? 0.88 : 1 }],
                opacity: starPressed ? 0.75 : 1,
              },
            ]}
          >
            <Ionicons
              name={watched ? "star" : "star-outline"}
              size={22}
              color={watched ? colors.accent : colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
  },
  symbolMark: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  symbolMarkText: {
    fontSize: 13,
    fontWeight: "800",
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  symbol: {
    fontSize: 16,
    fontWeight: "700",
  },
  name: {
    fontSize: 13,
    lineHeight: 18,
  },
  quote: {
    alignItems: "flex-end",
    gap: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
  },
  noChange: {
    fontSize: 12,
    fontWeight: "600",
  },
  watch: {
    width: touch.min,
    height: touch.min,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -8,
  },
});
