import { NextResponse } from "next/server";
import {
  canResend,
  generateOtp,
  hashOtp,
  otpExpiry,
  resendWaitSeconds,
} from "@/lib/otp";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { latestOtp, replaceOtpChallenge } from "@/lib/db";
import { isSmsDebug, otpMessage, sendSms } from "@/lib/sms";

export async function POST(request: Request) {
  let body: { name?: string; phone?: string };
  try {
    body = (await request.json()) as { name?: string; phone?: string };
  } catch {
    return NextResponse.json({ errors: { name: "بيانات غير صحيحة" } });
  }

  const name = (body.name ?? "").trim();
  const phone = normalizePhone(body.phone ?? "");
  const errors: { name?: string; phone?: string } = {};

  if (!name) errors.name = "الاسم مطلوب";
  if (!body.phone?.trim()) errors.phone = "رقم الجوال مطلوب";
  else if (!isValidPhone(phone)) errors.phone = "أدخل رقم جوال صحيح";

  if (Object.keys(errors).length) {
    return NextResponse.json({ errors });
  }

  const existing = latestOtp(phone);
  if (existing && !canResend(existing.created_at)) {
    return NextResponse.json({
      loginphonefailed: `انتظر ${resendWaitSeconds(existing.created_at)} ثانية ثم أعد الإرسال`,
    });
  }

  const code = generateOtp();
  replaceOtpChallenge({
    phone,
    name,
    codeHash: hashOtp(phone, code),
    expiresAt: otpExpiry(),
  });

  const sms = await sendSms(otpMessage(code), phone);
  if (!sms.ok) {
    return NextResponse.json({ loginphonefailed: sms.message });
  }

  return NextResponse.json({
    status: "true",
    name,
    ...(isSmsDebug() ? { code_for_test: code } : {}),
  });
}
