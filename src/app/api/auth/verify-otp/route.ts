import { NextResponse } from "next/server";
import { clearOtp, createParticipant, findParticipant, latestOtp } from "@/lib/db";
import { otpMatches } from "@/lib/otp";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { affLookupCustomer, affRegisterCustomer, clientMeta } from "@/lib/aff";
import { isBrandId } from "@/lib/prizes";

export async function POST(request: Request) {
  let body: { name?: string; phone?: string; code?: string; brand?: string };
  try {
    body = (await request.json()) as {
      name?: string;
      phone?: string;
      code?: string;
      brand?: string;
    };
  } catch {
    return NextResponse.json({ errors: { code: "بيانات غير صحيحة" } });
  }

  const name = (body.name ?? "").trim();
  const phone = normalizePhone(body.phone ?? "");
  const code = (body.code ?? "").trim();
  const brand = isBrandId(body.brand) ? body.brand : "place";
  const errors: { name?: string; code?: string } = {};

  if (!name) errors.name = "الاسم مطلوب";
  if (!code) errors.code = "الكود مطلوب";

  if (Object.keys(errors).length) {
    return NextResponse.json({ errors, name });
  }

  if (!isValidPhone(phone)) {
    return NextResponse.json({
      loginphonefailed: "كود التحقق غير صحيح",
      name,
    });
  }

  const challenge = latestOtp(phone);
  if (!challenge || Date.now() > challenge.expires_at) {
    return NextResponse.json({
      loginphonefailed: "كود التحقق غير صحيح",
      name,
    });
  }

  if (!otpMatches(phone, code, challenge.code_hash)) {
    return NextResponse.json({
      loginphonefailed: "كود التحقق غير صحيح",
      name,
    });
  }

  clearOtp(phone);

  let participant = findParticipant(phone, brand);
  const isNew = !participant;
  if (!participant) {
    participant = createParticipant(challenge.name || name, phone, brand);
  }

  const meta = clientMeta(request);
  const aff = await affRegisterCustomer({
    name: participant.name,
    phone: participant.phone,
    source: brand,
    ...meta,
  });
  const affData = aff ?? (await affLookupCustomer(phone, brand));
  const alreadySpun = Boolean(participant.spun_at || affData?.already_spun);

  return NextResponse.json({
    status: "true",
    is_new: isNew && !affData?.exists && affData?.is_new !== false,
    already_spun: alreadySpun,
    name: affData?.customer?.name || participant.name,
    phone: participant.phone,
    prize_label: affData?.prize_label || participant.prize_label,
  });
}
