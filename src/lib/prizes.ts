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
    color: "#c3a786",
    colorAlt: "#d4b896",
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
    color: "#deddd3",
    colorAlt: "#f7f6f2",
    textColor: "#333333",
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
    color: "#b8956f",
    colorAlt: "#c3a786",
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
    color: "#e8e2d4",
    colorAlt: "#f7f6f2",
    textColor: "#333333",
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
    color: "#d4c4a8",
    colorAlt: "#e6d9c2",
    textColor: "#333333",
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
    color: "#c9b48a",
    colorAlt: "#d6c49e",
    textColor: "#2A2418",
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
    color: "#ffffff",
    colorAlt: "#f7f6f2",
    textColor: "#999999",
    icon: "–",
    empty: true,
    weight: 114,
  },
];

export const ENALA_PRIZES: Prize[] = [
  {
    id: "resort_2nights",
    label: "ليلة في المنتجع",
    labelEn: "1 resort night",
    shortLabel: "ليلة في المنتجع",
    shortLabelEn: "Resort night",
    description: "ليلة مجانية في أحد منتجعات إناله",
    descriptionEn: "One complimentary night at an Enala resort",
    color: "#B08D45",
    colorAlt: "#C9A85A",
    textColor: "#FFFFFF",
    icon: "★",
    stock: 2,
    weight: 0,
  },
  {
    id: "wallet_1000",
    label: "1000 ريال بالمحفظة",
    labelEn: "SAR 1000 wallet",
    shortLabel: "1000 ريال بالمحفظة",
    shortLabelEn: "SAR 1000 wallet",
    description: "1000 ريال تُضاف لمحفظتك — ادخل موقع enala.sa ثم أدخل كود الربح ehg1000",
    descriptionEn: "SAR 1000 added to your wallet — go to enala.sa and enter prize code ehg1000",
    color: "#C9B48A",
    colorAlt: "#D6C49E",
    textColor: "#2A2418",
    icon: "﷼",
    weight: 2,
  },
  {
    id: "discount20",
    label: "خصم 20%",
    labelEn: "20% off",
    shortLabel: "20%",
    shortLabelEn: "20%",
    description: "خصم 20% على أي حجز — ادخل موقع enala.sa لاستلام الخصم",
    descriptionEn: "20% off any booking — visit enala.sa to redeem",
    color: "#EFE4D0",
    colorAlt: "#F7F0E4",
    textColor: "#2A2418",
    icon: "٪",
    weight: 2,
  },
  {
    id: "discount50",
    label: "خصم 50%",
    labelEn: "50% off",
    shortLabel: "50%",
    shortLabelEn: "50%",
    description: "خصم 50% على أي حجز — ادخل موقع enala.sa لاستلام الخصم",
    descriptionEn: "50% off any booking — visit enala.sa to redeem",
    color: "#d4b896",
    colorAlt: "#e2c9a8",
    textColor: "#2A2418",
    icon: "٪",
    weight: 1,
  },
  {
    id: "luck",
    label: "حظ أوفر",
    labelEn: "Better luck",
    shortLabel: "حظ أوفر",
    shortLabelEn: "Luck",
    description: "حظ أوفر في المرة القادمة",
    descriptionEn: "Better luck next time",
    color: "#f3eee6",
    colorAlt: "#f7f6f2",
    textColor: "#8a8174",
    icon: "–",
    empty: true,
    weight: 95,
  },
  {
    id: "hotel_2nights",
    label: "ليلة في فندق",
    labelEn: "1 hotel night",
    shortLabel: "ليلة في فندق",
    shortLabelEn: "Hotel night",
    description: "ليلة مجانية في أحد فنادق إناله",
    descriptionEn: "A complimentary night at an Enala hotel",
    color: "#9a7a55",
    colorAlt: "#b08d45",
    textColor: "#FFFFFF",
    icon: "★",
    stock: 2,
    weight: 0,
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
  return prizes.map((prize) => {
    if (!prize.stock) return prize;
    const used = Number(counts[prize.id] ?? 0);
    if (Number.isFinite(used) && used >= prize.stock) {
      return { ...prize, exhausted: true };
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
