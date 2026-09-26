import en from "../locales/en/common.json";
import am from "../locales/am/common.json";
import fr from "../locales/fr/common.json";
import es from "../locales/es/common.json";

export type AppLanguage = "en" | "am" | "fr" | "es";

const catalogs: Record<AppLanguage, Record<string, string>> = {
  en,
  am,
  fr,
  es,
};

const SUPPORTED: ReadonlySet<string> = new Set(["en", "am", "fr", "es"]);

let activeLanguage: AppLanguage = "en";

export function setActiveLanguage(value: AppLanguage): void {
  activeLanguage = value;
}

export function getActiveLanguage(): AppLanguage {
  return activeLanguage;
}

export function t(key: string, params?: Record<string, string | number>): string {
  return translate(activeLanguage, key, params);
}

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return Boolean(value && SUPPORTED.has(value));
}

export function translate(
  language: AppLanguage,
  key: string,
  params?: Record<string, string | number>,
): string {
  const catalog = catalogs[language] ?? catalogs.en;
  let value = catalog[key] ?? catalogs.en[key] ?? key;
  if (params) {
    for (const [name, replacement] of Object.entries(params)) {
      value = value.replace(new RegExp(`\\{\\{${name}\\}\\}`, "g"), String(replacement));
    }
  }
  return value;
}

export const LANGUAGE_OPTIONS: {
  code: AppLanguage;
  flag: string;
  labelKey: string;
  nativeLabel: string;
}[] = [
  { code: "en", flag: "🇬🇧", labelKey: "common.english", nativeLabel: "English" },
  { code: "am", flag: "🇪🇹", labelKey: "common.amharic", nativeLabel: "አማርኛ" },
  { code: "fr", flag: "🇫🇷", labelKey: "common.french", nativeLabel: "Français" },
  { code: "es", flag: "🇪🇸", labelKey: "common.spanish", nativeLabel: "Español" },
];
