import { NextResponse } from "next/server";
import { affPrizeStock } from "@/lib/aff";
import { isBrandId } from "@/lib/prizes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const brand = url.searchParams.get("brand") ?? "place";
  if (!isBrandId(brand)) {
    return NextResponse.json({ ok: false, counts: {} }, { status: 400 });
  }

  const aff = await affPrizeStock(brand);
  return NextResponse.json({
    ok: true,
    counts: aff?.counts ?? {},
  });
}
