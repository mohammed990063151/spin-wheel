import { NextResponse } from "next/server";
import { createParticipant, findParticipant, savePrize } from "@/lib/db";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { affGuessComplete, clientMeta } from "@/lib/aff";

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

  let participant = findParticipant(phone, "guess");
  if (!participant) {
    participant = createParticipant(name, phone, "guess");
  }

  if (participant.spun_at) {
    return NextResponse.json({
      ok: false,
      already_spun: true,
      prize_label: participant.prize_label,
    });
  }

  savePrize(phone, "guess", prizeId, prizeLabel);
  await affGuessComplete({
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

  return NextResponse.json({ ok: true });
}
