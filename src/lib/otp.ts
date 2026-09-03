import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { normalizeOtpCode } from "@/lib/phone";

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_GAP_MS = 60 * 1000;

function secret() {
  return process.env.OTP_SECRET || "sakoon-spin-otp";
}

export function generateOtp() {
  return randomInt(1000, 10000);
}

export function hashOtp(phone: string, code: string | number) {
  return createHash("sha256")
    .update(`${phone}:${String(code)}:${secret()}`)
    .digest("hex");
}

export function otpMatches(phone: string, code: string, storedHash: string) {
  const next = Buffer.from(hashOtp(phone, normalizeOtpCode(code)));
  const prev = Buffer.from(String(storedHash));
  if (next.length !== prev.length) return false;
  return timingSafeEqual(next, prev);
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
