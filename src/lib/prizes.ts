export type BrandId = "place" | "enala";

export interface Prize {
  id: string;
  label: string;
  labelEn: string;
  shortLabel?: string;
  shortLabelEn?: string;
  description: string;
  descriptionEn: string;
  color: string;
  colorAlt: string;
  textColor: string;
  icon: string;
  empty?: boolean;
  /** Max times this prize can be awarded. Omit for unlimited. */
  stock?: number;
  /** True when stock is gone — slice stays on the wheel but cannot be won. */
  exhausted?: boolean;
  /** Relative win chance. Higher = more likely. */
  weight: number;
}

export interface BrandConfig {
  id: BrandId;
  name: string;
  nameAr: string;
  prizes: Prize[];
}

export const PLACE_PRIZES: Prize[] = [
  {
    id: "chair",
    label: "كرسي",
    labelEn: "Chair",
    shortLabel: "كرسي",
    shortLabelEn: "Chair",
    description: "كرسي هدية من مصنع Place",
    descriptionEn: "A complimentary chair from Place",
    color: "#006C35",
    colorAlt: "#0a8f4a",
    textColor: "#ffffff",
    icon: "◆",
    stock: 3,
    weight: 1,
  },
  {
    id: "puff",
    label: "بف للتسريحة",
    labelEn: "Vanity puff",
    shortLabel: "بف",
    shortLabelEn: "Puff",
    description: "بف للتسريحة هدية من مصنع Place",
    descriptionEn: "A complimentary vanity puff from Place",
    color: "#ffffff",
    colorAlt: "#e8f5ee",
    textColor: "#006C35",
    icon: "●",
    stock: 3,
    weight: 1,
  },
  {
    id: "baloot",
    label: "طاولة بلوت",
    labelEn: "Baloot table",
    shortLabel: "بلوت",
    shortLabelEn: "Baloot",
    description: "طاولة بلوت هدية من مصنع Place",
    descriptionEn: "A complimentary baloot table from Place",
    color: "#004d25",
    colorAlt: "#006C35",
    textColor: "#ffffff",
    icon: "▣",
    stock: 2,
    weight: 1,
  },
  {
    id: "artwork",
    label: "لوحة",
    labelEn: "Artwork",
    shortLabel: "لوحة",
    shortLabelEn: "Art",
    description: "لوحة هدية من مصنع Place",
    descriptionEn: "A complimentary artwork from Place",
    color: "#d4f0e0",
    colorAlt: "#ffffff",
    textColor: "#004d25",
    icon: "▭",
    stock: 5,
    weight: 1,
  },
  {
    id: "bedroom_design",
    label: "تصميم غرفة نوم مجاني",
    labelEn: "Free bedroom design",
    shortLabel: "تصميم",
    shortLabelEn: "Design",
    description: "تصميم غرفة نوم مجاني من فريق Place",
    descriptionEn: "A free bedroom design from the Place team",
    color: "#1a9b5c",
    colorAlt: "#3cb371",
    textColor: "#ffffff",
    icon: "✎",
    stock: 2,
    weight: 1,
  },
  {
    id: "consult",
    label: "استشارة مصمم مجانية",
    labelEn: "Free designer consult",
    shortLabel: "استشارة",
    shortLabelEn: "Consult",
    description: "استشارة مصمم مجانية من فريق Place",
    descriptionEn: "A free designer consultation from Place",
    color: "#e8f5ee",
    colorAlt: "#f4fcf7",
    textColor: "#006C35",
    icon: "✦",
    stock: 2,
    weight: 1,
  },
  {
    id: "none",
    label: "حظ أوفر",
    labelEn: "Better luck",
    shortLabel: "حظ أوفر",
    shortLabelEn: "Luck",
    description: "حظ أوفر في المرة القادمة",
    descriptionEn: "Better luck next time",
    color: "#f7faf8",
    colorAlt: "#ffffff",
    textColor: "#6b8575",
    icon: "–",
    empty: true,
    weight: 114,
  },
];

export const ENALA_PRIZES: Prize[] = [
  {
    id: "wallet_596",
    label: "596 ريال بالمحفظة",
    labelEn: "SAR 596 wallet",
    shortLabel: "596 ريال",
    shortLabelEn: "SAR 596",
    description: "596 ريال تُضاف لمحفظتك — ادخل موقع enala.sa ثم أدخل كود الربح ehg596",
    descriptionEn: "SAR 596 added to your wallet — go to enala.sa and enter prize code ehg596",
    color: "#006C35",
    colorAlt: "#0a8f4a",
    textColor: "#FFFFFF",
    icon: "﷼",
    stock: 6,
    weight: 6,
  },
  {
    id: "wallet_1096",
    label: "1096 ريال بالمحفظة",
    labelEn: "SAR 1096 wallet",
    shortLabel: "1096 ريال",
    shortLabelEn: "SAR 1096",
    description: "1096 ريال تُضاف لمحفظتك — ادخل موقع enala.sa ثم أدخل كود الربح ehg1096",
    descriptionEn: "SAR 1096 added to your wallet — go to enala.sa and enter prize code ehg1096",
    color: "#ffffff",
    colorAlt: "#e8f5ee",
    textColor: "#006C35",
    icon: "﷼",
    stock: 4,
    weight: 4,
  },
  {
    id: "resort_2nights",
    label: "ليلة مجانية في منتجع",
    labelEn: "Free resort night",
    shortLabel: "ليلة منتجع",
    shortLabelEn: "Resort night",
    description: "ليلة مجانية في أحد منتجعات إناله",
    descriptionEn: "One complimentary night at an Enala resort",
    color: "#004d25",
    colorAlt: "#006C35",
    textColor: "#FFFFFF",
    icon: "★",
    stock: 2,
    weight: 2,
  },
  {
    id: "luck",
    label: "حظ أوفر",
    labelEn: "Better luck",
    shortLabel: "حظ أوفر",
    shortLabelEn: "Luck",
    description: "حظ أوفر في المرة القادمة",
    descriptionEn: "Better luck next time",
    color: "#f4fcf7",
    colorAlt: "#ffffff",
    textColor: "#6b8575",
    icon: "–",
    empty: true,
    stock: 1,
    weight: 1,
  },
  {
    id: "hotel_2nights",
    label: "ليلة مجانية في فندق",
    labelEn: "Free hotel night",
    shortLabel: "ليلة فندق",
    shortLabelEn: "Hotel night",
    description: "ليلة مجانية في أحد فنادق إناله",
    descriptionEn: "A complimentary night at an Enala hotel",
    color: "#1a9b5c",
    colorAlt: "#3cb371",
    textColor: "#FFFFFF",
    icon: "★",
    stock: 2,
    weight: 2,
  },
];

