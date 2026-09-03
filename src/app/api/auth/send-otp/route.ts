import { NextResponse } from "next/server";
import {
  canResend,
  generateOtp,
  hashOtp,
  otpExpiry,
  resendWaitSeconds,
} from "@/lib/otp";
import {
  encodeOtpCookie,
  otpCookieHeader,
  readOtpCookie,
} from "@/lib/otp-cookie";
import { isValidPhone, normalizeOtpCode, normalizePhone } from "@/lib/phone";
import { latestOtp, replaceOtpChallenge } from "@/lib/db";
import { isSmsDebug, otpMessage, sendSms } from "@/lib/sms";
import { parseLocale, t } from "@/lib/i18n";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { name?: string; phone?: string; locale?: string };
  try {
    body = (await request.json()) as { name?: string; phone?: string; locale?: string };
  } catch {
    return NextResponse.json({ errors: { name: t("ar", "api.invalidData") } });
  }

  const locale = parseLocale(body.locale);
  const name = (body.name ?? "").trim();
  const phone = normalizePhone(body.phone ?? "");
  const errors: { name?: string; phone?: string } = {};

  if (!name) errors.name = t(locale, "api.nameRequired");
  if (!body.phone?.trim()) errors.phone = t(locale, "api.phoneRequired");
  else if (!isValidPhone(phone)) errors.phone = t(locale, "api.phoneInvalid");

  if (Object.keys(errors).length) {
    return NextResponse.json({ errors });
  }

  const cookieChallenge = readOtpCookie(request);
  let lastCreated = cookieChallenge?.phone === phone ? cookieChallenge.created : 0;
  try {
    lastCreated = latestOtp(phone)?.created_at || lastCreated;
  } catch (error) {
    console.error("[send-otp] latest", error);
  }
  if (lastCreated && !canResend(lastCreated)) {
    return NextResponse.json({
      loginphonefailed: t(locale, "api.resendWait", {
        n: resendWaitSeconds(lastCreated),
      }),
    });
  }

  const code = generateOtp();
  const sms = await sendSms(otpMessage(code), phone);
  if (!sms.ok) {
    return NextResponse.json({ loginphonefailed: t(locale, "api.smsFailed") });
  }

  const expiresAt = otpExpiry();
  const created = Date.now();
  const codeHash = hashOtp(phone, normalizeOtpCode(code));
  replaceOtpChallenge({
    phone,
    name,
    codeHash,
    expiresAt,
  });

  const response = NextResponse.json({
    status: "true",
    name,
    ...(isSmsDebug() ? { code_for_test: code } : {}),
  });
  response.headers.append(
    "Set-Cookie",
    otpCookieHeader(
      encodeOtpCookie({
        phone,
        name,
        hash: codeHash,
        exp: expiresAt,
        created,
      }),
      Math.ceil((expiresAt - created) / 1000) + 60,
    ),
  );
  return response;
}
