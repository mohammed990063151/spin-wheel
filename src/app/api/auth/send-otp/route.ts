import { NextResponse } from "next/server";
import {
  canResend,
  generateOtp,
  hashOtp,
  otpExpiry,
  resendWaitSeconds,
} from "@/lib/otp";
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

  const existing = latestOtp(phone);
  if (existing && !canResend(existing.created_at)) {
    return NextResponse.json({
      loginphonefailed: t(locale, "api.resendWait", {
        n: resendWaitSeconds(existing.created_at),
      }),
    });
  }

  const code = generateOtp();
  const sms = await sendSms(otpMessage(code), phone);
  if (!sms.ok) {
    return NextResponse.json({ loginphonefailed: t(locale, "api.smsFailed") });
  }

  try {
    replaceOtpChallenge({
      phone,
      name,
      codeHash: hashOtp(phone, normalizeOtpCode(code)),
      expiresAt: otpExpiry(),
    });
  } catch (error) {
    console.error("[send-otp] store", error);
    return NextResponse.json({
      loginphonefailed: t(locale, "api.otpStoreFailed"),
    });
  }

  return NextResponse.json({
    status: "true",
    name,
    ...(isSmsDebug() ? { code_for_test: code } : {}),
  });
}
