export type BrandId = "place" | "enala";

export interface Prize {
  id: string;
  label: string;
  description: string;
  color: string;
  colorAlt: string;
  textColor: string;
  icon: string;
  empty?: boolean;
  /** Relative win chance. Higher = more likely. */
  weight: number;
}

export interface BrandConfig {
  id: BrandId;
  name: string;
  nameAr: string;
  tagline: string;
  support: string;
  footer: string;
  prizes: Prize[];
}

export const PLACE_PRIZES: Prize[] = [
  {
    id: "discount",
    label: "خصم",
    description: "خصم على طلبك",
    color: "#0F5C4C",
    colorAlt: "#147A65",
    textColor: "#F5E6C8",
    icon: "٪",
    weight: 1,
  },
  {
    id: "pillow",
    label: "وسادة",
    description: "وسادة هدية",
    color: "#C4A35A",
    colorAlt: "#D4B56E",
    textColor: "#1A2E28",
    icon: "◆",
    weight: 1,
  },
  {
    id: "none",
    label: "لا شيء",
    description: "حظ أوفر",
    color: "#2A3230",
    colorAlt: "#3A4440",
    textColor: "#C4B8A0",
    icon: "–",
    empty: true,
    weight: 1,
  },
  {
    id: "delivery",
    label: "توصيل",
    description: "توصيل مجاني",
    color: "#1A3A4A",
    colorAlt: "#245066",
    textColor: "#F5E6C8",
    icon: "▸",
    weight: 1,
  },
  {
    id: "install",
    label: "تركيب",
    description: "تركيب مجاني",
    color: "#8B3A2F",
    colorAlt: "#A3483A",
    textColor: "#F5E6C8",
    icon: "★",
    weight: 1,
  },
];

/** Odds are not equal — grand prize is rare. Tune weights here. */
export const ENALA_PRIZES: Prize[] = [
  {
    id: "discount20",
    label: "خصم 20%",
    description: "خصم 20% على أي حجز بموقع إنالة",
    color: "#1A2B48",
    colorAlt: "#243656",
    textColor: "#F5E6C8",
    icon: "٪",
    weight: 55,
  },
  {
    id: "coupon500",
    label: "500 ريال",
    description: "كوبون 500 ريال يُضاف للمحفظة على موقع إنالة",
    color: "#243656",
    colorAlt: "#2E4570",
    textColor: "#F5E6C8",
    icon: "﷼",
    weight: 27,
  },
  {
    id: "coupon1000",
    label: "1000 ريال",
    description: "كوبون 1000 ريال يُضاف للمحفظة على موقع إنالة",
    color: "#152238",
    colorAlt: "#1C2F4D",
    textColor: "#F5E6C8",
    icon: "﷼",
    weight: 13,
  },
  {
    id: "free_night",
    label: "ليلة مجانية",
    description: "ليلة مجانية بأحد منتجعات إنالة — الجائزة الكبرى",
    color: "#8B6A3A",
    colorAlt: "#C4A35A",
    textColor: "#1A1408",
    icon: "★",
    weight: 5,
  },
];

export const BRANDS: Record<BrandId, BrandConfig> = {
  place: {
    id: "place",
    name: "Place",
    nameAr: "مصنع الأثاث",
    tagline: "لف العجلة واربح",
    support: "سجّل بالجوال ثم لف",
    footer: "فرصة واحدة لكل عميل",
    prizes: PLACE_PRIZES,
  },
  enala: {
    id: "enala",
    name: "Enala",
    nameAr: "فنادق إنالة",
    tagline: "مسابقة عجلة الحظ",
    support: "سجّل بالاسم والجوال ثم لف",
    footer: "هديتك تُسجّل على موقع إنالة",
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
  const total = prizes.reduce((sum, prize) => sum + Math.max(0, prize.weight), 0);
  if (total <= 0) return Math.floor(Math.random() * prizes.length);
  let cursor = Math.random() * total;
  for (let i = 0; i < prizes.length; i++) {
    cursor -= Math.max(0, prizes[i].weight);
    if (cursor <= 0) return i;
  }
  return prizes.length - 1;
}
