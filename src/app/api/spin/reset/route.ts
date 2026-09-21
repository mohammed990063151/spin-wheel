import { NextResponse } from "next/server";
import { affResetPrizeStock } from "@/lib/aff";
import { isBrandId } from "@/lib/prizes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { brand?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const brand = isBrandId(body.brand) ? body.brand : "";
  if (!brand) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const result = await affResetPrizeStock(brand);
  if (!result) {
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  return NextResponse.json({ ok: true, deleted: result.deleted ?? 0 });
}
