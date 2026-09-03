import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextResponse } from "next/server";
import { otpMatches } from "@/lib/otp";
import { normalizePhone, phoneLookupKeys } from "@/lib/phone";

export const OTP_COOKIE = "spin-otp";

export type OtpCookiePayload = {
  phone: string;
  name: string;
  hash: string;
  exp: number;
  created: number;
};

export type CookieOtpChallenge = {
  id: number;
  phone: string;
  name: string;
  code_hash: string;
  expires_at: number;
  created_at: number;
};

function secret() {
  return process.env.OTP_SECRET || "sakoon-spin-otp";
}

function sign(body: string) {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

function cookieSecure() {
  return Boolean(process.env.VERCEL) || process.env.NODE_ENV === "production";
}

export function encodeOtpCookie(payload: OtpCookiePayload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeOtpCookie(raw: string | undefined | null): OtpCookiePayload | null {
  if (!raw) return null;
  const value = decodeURIComponent(raw);
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = sign(body);
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || left.length === 0) return null;
  if (!timingSafeEqual(left, right)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as OtpCookiePayload;
    if (!payload?.phone || !payload.hash) return null;
    if (Number(payload.exp) <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function readOtpCookie(request: Request): OtpCookiePayload | null {
  const header = request.headers.get("cookie") || "";
  const match = header.match(new RegExp(`(?:^|;\\s*)${OTP_COOKIE}=([^;]*)`));
  return decodeOtpCookie(match?.[1]);
}

export function applyOtpCookie(response: NextResponse, value: string, maxAgeSec: number) {
  response.cookies.set({
    name: OTP_COOKIE,
    value,
    path: "/",
    maxAge: Math.max(0, maxAgeSec),
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
  });
}

export function clearOtpCookie(response: NextResponse) {
  response.cookies.set({
    name: OTP_COOKIE,
    value: "",
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
  });
}

export function matchOtpCookie(
  payload: OtpCookiePayload | null,
  phones: string[],
  code: string,
): CookieOtpChallenge | undefined {
  if (!payload) return undefined;
  const stored = normalizePhone(payload.phone);
  const samePhone = phones.some((phone) => {
    const keys = phoneLookupKeys(phone);
    return keys.includes(payload.phone) || keys.includes(stored) || normalizePhone(phone) === stored;
  });
  if (!samePhone) return undefined;
  if (![payload.phone, stored, ...phones].some((key) => otpMatches(key, code, payload.hash))) {
    return undefined;
  }
  return {
    id: payload.created,
    phone: stored,
    name: payload.name,
    code_hash: payload.hash,
    expires_at: payload.exp,
    created_at: payload.created,
  };
}
