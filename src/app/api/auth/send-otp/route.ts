import { NextResponse } from "next/server";
import {
  canResend,
  generateOtp,
  hashOtp,
  otpExpiry,
  resendWaitSeconds,
} from "@/lib/otp";
import {
  applyOtpCookie,
  encodeOtpCookie,
  readOtpCookie,
} from "@/lib/otp-cookie";
import { isValidPhone, normalizeOtpCode, normalizePhone } from "@/lib/phone";
import { isSmsDebug, otpMessage, sendSms } from "@/lib/sms";
import { parseLocale, t } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    return await handleSendOtp(request);
  } catch (error) {
    console.error("[send-otp]", error);
    return NextResponse.json({ loginphonefailed: t("ar", "api.smsFailed") });
  }
}

async function handleSendOtp(request: Request) {
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
  const lastCreated = cookieChallenge?.phone === phone ? cookieChallenge.created : 0;
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
  const response = NextResponse.json({
    status: "true",
    name,
    ...(isSmsDebug() ? { code_for_test: code } : {}),
  });
  applyOtpCookie(
    response,
    encodeOtpCookie({
      phone,
      name,
      hash: codeHash,
      exp: expiresAt,
      created,
    }),
    Math.ceil((expiresAt - created) / 1000) + 60,
  );
  return response;
}
