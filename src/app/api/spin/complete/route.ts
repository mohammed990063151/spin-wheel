import { NextResponse } from "next/server";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { affCompleteSpin, clientMeta } from "@/lib/aff";
import { getBrand, isBrandId } from "@/lib/prizes";
import { isDevPhone } from "@/lib/dev";
import { notifySpinWin } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: {
    name?: string;
    phone?: string;
    brand?: string;
    prizeId?: string;
    prizeLabel?: string;
    prizeDescription?: string;
    prizeEmpty?: boolean;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const phone = normalizePhone(body.phone ?? "");
  const brand = isBrandId(body.brand) ? body.brand : "place";
  const prizeId = (body.prizeId ?? "").trim();
  const prizeLabel = (body.prizeLabel ?? "").trim();
  const prizeDescription = (body.prizeDescription ?? "").trim();
  const prizeEmpty = Boolean(body.prizeEmpty);

  if (!isValidPhone(phone) || !prizeId || !prizeLabel) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // aff is the single source of truth: it decides whether the phone already
  // spun and records the prize.
  const aff = await affCompleteSpin({
    name: name || undefined,
    phone,
    source: brand,
    prize_id: prizeId,
    prize_label: prizeLabel,
    prize_description: prizeDescription || undefined,
    prize_empty: prizeEmpty,
    spun_at: new Date().toISOString(),
    ...clientMeta(request),
  });

  if (aff?.already_spun && !isDevPhone(phone)) {
    return NextResponse.json({
      ok: false,
      already_spun: true,
      prize_label: aff.prize_label ?? null,
    });
  }

  if (!prizeEmpty) {
    const brandConfig = getBrand(brand);
    await notifySpinWin({
      name: name || "عميل",
      phone,
      brand,
      brandName: brandConfig.nameAr,
      prizeId,
      prizeLabel,
      prizeDescription,
    });
  }

  return NextResponse.json({ ok: true });
}
