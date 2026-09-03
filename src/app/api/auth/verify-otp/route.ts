import { NextResponse } from "next/server";
import { clearOtp, createParticipant, findMatchingOtp, findParticipant } from "@/lib/db";
import { isValidPhone, normalizeOtpCode, normalizePhone, phoneLookupKeys } from "@/lib/phone";
import { affLookupCustomer, affLookupGuess, affRegisterCustomer, clientMeta } from "@/lib/aff";
import { isChannelId } from "@/lib/channels";
import { isDevPhone } from "@/lib/dev";
import { parseLocale, t } from "@/lib/i18n";
import { clearOtpCookieHeader, matchOtpCookie, readOtpCookie } from "@/lib/otp-cookie";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let locale = parseLocale(undefined);
  try {
    return await verifyOtp(request);
  } catch (error) {
    console.error("[verify-otp]", error);
    return NextResponse.json({
      loginphonefailed: t(locale, "api.verifyFailed"),
    });
  }
}

async function verifyOtp(request: Request) {
  let body: {
    name?: string;
    phone?: string;
    code?: string | number;
    brand?: string;
    locale?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ errors: { code: t("ar", "api.invalidData") } });
  }

  const locale = parseLocale(body.locale);
  const name = (body.name ?? "").trim();
  const rawPhone = body.phone ?? "";
  const phone = normalizePhone(rawPhone);
  const code = normalizeOtpCode(body.code);
  const brand = isChannelId(body.brand) ? body.brand : "place";

  if (!name) {
    return NextResponse.json({ errors: { name: t(locale, "api.nameRequired") }, name });
  }
  if (code.length !== 4) {
    return NextResponse.json({ errors: { code: t(locale, "api.codeLength") }, name });
  }
  if (!isValidPhone(phone)) {
    return NextResponse.json({ loginphonefailed: t(locale, "api.phoneInvalid"), name });
  }

  const keys = phoneLookupKeys(rawPhone);
  let challenge = matchOtpCookie(readOtpCookie(request), keys, code);
  if (!challenge) {
    try {
      challenge = findMatchingOtp(keys, code);
    } catch (error) {
      console.error("[verify-otp] lookup", error);
    }
  }
  if (!challenge) {
    return NextResponse.json({
      loginphonefailed: t(locale, "api.codeMismatch"),
      name,
    });
  }

  let participant = findParticipant(phone, brand);
  const isNew = !participant;
  try {
    if (!participant) {
      participant = createParticipant(challenge.name || name, phone, brand);
    }
  } catch (error) {
    console.error("[verify-otp] participant", error);
    participant = {
      id: 0,
      name: challenge.name || name,
      phone,
      brand,
      prize_id: null,
      prize_label: null,
      created_at: new Date().toISOString(),
      spun_at: null,
    };
  }

  for (const key of keys) {
    try {
      clearOtp(key);
    } catch (error) {
      console.error("[verify-otp] clear", error);
    }
  }

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

  let affData = aff;
  try {
    if (spinBrand && !affData) {
      affData = await affLookupCustomer(phone, spinBrand);
    }
  } catch (error) {
    console.error("[verify-otp] aff lookup", error);
  }

  const alreadySpun =
    brand === "sofa" || isDevPhone(phone)
      ? false
      : Boolean(participant.spun_at || affData?.already_spun);

  const response = NextResponse.json({
    status: "true",
    is_new: isNew && !affData?.exists && affData?.is_new !== false,
    already_spun: alreadySpun,
    name: affData?.customer?.name || participant.name,
    phone: participant.phone,
    prize_label: affData?.prize_label || participant.prize_label,
  });
  response.headers.append("Set-Cookie", clearOtpCookieHeader());
  return response;
}
