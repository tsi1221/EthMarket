const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const UNAVAILABLE = "Unavailable";

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return currency.format(value);
}

export function formatMarketPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "Price unavailable";
  }
  return currency.format(value);
}

export function formatAvailableCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return UNAVAILABLE;
  }
  return currency.format(value);
}

export function formatAvailableText(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : UNAVAILABLE;
}

export function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) {
    return UNAVAILABLE;
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatChartTime(
  value: string | null | undefined,
  period: "1D" | "1W" | "1M" | "1Y",
): string {
  if (!value) {
    return UNAVAILABLE;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return UNAVAILABLE;
  }

  if (period === "1D") {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (period === "1W") {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: period === "1Y" ? "numeric" : undefined,
  });
}

export function shortenAddress(value: string | null | undefined): string {
  const address = value?.trim();
  if (!address) {
    return UNAVAILABLE;
  }
  if (address.length <= 18) {
    return address;
  }
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

export function displayWebsite(value: string | null | undefined): string {
  const website = value?.trim();
  if (!website) {
    return UNAVAILABLE;
  }
  return website.replace(/^https?:\/\//i, "");
}

export function formatQuantity(value: number): string {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 6,
  });
}

export function formatPercent(value: number): string {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

export function formatSignedCurrency(value: number): string {
  const prefix = value > 0 ? "+" : value < 0 ? "" : "";
  return `${prefix}${formatCurrency(value)}`;
}

export function formatOrderDate(value: string | null | undefined): string {
  if (!value) {
    return UNAVAILABLE;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return UNAVAILABLE;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function greetingForHour(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 18) {
    return "Good afternoon";
  }
  return "Good evening";
}

export function assetTypeLabel(type: string): string {
  if (type === "etf") {
    return "ETF";
  }
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function venueLabel(venue?: string | null): string {
  if (venue === "cefi") {
    return "Centralized";
  }
  if (venue === "defi") {
    return "On-chain";
  }
  return "";
}

export function tradeableLabel(tradeable?: boolean): string {
  if (tradeable === true) {
    return "Yes";
  }
  if (tradeable === false) {
    return "No";
  }
  return UNAVAILABLE;
}
