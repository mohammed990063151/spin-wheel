import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export type SeatCount = 2 | 3 | 4 | 5;
export type ArmStyle = "square" | "rounded" | "flared" | "none";
export type LegStyle = "wood" | "hairpin" | "gold" | "hidden";
export type FabricType = "velvet" | "linen" | "leather" | "boucle";
export type PillowStyle = "none" | "pair" | "trio" | "mix";

export interface FabricColor {
  id: string;
  label: string;
  labelEn: string;
  hex: string;
  accent: string;
}

export interface SofaConfig {
  seats: SeatCount;
  arm: ArmStyle;
  legs: LegStyle;
  fabricColor: string;
  fabricType: FabricType;
  pillows: PillowStyle;
}

export const SEAT_OPTIONS: { id: SeatCount; label: string; labelEn: string }[] = [
  { id: 2, label: "مقعدان", labelEn: "2 seats" },
  { id: 3, label: "ثلاثة", labelEn: "3 seats" },
  { id: 4, label: "أربعة", labelEn: "4 seats" },
  { id: 5, label: "خمسة", labelEn: "5 seats" },
];

export const ARM_OPTIONS: { id: ArmStyle; label: string; labelEn: string }[] = [
  { id: "square", label: "مربع", labelEn: "Square" },
  { id: "rounded", label: "دائري", labelEn: "Rounded" },
  { id: "flared", label: "مفتوح", labelEn: "Flared" },
  { id: "none", label: "بدون ذراع", labelEn: "Armless" },
];

export const LEG_OPTIONS: { id: LegStyle; label: string; labelEn: string }[] = [
  { id: "wood", label: "خشب", labelEn: "Wood" },
  { id: "hairpin", label: "معدن رفيع", labelEn: "Hairpin" },
  { id: "gold", label: "ذهبي", labelEn: "Gold" },
  { id: "hidden", label: "مخفي", labelEn: "Hidden" },
];

export const FABRIC_OPTIONS: { id: FabricType; label: string; labelEn: string; hint: string; hintEn: string }[] = [
  { id: "velvet", label: "مخمل", labelEn: "Velvet", hint: "فاخر ولامع بهدوء", hintEn: "Quiet luxury sheen" },
  { id: "linen", label: "كتان", labelEn: "Linen", hint: "خفيف وطبيعي", hintEn: "Light and natural" },
  { id: "leather", label: "جلد", labelEn: "Leather", hint: "أنيق وسهل التنظيف", hintEn: "Smart and easy to clean" },
  { id: "boucle", label: "بوكليه", labelEn: "Bouclé", hint: "ملمس غني ودافئ", hintEn: "Rich, warm texture" },
];

export const PILLOW_OPTIONS: { id: PillowStyle; label: string; labelEn: string }[] = [
  { id: "none", label: "بدون", labelEn: "None" },
  { id: "pair", label: "وسادتان", labelEn: "Two pillows" },
  { id: "trio", label: "ثلاث وسائد", labelEn: "Three pillows" },
  { id: "mix", label: "مزيج فخم", labelEn: "Luxe mix" },
];

export const FABRIC_COLORS: FabricColor[] = [
  { id: "olive", label: "زيتوني", labelEn: "Olive", hex: "#6F7B45", accent: "#C9C2B0" },
  { id: "cream", label: "كريمي", labelEn: "Cream", hex: "#E6D9C4", accent: "#8A6E2F" },
  { id: "navy", label: "كحلي", labelEn: "Navy", hex: "#1E3354", accent: "#D4C4A0" },
  { id: "charcoal", label: "فحمي", labelEn: "Charcoal", hex: "#3B3B3B", accent: "#c3a786" },
  { id: "terracotta", label: "طيني", labelEn: "Terracotta", hex: "#B85C38", accent: "#E8DCC8" },
  { id: "sage", label: "أخضر هادئ", labelEn: "Sage", hex: "#8FA382", accent: "#F3EAD8" },
  { id: "sand", label: "رملي", labelEn: "Sand", hex: "#C4B08A", accent: "#3A3228" },
  { id: "burgundy", label: "عنابي", labelEn: "Burgundy", hex: "#6E2C3A", accent: "#E6D9C4" },
];

export function isSofaConfig(value: unknown): value is SofaConfig {
  if (!value || typeof value !== "object") return false;
  const config = value as SofaConfig;
  return (
    [2, 3, 4, 5].includes(Number(config.seats)) &&
    typeof config.arm === "string" &&
    typeof config.legs === "string" &&
    typeof config.fabricColor === "string" &&
    typeof config.fabricType === "string" &&
    typeof config.pillows === "string"
  );
}