export const BRANDS: Record<BrandId, BrandConfig> = {
  place: {
    id: "place",
    name: "Place",
    nameAr: "مصنع الأثاث",
    prizes: PLACE_PRIZES,
  },
  enala: {
    id: "enala",
    name: "Enala",
    nameAr: "فنادق إناله",
    prizes: ENALA_PRIZES,
  },
};

export function isBrandId(value: string | undefined): value is BrandId {
  return value === "place" || value === "enala";
}

export function getBrand(id: BrandId): BrandConfig {
  return BRANDS[id];
}

export function isEmptyPrize(prize: Prize) {
  return Boolean(prize.empty);
}

export function emptyPrize(prizes: Prize[]) {
  return prizes.find((prize) => prize.empty);
}

export function isPrizeWinnable(prize: Prize) {
  return !prize.exhausted && Math.max(0, prize.weight) > 0;
}

export function applyPrizeStock(prizes: Prize[], counts: Record<string, number>): Prize[] {
  // Enala: every slice has stock (incl. luck) → remaining stock drives chance.
  // Place: luck is unlimited → keep original weights, only mark exhausted gifts.
  const finitePool = prizes.length > 0 && prizes.every((prize) => typeof prize.stock === "number");
  return prizes.map((prize) => {
    if (!prize.stock) return prize;
    const used = Number(counts[prize.id] ?? 0);
    const taken = Number.isFinite(used) ? used : 0;
    if (taken >= prize.stock) {
      return { ...prize, exhausted: true, weight: 0 };
    }
    if (finitePool) {
      return { ...prize, weight: prize.stock - taken };
    }
    return prize;
  });
}

export function resolveAwardedPrize(prizes: Prize[], landed: Prize): Prize {
  if (!landed.exhausted) return landed;
  return emptyPrize(prizes) ?? { ...landed, empty: true };
}

export function prizeLabel(prize: Pick<Prize, "label" | "labelEn">, locale: "ar" | "en") {
  return locale === "en" ? prize.labelEn : prize.label;
}

export function prizeWheelLabel(prize: Prize, locale: "ar" | "en") {
  if (locale === "en") return prize.shortLabelEn || prize.labelEn;
  return prize.shortLabel || prize.label;
}

export function prizeDescription(
  prize: Pick<Prize, "description" | "descriptionEn">,
  locale: "ar" | "en",
) {
  return locale === "en" ? prize.descriptionEn : prize.description;
}

export function segmentCount(prizes: Prize[]) {
  return prizes.length;
}

export function segmentAngle(prizes: Prize[]) {
  return 360 / prizes.length;
}

export function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function getPrizeAtRotation(prizes: Prize[], rotationDeg: number): Prize {
  const angle = segmentAngle(prizes);
  const count = segmentCount(prizes);
  const underPointer = normalizeAngle(360 - normalizeAngle(rotationDeg));
  const index = Math.floor(underPointer / angle) % count;
  return prizes[index];
}

export function totalPrizeStock(prizes: Prize[]) {
  return prizes.reduce((sum, prize) => sum + (prize.stock ?? 0), 0);
}

export function usedPrizeStock(counts: Record<string, number>, prizes: Prize[]) {
  return prizes.reduce((sum, prize) => {
    if (!prize.stock) return sum;
    const used = Number(counts[prize.id] ?? 0);
    return sum + (Number.isFinite(used) ? Math.min(used, prize.stock) : 0);
  }, 0);
}

export function rotationForPrize(
  prizes: Prize[],
  prizeIndex: number,
  extraSpins = 6,
): number {
  const angle = segmentAngle(prizes);
  const centerOfSegment = prizeIndex * angle + angle / 2;
  const landing = normalizeAngle(360 - centerOfSegment);
  return extraSpins * 360 + landing;
}

export function pickPrizeIndex(prizes: Prize[]): number {
  const chances = prizes.map((prize) => (isPrizeWinnable(prize) ? Math.max(0, prize.weight) : 0));
  const total = chances.reduce((sum, chance) => sum + chance, 0);
  if (total <= 0) {
    const emptyIndex = prizes.findIndex((prize) => prize.empty);
    return emptyIndex >= 0 ? emptyIndex : 0;
  }
  let cursor = Math.random() * total;
  for (let i = 0; i < chances.length; i++) {
    cursor -= chances[i];
    if (cursor <= 0) return i;
  }
  return prizes.length - 1;
}
