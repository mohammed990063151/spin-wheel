import { NextResponse } from "next/server";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { isBrandId } from "@/lib/prizes";
import { affLookupCustomer, affLookupGuess } from "@/lib/aff";
import { isChannelId } from "@/lib/channels";
import { isDevPhone } from "@/lib/dev";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { phone?: string; brand?: string };
  try {
    body = (await request.json()) as { phone?: string; brand?: string };
  } catch {
    return NextResponse.json({ exists: false });
  }

  const phone = normalizePhone(body.phone ?? "");
  const brand = isChannelId(body.brand) ? body.brand : "place";
  if (!isValidPhone(phone)) return NextResponse.json({ exists: false });

  let affData = null;
  try {
    if (brand === "guess") {
      affData = await affLookupGuess(phone);
    } else if (isBrandId(brand)) {
      affData = await affLookupCustomer(phone, brand);
    }
  } catch (error) {
    console.error("[auth-status] aff", error);
  }

  if (!affData?.exists) return NextResponse.json({ exists: false });

  return NextResponse.json({
    exists: true,
    already_spun: isDevPhone(phone) ? false : Boolean(affData.already_spun),
    name: affData.customer?.name ?? "",
    phone,
    prize_label: affData.prize_label ?? null,
    brand,
  });
}
