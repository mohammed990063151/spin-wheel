import { NextResponse } from "next/server";
import {
  enalaCatalogList,
  enalaCatalogShow,
  enalaCatalogTypes,
  enalaLegacyCatalogList,
  flattenCatalog,
  slimCatalogItem,
  type EnalaCatalogItem,
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
  const headers = {
    "Cache-Control": "no-store",
  };

  if (id) {
    const result = await enalaCatalogShow(Number(id));
    if (!result?.success && !result?.ok) {
      return NextResponse.json({ ok: false, data: null, message: "enala unavailable" }, { status: 502 });
    }
    const raw = result.data as EnalaCatalogItem | EnalaCatalogItem[] | null;
    const data = Array.isArray(raw) ? raw[0] ?? null : raw;
    return NextResponse.json({ ok: true, data }, { headers });
  }

  if (url.searchParams.get("types") === "1") {
    const result = await enalaCatalogTypes();
  if (!result?.success && !result?.ok) {
    console.error("[enala] catalog list unavailable");
    return NextResponse.json({ ok: false, data: [], items: [], message: "enala unavailable" }, { status: 502 });
  }
    return NextResponse.json({ ok: true, data: result.data ?? [] }, { headers });
  }

  const kindParam = url.searchParams.get("kind") || "";
  const kind: EnalaKind | "" = kinds().includes(kindParam as EnalaKind)
    ? (kindParam as EnalaKind)
    : "";
  const slim = url.searchParams.get("slim") !== "0";
  const params = {
    kind,
    q: url.searchParams.get("q") || undefined,
    group: url.searchParams.get("group") === "1" || !kind,
    with_rooms: url.searchParams.get("with_rooms") === "1",
    page: Number(url.searchParams.get("page") || 1),
    per_page: Number(url.searchParams.get("per_page") || 120),
  };
  const result =
    (await enalaCatalogList(params)) ||
    (await enalaLegacyCatalogList({ kind: params.kind, q: params.q }));

  if (!result?.success && !result?.ok) {
    console.error("[enala] catalog list empty", {
      url: enalaBaseSafe(),
      hasKey: Boolean(process.env.ENALA_API_KEY || process.env.ENALA_CATALOG_API_KEY),
    });
    return NextResponse.json({ ok: false, data: [], items: [], message: "enala unavailable" }, { status: 502 });
  }

  const items = flattenCatalog(result.data).map((item) => (slim ? slimCatalogItem(item) : item));
  return NextResponse.json(
    {
      ok: true,
      grouped: Boolean(result.grouped),
      data: items,
      items,
      meta: result.meta ?? { total: items.length },
    },
    { headers },
  );
}
