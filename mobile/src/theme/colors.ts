export type ColorSchemeName = "light" | "dark";
export type ThemePreference = "system" | "light" | "dark";

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  errorLight: string;
  errorBorder: string;
  white: string;
  overlay: string;
  gain: string;
  gainLight: string;
  loss: string;
  lossLight: string;
  /** Alias used by existing components */
  muted: string;
};

export const lightColors: ThemeColors = {
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  primary: "#0F766E",
  primaryDark: "#115E59",
  primaryLight: "#CCFBF1",
  accent: "#16A34A",
  text: "#0F172A",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  success: "#15803D",
  warning: "#B45309",
  error: "#B91C1C",
  errorLight: "#FEF2F2",
  errorBorder: "#FECACA",
  white: "#FFFFFF",
  overlay: "rgba(15, 118, 110, 0.08)",
  gain: "#15803D",
  gainLight: "#DCFCE7",
  loss: "#B91C1C",
  lossLight: "#FEF2F2",
  muted: "#64748B",
};

export const darkColors: ThemeColors = {
  background: "#0B1120",
  surface: "#111827",
  surfaceElevated: "#172033",
  primary: "#2DD4BF",
  primaryDark: "#5EEAD4",
  primaryLight: "#134E4A",
  accent: "#22C55E",
  text: "#F8FAFC",
  textSecondary: "#94A3B8",
  border: "#263244",
  success: "#4ADE80",
  warning: "#FBBF24",
  error: "#F87171",
  errorLight: "#3F1D1D",
  errorBorder: "#7F1D1D",
  white: "#FFFFFF",
  overlay: "rgba(45, 212, 191, 0.12)",
  gain: "#4ADE80",
  gainLight: "#14532D",
  loss: "#F87171",
  lossLight: "#3F1D1D",
  muted: "#94A3B8",
};

/** @deprecated Prefer useTheme().colors — kept as light defaults for non-React helpers. */
export const colors = lightColors;
