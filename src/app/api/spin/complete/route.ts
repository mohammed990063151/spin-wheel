import { NextResponse } from "next/server";
import { findParticipant, savePrize } from "@/lib/db";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { affCompleteSpin, clientMeta } from "@/lib/aff";
import { isBrandId } from "@/lib/prizes";
import { isDevPhone } from "@/lib/dev";

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

  const participant = findParticipant(phone, brand);
  if (!participant) {
    return NextResponse.json({ ok: false, reason: "not_found" }, { status: 404 });
  }

  const meta = clientMeta(request);
  const affPayload = {
    name: name || participant.name,
    phone,
    source: brand,
    prize_id: prizeId,
    prize_label: prizeLabel,
    prize_description: prizeDescription || undefined,
    prize_empty: prizeEmpty,
    spun_at: new Date().toISOString(),
    ...meta,
  };

  if (participant.spun_at && !isDevPhone(phone)) {
    await affCompleteSpin({
      ...affPayload,
      prize_id: participant.prize_id || prizeId,
      prize_label: participant.prize_label || prizeLabel,
      spun_at: participant.spun_at,
    });
    return NextResponse.json({
      ok: false,
      already_spun: true,
      prize_label: participant.prize_label,
    });
  }

  savePrize(phone, brand, prizeId, prizeLabel, { overwrite: isDevPhone(phone) });
  await affCompleteSpin(affPayload);

  return NextResponse.json({ ok: true });
}
