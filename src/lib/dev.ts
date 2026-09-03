import { normalizePhone } from "@/lib/phone";

const DEV_PHONES = new Set(["0563244208"]);

export function isDevPhone(phone: string | undefined | null): boolean {
  if (!phone) return false;
  return DEV_PHONES.has(normalizePhone(phone));
}
