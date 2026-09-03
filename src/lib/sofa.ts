export type SeatCount = 2 | 3 | 4 | 5;
export type ArmStyle = "square" | "rounded" | "flared" | "none";
export type LegStyle = "wood" | "hairpin" | "gold" | "hidden";
export type FabricType = "velvet" | "linen" | "leather" | "boucle";
export type PillowStyle = "none" | "pair" | "trio" | "mix";

export interface FabricColor {
  id: string;
  label: string;
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

export const SEAT_OPTIONS: { id: SeatCount; label: string }[] = [
  { id: 2, label: "مقعدان" },
  { id: 3, label: "ثلاثة" },
  { id: 4, label: "أربعة" },
  { id: 5, label: "خمسة" },
];

export const ARM_OPTIONS: { id: ArmStyle; label: string }[] = [
  { id: "square", label: "مربع" },
  { id: "rounded", label: "دائري" },
  { id: "flared", label: "مفتوح" },
  { id: "none", label: "بدون ذراع" },
];

export const LEG_OPTIONS: { id: LegStyle; label: string }[] = [
  { id: "wood", label: "خشب" },
  { id: "hairpin", label: "معدن رفيع" },
  { id: "gold", label: "ذهبي" },
  { id: "hidden", label: "مخفي" },
];

export const FABRIC_OPTIONS: { id: FabricType; label: string; hint: string }[] = [
  { id: "velvet", label: "مخمل", hint: "فاخر ولامع بهدوء" },
  { id: "linen", label: "كتان", hint: "خفيف وطبيعي" },
  { id: "leather", label: "جلد", hint: "أنيق وسهل التنظيف" },
  { id: "boucle", label: "بوكليه", hint: "ملمس غني ودافئ" },
];

export const PILLOW_OPTIONS: { id: PillowStyle; label: string }[] = [
  { id: "none", label: "بدون" },
  { id: "pair", label: "وسادتان" },
  { id: "trio", label: "ثلاث وسائد" },
  { id: "mix", label: "مزيج فخم" },
];

export const FABRIC_COLORS: FabricColor[] = [
  { id: "olive", label: "زيتوني", hex: "#6F7B45", accent: "#C9C2B0" },
  { id: "cream", label: "كريمي", hex: "#E6D9C4", accent: "#8A6E2F" },
  { id: "navy", label: "كحلي", hex: "#1E3354", accent: "#D4C4A0" },
  { id: "charcoal", label: "فحمي", hex: "#3B3B3B", accent: "#C4A35A" },
  { id: "terracotta", label: "طيني", hex: "#B85C38", accent: "#E8DCC8" },
  { id: "sage", label: "أخضر هادئ", hex: "#8FA382", accent: "#F3EAD8" },
  { id: "sand", label: "رملي", hex: "#C4B08A", accent: "#3A3228" },
  { id: "burgundy", label: "عنابي", hex: "#6E2C3A", accent: "#E6D9C4" },
];

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

export function sofaSummary(config: SofaConfig) {
  const color = getFabricColor(config.fabricColor);
  const seats = SEAT_OPTIONS.find((s) => s.id === config.seats)?.label ?? "";
  const arm = ARM_OPTIONS.find((s) => s.id === config.arm)?.label ?? "";
  const legs = LEG_OPTIONS.find((s) => s.id === config.legs)?.label ?? "";
  const fabric = FABRIC_OPTIONS.find((s) => s.id === config.fabricType)?.label ?? "";
  const pillows = PILLOW_OPTIONS.find((s) => s.id === config.pillows)?.label ?? "";
  return `${seats} · ذراع ${arm} · أرجل ${legs} · ${fabric} ${color.label} · ${pillows}`;
}

export function sofaStyleTag(config: SofaConfig) {
  if (config.fabricType === "leather" && (config.fabricColor === "charcoal" || config.fabricColor === "navy")) {
    return "مودرن فاخر";
  }
  if (config.fabricType === "velvet" && (config.legs === "gold" || config.fabricColor === "burgundy")) {
    return "ملكي مخملي";
  }
  if (config.fabricType === "linen" && (config.fabricColor === "cream" || config.fabricColor === "sand")) {
    return "سكندنافي دافئ";
  }
  if (config.fabricType === "boucle") {
    return "بوكليه معاصر";
  }
  if (config.arm === "none" && config.legs === "hidden") {
    return "منخفض وهادئ";
  }
  return "ذوق Place";
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

export function formatSar(value: number) {
  return new Intl.NumberFormat("ar-SA").format(value) + " ر.س";
}
