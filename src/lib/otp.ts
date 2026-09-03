import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { normalizeOtpCode, phoneLookupKeys } from "@/lib/phone";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESEND_GAP_MS = 60 * 1000;

function secret() {
  return process.env.OTP_SECRET || "sakoon-spin-otp";
}

export function generateOtp() {
  return randomInt(1000, 10000);
}

export function hashOtp(phone: string, code: string | number) {
  const normalized = normalizeOtpCode(code);
  return createHash("sha256")
    .update(`${phone}:${normalized}:${secret()}`)
    .digest("hex");
}

function hashEqual(left: string, right: string) {
  const a = Buffer.from(String(left).trim().toLowerCase());
  const b = Buffer.from(String(right).trim().toLowerCase());
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}

export function otpMatches(phone: string, code: string, storedHash: string) {
  const stored = String(storedHash).trim().toLowerCase();
  const candidates = phoneLookupKeys(phone).map((key) => hashOtp(key, code));
  candidates.push(hashOtp(phone, code));
  return candidates.some((candidate) => hashEqual(candidate, stored));
}

export function otpExpiry() {
  return Date.now() + OTP_TTL_MS;
}

export function canResend(lastCreatedAt: number) {
  return Date.now() - Number(lastCreatedAt) >= RESEND_GAP_MS;
}

export function resendWaitSeconds(lastCreatedAt: number) {
  const wait = Math.ceil((RESEND_GAP_MS - (Date.now() - Number(lastCreatedAt))) / 1000);
  return Math.max(0, wait);
}
