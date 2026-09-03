import { NextResponse } from "next/server";
import { isValidPhone, normalizeOtpCode, normalizePhone, phoneLookupKeys } from "@/lib/phone";
import { affLookupCustomer, affLookupGuess, affRegisterCustomer, clientMeta } from "@/lib/aff";
import { isChannelId } from "@/lib/channels";
import { isDevPhone } from "@/lib/dev";
import { parseLocale, t } from "@/lib/i18n";
import { clearOtpCookie, matchOtpCookie, readOtpCookie } from "@/lib/otp-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const locale = parseLocale(undefined);
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
  const challenge = matchOtpCookie(readOtpCookie(request), keys, code);
  if (!challenge) {
    return NextResponse.json({
      loginphonefailed: t(locale, "api.codeMismatch"),
      name,
    });
  }

  // Everything is stored in aff; there is no local database.
  const resolvedName = challenge.name || name;
  const meta = clientMeta(request);
  const spinBrand = brand === "enala" || brand === "place" ? brand : null;
  let affData = null;
  try {
    if (spinBrand) {
      affData =
        (await affRegisterCustomer({
          name: resolvedName,
          phone,
          source: spinBrand,
          ...meta,
        })) || (await affLookupCustomer(phone, spinBrand));
    } else if (brand === "guess") {
      affData = await affLookupGuess(phone);
    }
  } catch (error) {
    console.error("[verify-otp] aff", error);
  }

  const alreadySpun =
    brand === "sofa" || isDevPhone(phone) ? false : Boolean(affData?.already_spun);

  const response = NextResponse.json({
    status: "true",
    is_new: affData ? Boolean(affData.is_new ?? !affData.exists) : true,
    already_spun: alreadySpun,
    name: affData?.customer?.name || resolvedName,
    phone,
    prize_label: affData?.prize_label ?? null,
  });
  clearOtpCookie(response);
  return response;
}
