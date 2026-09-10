import { NextResponse } from "next/server";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { affGuessComplete, clientMeta } from "@/lib/aff";
import { isDevPhone } from "@/lib/dev";
import { notifySpinWin } from "@/lib/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: {
    name?: string;
    phone?: string;
    score?: number;
    maxScore?: number;
    styleTag?: string;
    prizeId?: string;
    prizeLabel?: string;
    prizeDescription?: string;
    prizeEmpty?: boolean;
    rounds?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const phone = normalizePhone(body.phone ?? "");
  const prizeId = (body.prizeId ?? "").trim();
  const prizeLabel = (body.prizeLabel ?? "").trim();
  if (!name || !isValidPhone(phone) || !prizeId || !prizeLabel) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // aff decides whether this phone already played and records the result.
  const aff = await affGuessComplete({
    name,
    phone,
    score: Number(body.score ?? 0),
    max_score: Number(body.maxScore ?? 3),
    style_tag: body.styleTag,
    prize_id: prizeId,
    prize_label: prizeLabel,
    prize_description: body.prizeDescription,
    prize_empty: Boolean(body.prizeEmpty),
    rounds: body.rounds ?? [],
    ...clientMeta(request),
  });

  if (aff?.already_spun && !isDevPhone(phone)) {
    return NextResponse.json({
      ok: false,
      already_spun: true,
      prize_label: aff.prize_label ?? null,
    });
  }

  if (!body.prizeEmpty) {
    await notifySpinWin({
      name,
      phone,
      brand: "place",
      brandName: "خمن السعر",
      prizeId,
      prizeLabel,
      prizeDescription: (body.prizeDescription ?? "").trim(),
    });
  }

  return NextResponse.json({ ok: true });
}
