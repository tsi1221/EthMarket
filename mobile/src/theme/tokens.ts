import { Platform, type TextStyle, type ViewStyle } from "react-native";
import { colors as lightFallback, type ThemeColors } from "./colors";

export const layout = {
  maxContentWidth: 720,
  wideBreakpoint: 900,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  full: 999,
} as const;

export const touch = {
  min: 44,
} as const;

export const fonts = {
  regular: Platform.select({
    web: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    ios: "System",
    android: "sans-serif",
    default: undefined,
  }),
  medium: Platform.select({
    web: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    ios: "System",
    android: "sans-serif-medium",
    default: undefined,
  }),
} as const;

export function getTypography(c: ThemeColors = lightFallback) {
  return {
    display: {
      color: c.text,
      fontFamily: fonts.regular,
      fontSize: 32,
      fontWeight: "700" as const,
      letterSpacing: -0.6,
      lineHeight: 38,
    },
    title: {
      color: c.text,
      fontFamily: fonts.regular,
      fontSize: 28,
      fontWeight: "700" as const,
      letterSpacing: -0.4,
      lineHeight: 34,
    },
    titleSmall: {
      color: c.text,
      fontFamily: fonts.regular,
      fontSize: 18,
      fontWeight: "700" as const,
      lineHeight: 24,
    },
    subtitle: {
      color: c.textSecondary,
      fontFamily: fonts.regular,
      fontSize: 15,
      fontWeight: "500" as const,
      lineHeight: 22,
    },
    body: {
      color: c.text,
      fontFamily: fonts.regular,
      fontSize: 15,
      fontWeight: "400" as const,
      lineHeight: 22,
    },
    label: {
      color: c.text,
      fontFamily: fonts.regular,
      fontSize: 14,
      fontWeight: "600" as const,
      lineHeight: 20,
    },
    caption: {
      color: c.textSecondary,
      fontFamily: fonts.regular,
      fontSize: 13,
      fontWeight: "500" as const,
      lineHeight: 18,
    },
    kicker: {
      color: c.primary,
      fontFamily: fonts.regular,
      fontSize: 13,
      fontWeight: "700" as const,
      letterSpacing: 0.4,
    },
  } satisfies Record<string, TextStyle>;
}

export function getShadows(c: ThemeColors = lightFallback) {
  return {
    card: Platform.select<ViewStyle>({
      ios: {
        shadowColor: c.text,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
    raised: Platform.select<ViewStyle>({
      ios: {
        shadowColor: c.text,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 18,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  };
}

export function getCardStyle(c: ThemeColors = lightFallback): ViewStyle {
  return {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.lg,
    ...getShadows(c).card,
  };
}

export const typography = getTypography(lightFallback);
export const shadows = getShadows(lightFallback);
export const cardStyle = getCardStyle(lightFallback);

export const iconButtonStyle: ViewStyle = {
  width: touch.min,
  height: touch.min,
  borderRadius: radius.md,
  alignItems: "center",
  justifyContent: "center",
};
