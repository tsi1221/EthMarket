import { t } from "../i18n/translate";

export type AssetEducation = {
  symbol: string;
  whatIsIt: string;
  howItWorks: string;
  whyPeopleUseIt: string;
  beginnerNotes: string;
  riskNotes: string;
  whyExplore: string[];
  characteristics: string[];
  plainLanguageSummary: string;
  /** Short type label without "Asset type:" prefix (e.g. cryptocurrency). */
  assetType: string;
  /** Network name without "Network:" prefix, or null when not applicable. */
  network: string | null;
};

/** Prefer t("advice.disclaimer") in UI; kept for older imports. */
export function getAdviceDisclaimer(): string {
  return t("advice.disclaimer");
}

export const ADVICE_DISCLAIMER = "Educational information, not financial advice.";

const KNOWN = ["BTC", "ETH", "SOL", "USDC"] as const;
type KnownSymbol = (typeof KNOWN)[number];

function readList(prefix: string, max: number): string[] {
  const items: string[] = [];
  for (let index = 0; index < max; index += 1) {
    const key = `${prefix}.${index}`;
    const value = t(key);
    if (value === key) {
      break;
    }
    items.push(value);
  }
  return items;
}

function educationFromKeys(symbol: KnownSymbol): AssetEducation {
  const base = `edu.${symbol.toLowerCase()}`;
  const assetType = t(`${base}.assetType`);
  const networkKey = `${base}.network`;
  const networkValue = t(networkKey);
  const network = networkValue === networkKey ? null : networkValue;

  return {
    symbol,
    whatIsIt: t(`${base}.whatIsIt`),
    howItWorks: t(`${base}.howItWorks`),
    whyPeopleUseIt: t(`${base}.whyPeopleUseIt`),
    beginnerNotes: t(`${base}.beginnerNotes`),
    riskNotes: t(`${base}.riskNotes`),
    plainLanguageSummary: t(`${base}.plainLanguageSummary`),
    whyExplore: readList(`${base}.whyExplore`, 8),
    characteristics: readList(`${base}.characteristics`, 8),
    assetType,
    network,
  };
}

function genericEducation(symbol: string, name?: string): AssetEducation {
  const label = name?.trim() || symbol;
  return {
    symbol,
    whatIsIt: t("edu.generic.whatIsIt", { label, symbol }),
    howItWorks: t("edu.generic.howItWorks"),
    whyPeopleUseIt: t("edu.generic.whyPeopleUseIt"),
    beginnerNotes: t("edu.generic.beginnerNotes"),
    riskNotes: t("edu.generic.riskNotes"),
    plainLanguageSummary: t("edu.generic.plainLanguageSummary", { label }),
    whyExplore: readList("edu.generic.whyExplore", 8),
    characteristics: readList("edu.generic.characteristics", 8),
    assetType: t("edu.generic.assetType"),
    network: null,
  };
}

/**
 * Returns educational copy for the active app language.
 * Uses LanguageProvider active language via translate.t().
 */
export function getAssetEducation(symbol: string, name?: string | null): AssetEducation {
  const key = symbol.trim().toUpperCase();
  if ((KNOWN as readonly string[]).includes(key)) {
    return educationFromKeys(key as KnownSymbol);
  }
  return genericEducation(key, name ?? undefined);
}
