import type { SofaConfig } from "@/lib/sofa";

export interface GuessRound {
  sofa: SofaConfig;
  price: number;
  options: number[];
}

export interface GuessPrize {
  id: string;
  label: string;
  description: string;
  empty?: boolean;
}

export const GUESS_ROUND_SECONDS = 18;

export function buildGuessOptions(price: number) {
  const deltas = [0, 650, -800, 1400, -450, 2100];
  const unique = new Set<number>();
  unique.add(price);
  for (const delta of deltas) {
    const next = Math.max(2500, Math.round((price + delta) / 50) * 50);
    unique.add(next);
    if (unique.size >= 4) break;
  }
  return [...unique].slice(0, 4).sort(() => Math.random() - 0.5);
}

export function prizeFromScore(score: number, max = 3): GuessPrize {
  if (score >= max) {
    return {
      id: "design15",
      label: "خصم 15% على كنبتك",
      description: "خصم 15% على تنفيذ الكنبة التي صممتها أو أي طقم مشابه من Place",
    };
  }
  if (score === 2) {
    return {
      id: "velvet_pillow",
      label: "وسادة مخملية",
      description: "وسادة مخملية من مصنع Place تُسلّم من جناح المعرض",
    };
  }
  if (score === 1) {
    return {
      id: "consult",
      label: "استشارة تصميم",
      description: "جلسة استشارة تصميم مجانية 15 دقيقة مع فريق Place",
    };
  }
  return {
    id: "catalog",
    label: "كتالوج Place",
    description: "شكراً لذوقك — نرسل لك كتالوج المصنع ونتواصل عند العروض",
    empty: true,
  };
}