export const DEFAULT_SOFA: SofaConfig = {
  seats: 3,
  arm: "rounded",
  legs: "wood",
  fabricColor: "olive",
  fabricType: "velvet",
  pillows: "mix",
};

export function getFabricColor(id: string): FabricColor {
  return FABRIC_COLORS.find((c) => c.id === id) ?? FABRIC_COLORS[0];
}

export function fabricFeel(type: FabricType) {
  switch (type) {
    case "velvet":
      return { roughness: 0.42, metalness: 0.04, sheen: 0.35 };
    case "linen":
      return { roughness: 0.78, metalness: 0, sheen: 0.08 };
    case "leather":
      return { roughness: 0.28, metalness: 0.12, sheen: 0.2 };
    case "boucle":
      return { roughness: 0.94, metalness: 0, sheen: 0.05 };
  }
}

export function estimateSofaPrice(config: SofaConfig) {
  let price = 2800;
  price += config.seats * 950;
  if (config.arm === "rounded") price += 350;
  if (config.arm === "flared") price += 520;
  if (config.arm === "none") price -= 180;
  if (config.legs === "hairpin") price += 220;
  if (config.legs === "gold") price += 640;
  if (config.fabricType === "velvet") price += 480;
  if (config.fabricType === "leather") price += 1450;
  if (config.fabricType === "boucle") price += 720;
  if (config.pillows === "pair") price += 180;
  if (config.pillows === "trio") price += 260;
  if (config.pillows === "mix") price += 340;
  return Math.round(price / 50) * 50;
}

export function localizedLabel(
  option: { label: string; labelEn: string },
  locale: Locale,
) {
  return locale === "en" ? option.labelEn : option.label;
}

export function sofaSummary(config: SofaConfig, locale: Locale = "ar") {
  const color = getFabricColor(config.fabricColor);
  const seats = localizedLabel(SEAT_OPTIONS.find((s) => s.id === config.seats) ?? SEAT_OPTIONS[0], locale);
  const arm = localizedLabel(ARM_OPTIONS.find((s) => s.id === config.arm) ?? ARM_OPTIONS[0], locale);
  const legs = localizedLabel(LEG_OPTIONS.find((s) => s.id === config.legs) ?? LEG_OPTIONS[0], locale);
  const fabric = localizedLabel(FABRIC_OPTIONS.find((s) => s.id === config.fabricType) ?? FABRIC_OPTIONS[0], locale);
  const pillows = localizedLabel(PILLOW_OPTIONS.find((s) => s.id === config.pillows) ?? PILLOW_OPTIONS[0], locale);
  return t(locale, "sofa.summary", {
    seats,
    arm,
    legs,
    fabric,
    color: localizedLabel(color, locale),
    pillows,
  });
}

export function sofaStyleTag(config: SofaConfig, locale: Locale = "ar") {
  const tags = {
    modern: { ar: "مودرن فاخر", en: "Luxe modern" },
    velvet: { ar: "ملكي مخملي", en: "Royal velvet" },
    scandi: { ar: "سكندنافي دافئ", en: "Warm Scandinavian" },
    boucle: { ar: "بوكليه معاصر", en: "Contemporary bouclé" },
    low: { ar: "منخفض وهادئ", en: "Low and calm" },
    place: { ar: "ذوق Place", en: "Place signature" },
  } as const;
  const pick = (key: keyof typeof tags) => tags[key][locale];
  if (config.fabricType === "leather" && (config.fabricColor === "charcoal" || config.fabricColor === "navy")) {
    return pick("modern");
  }
  if (config.fabricType === "velvet" && (config.legs === "gold" || config.fabricColor === "burgundy")) {
    return pick("velvet");
  }
  if (config.fabricType === "linen" && (config.fabricColor === "cream" || config.fabricColor === "sand")) {
    return pick("scandi");
  }
  if (config.fabricType === "boucle") {
    return pick("boucle");
  }
  if (config.arm === "none" && config.legs === "hidden") {
    return pick("low");
  }
  return pick("place");
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function randomSofaConfig(): SofaConfig {
  return {
    seats: pick(SEAT_OPTIONS.map((s) => s.id)),
    arm: pick(ARM_OPTIONS.map((s) => s.id)),
    legs: pick(LEG_OPTIONS.map((s) => s.id)),
    fabricColor: pick(FABRIC_COLORS.map((s) => s.id)),
    fabricType: pick(FABRIC_OPTIONS.map((s) => s.id)),
    pillows: pick(PILLOW_OPTIONS.map((s) => s.id)),
  };
}

export function formatSar(value: number, locale: Locale = "ar") {
  const formatted = new Intl.NumberFormat(locale === "en" ? "en-SA" : "ar-SA").format(value);
  return t(locale, "guess.sar", { value: formatted });
}
