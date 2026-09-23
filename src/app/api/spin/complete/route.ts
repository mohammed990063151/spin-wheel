import { NextResponse } from "next/server";
import { affCompleteSpin, affPrizeStock, clientMeta } from "@/lib/aff";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { applyPrizeStock, emptyPrize, getBrand, isBrandId, isPrizeWinnable } from "@/lib/prizes";
import { isDevPhone } from "@/lib/dev";
import { notifyWin } from "@/lib/guest-notify";

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

  const brandConfig = getBrand(brand);
  const stock = await affPrizeStock(brand);
  const livePrizes = applyPrizeStock(brandConfig.prizes, stock?.counts ?? {});
  const requested = livePrizes.find((prize) => prize.id === prizeId);
  const fallback = emptyPrize(livePrizes);
  const blocked = Boolean(requested && !isPrizeWinnable(requested) && !requested.empty);
  const exhausted = Boolean(requested?.exhausted) && !prizeEmpty;
  const awarded = (exhausted || blocked) && fallback ? fallback : null;
  const savedPrizeId = awarded?.id ?? prizeId;
  const savedPrizeLabel = awarded?.label ?? prizeLabel;
  const savedPrizeDescription = awarded?.description ?? prizeDescription;
  const savedPrizeEmpty = awarded ? true : prizeEmpty;

  // aff is the single source of truth: it decides whether the phone already
  // spun and records the prize.
  const aff = await affCompleteSpin({
    name: name || undefined,
    phone,
    source: brand,
    prize_id: savedPrizeId,
    prize_label: savedPrizeLabel,
    prize_description: savedPrizeDescription || undefined,
    prize_empty: savedPrizeEmpty,
    spun_at: new Date().toISOString(),
    ...clientMeta(request),
  });

  if (brand !== "enala" && aff?.already_spun && !isDevPhone(phone)) {
    return NextResponse.json({
      ok: false,
      already_spun: true,
      prize_label: aff.prize_label ?? null,
    });
  }

  if (!savedPrizeEmpty) {
    await notifyWin({
      name: name || "عميل",
      phone,
      brand,
      brandName: brandConfig.nameAr,
      prizeId: savedPrizeId,
      prizeLabel: savedPrizeLabel,
      prizeDescription: savedPrizeDescription,
    });
  }

  return NextResponse.json({ ok: true });
}
