export function toAsciiDigits(input: string): string {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const eastern = "۰۱۲۳۴۵۶۷۸۹";
  return String(input ?? "")
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(eastern.indexOf(digit)));
}

export function normalizePhone(input: string): string {
  let digits = toAsciiDigits(input).replace(/\D/g, "");
  if (digits.startsWith("00966")) digits = digits.slice(5);
  else if (digits.startsWith("966")) digits = digits.slice(3);
  if (digits.startsWith("5") && digits.length === 9) digits = `0${digits}`;
  return digits;
}

export function phoneLookupKeys(input: string): string[] {
  const normalized = normalizePhone(input);
  const keys = new Set<string>([toAsciiDigits(input).replace(/\D/g, ""), normalized].filter(Boolean));
  if (normalized.startsWith("0") && normalized.length === 10) {
    const national = normalized.slice(1);
    keys.add(national);
    keys.add(`966${national}`);
  }
  return [...keys];
}

export function isValidPhone(phone: string): boolean {
  const digits = normalizePhone(phone);
  return digits.length >= 9 && digits.length <= 15;
}

export function normalizeOtpCode(input: string | number | undefined): string {
  return toAsciiDigits(String(input ?? ""))
    .replace(/\D/g, "")
    .slice(0, 4);
}

/** WhatsApp / E.164: 05xxxxxxxx → +9665xxxxxxxx */
export function toE164(input: string, defaultCountry = "966"): string {
  const normalized = normalizePhone(input);
  let digits = normalized.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (!digits.startsWith(defaultCountry)) digits = `${defaultCountry}${digits}`;
  return `+${digits}`;
}
