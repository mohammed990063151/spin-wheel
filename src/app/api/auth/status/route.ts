import { NextResponse } from "next/server";
import { findParticipant } from "@/lib/db";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { isBrandId } from "@/lib/prizes";

export async function POST(request: Request) {
  let body: { phone?: string; brand?: string };
  try {
    body = (await request.json()) as { phone?: string; brand?: string };
  } catch {
    return NextResponse.json({ exists: false });
  }

  const phone = normalizePhone(body.phone ?? "");
  const brand = isBrandId(body.brand) ? body.brand : "place";
  if (!isValidPhone(phone)) return NextResponse.json({ exists: false });

  const participant = findParticipant(phone, brand);
  if (!participant) return NextResponse.json({ exists: false });

  return NextResponse.json({
    exists: true,
    already_spun: Boolean(participant.spun_at),
    name: participant.name,
    phone: participant.phone,
    prize_label: participant.prize_label,
    brand,
  });
}
