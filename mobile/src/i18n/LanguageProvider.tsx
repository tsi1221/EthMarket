import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getPreference, savePreference } from "../storage/secureStorage";
import {
  LANGUAGE_OPTIONS,
  isAppLanguage,
  setActiveLanguage,
  translate,
  type AppLanguage,
} from "./translate";

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (value: AppLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  options: typeof LANGUAGE_OPTIONS;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);
const LANGUAGE_KEY = "marketplace_language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("en");

  const setLanguage = useCallback((value: AppLanguage) => {
    setLanguageState(value);
    setActiveLanguage(value);
    void savePreference(LANGUAGE_KEY, value);
  }, []);

  useEffect(() => {
    void (async () => {
      const saved = await getPreference(LANGUAGE_KEY);
      if (isAppLanguage(saved)) {
        setLanguageState(saved);
        setActiveLanguage(saved);
      }
    })();
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(language, key, params),
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      options: LANGUAGE_OPTIONS,
    }),
    [language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      language: "en",
      setLanguage: () => undefined,
      t: (key, params) => translate("en", key, params),
      options: LANGUAGE_OPTIONS,
    };
  }
  return ctx;
}
