import { NextResponse } from "next/server";
import {
  enalaCatalogList,
  enalaCatalogShow,
  enalaCatalogTypes,
  enalaLegacyCatalogList,
  flattenCatalog,
  type EnalaKind,
} from "@/lib/enala";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function kinds(): EnalaKind[] {
  return ["hotel", "resort", "hall"];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (id) {
    const result = await enalaCatalogShow(Number(id));
    if (!result?.success && !result?.ok) {
      return NextResponse.json({ ok: false, data: null, message: "enala unavailable" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, data: result.data ?? null });
  }

  if (url.searchParams.get("types") === "1") {
    const result = await enalaCatalogTypes();
    if (!result?.success && !result?.ok) {
      return NextResponse.json({ ok: false, data: [], message: "enala unavailable" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, data: result.data ?? [] });
  }

  const kindParam = url.searchParams.get("kind") || "";
  const kind: EnalaKind | "" = kinds().includes(kindParam as EnalaKind)
    ? (kindParam as EnalaKind)
    : "";
  const params = {
    kind,
    q: url.searchParams.get("q") || undefined,
    group: url.searchParams.get("group") === "1" || !kind,
    with_rooms: url.searchParams.get("with_rooms") !== "0",
    page: Number(url.searchParams.get("page") || 1),
    per_page: Number(url.searchParams.get("per_page") || 80),
  };
  const result =
    (await enalaCatalogList(params)) ||
    (await enalaLegacyCatalogList({ kind: params.kind, q: params.q }));

  if (!result?.success && !result?.ok) {
    return NextResponse.json({ ok: false, data: [], message: "enala unavailable" }, { status: 502 });
  }

  const items = flattenCatalog(result.data);
  return NextResponse.json({
    ok: true,
    grouped: Boolean(result.grouped),
    data: result.grouped ? result.data : items,
    items,
    meta: result.meta ?? { total: items.length },
  });
}
