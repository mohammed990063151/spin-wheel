import { NextResponse } from "next/server";
import { clearOtp, createParticipant, findParticipant, latestOtp } from "@/lib/db";
import { otpMatches } from "@/lib/otp";
import { isValidPhone, normalizeOtpCode, normalizePhone } from "@/lib/phone";
import { affLookupCustomer, affLookupGuess, affRegisterCustomer, clientMeta } from "@/lib/aff";
import { isChannelId } from "@/lib/channels";

export async function POST(request: Request) {
  let body: { name?: string; phone?: string; code?: string | number; brand?: string };
  try {
    body = (await request.json()) as {
      name?: string;
      phone?: string;
      code?: string | number;
      brand?: string;
    };
  } catch {
    return NextResponse.json({ errors: { code: "بيانات غير صحيحة" } });
  }

  try {
    const name = (body.name ?? "").trim();
    const phone = normalizePhone(body.phone ?? "");
    const code = normalizeOtpCode(body.code);
    const brand = isChannelId(body.brand) ? body.brand : "place";
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
    if (!challenge || Date.now() > Number(challenge.expires_at)) {
      return NextResponse.json({
        loginphonefailed: "كود التحقق غير صحيح",
        name,
      });
    }

    if (!otpMatches(phone, code, String(challenge.code_hash))) {
      return NextResponse.json({
        loginphonefailed: "كود التحقق غير صحيح",
        name,
      });
    }

    let participant = findParticipant(phone, brand);
    const isNew = !participant;
    if (!participant) {
      participant = createParticipant(challenge.name || name, phone, brand);
    }

    clearOtp(phone);

    const meta = clientMeta(request);
    const spinBrand = brand === "enala" || brand === "place" ? brand : null;
    let aff = null;
    try {
      aff = spinBrand
        ? await affRegisterCustomer({
            name: participant.name,
            phone: participant.phone,
            source: spinBrand,
            ...meta,
          })
        : brand === "guess"
          ? await affLookupGuess(phone)
          : null;
    } catch (error) {
      console.error("[verify-otp] aff", error);
    }
    const affData = spinBrand
      ? aff ?? (await affLookupCustomer(phone, spinBrand).catch(() => null))
      : aff;
    const alreadySpun =
      brand === "sofa"
        ? false
        : Boolean(participant.spun_at || affData?.already_spun);

    return NextResponse.json({
      status: "true",
      is_new: isNew && !affData?.exists && affData?.is_new !== false,
      already_spun: alreadySpun,
      name: affData?.customer?.name || participant.name,
      phone: participant.phone,
      prize_label: affData?.prize_label || participant.prize_label,
    });
  } catch (error) {
    console.error("[verify-otp]", error);
    return NextResponse.json({
      loginphonefailed: "تعذر التحقق الآن، أعد إدخال الكود",
    });
  }
}
