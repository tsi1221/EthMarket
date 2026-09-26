import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Appearance, useColorScheme } from "react-native";
import { getPreference, savePreference } from "../storage/secureStorage";
import {
  darkColors,
  lightColors,
  type ColorSchemeName,
  type ThemePreference,
} from "./colors";
import { getCardStyle, getShadows, getTypography } from "./tokens";

type ThemeContextValue = {
  preference: ThemePreference;
  scheme: ColorSchemeName;
  colors: typeof lightColors;
  typography: ReturnType<typeof getTypography>;
  shadows: ReturnType<typeof getShadows>;
  cardStyle: ReturnType<typeof getCardStyle>;
  setPreference: (value: ThemePreference) => void;
  isDark: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_KEY = "marketplace_theme_preference";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    void (async () => {
      const saved = await getPreference(THEME_KEY);
      if (saved === "light" || saved === "dark" || saved === "system") {
        setPreferenceState(saved);
      }
    })();
  }, []);

  const setPreference = useCallback((value: ThemePreference) => {
    setPreferenceState(value);
    void savePreference(THEME_KEY, value);
  }, []);

  const scheme: ColorSchemeName =
    preference === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : preference;

  const palette = scheme === "dark" ? darkColors : lightColors;

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      scheme,
      colors: palette,
      typography: getTypography(palette),
      shadows: getShadows(palette),
      cardStyle: getCardStyle(palette),
      setPreference,
      isDark: scheme === "dark",
    }),
    [preference, scheme, palette, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    const scheme: ColorSchemeName =
      Appearance.getColorScheme() === "dark" ? "dark" : "light";
    const palette = scheme === "dark" ? darkColors : lightColors;
    return {
      preference: "system",
      scheme,
      colors: palette,
      typography: getTypography(palette),
      shadows: getShadows(palette),
      cardStyle: getCardStyle(palette),
      setPreference: () => undefined,
      isDark: scheme === "dark",
    };
  }
  return ctx;
}
