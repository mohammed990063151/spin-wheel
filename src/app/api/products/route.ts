import { NextResponse } from "next/server";
import { affListProductCategories, affListProducts } from "@/lib/aff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (url.searchParams.get("categories") === "1") {
    const result = await affListProductCategories();
    if (!result) {
      return NextResponse.json({ ok: false, data: [], message: "aff unavailable" }, { status: 502 });
    }
    return NextResponse.json(result);
  }

  const page = Number(url.searchParams.get("page") || 1);
  const perPage = Number(url.searchParams.get("per_page") || 24);
  const q = url.searchParams.get("q") || undefined;
  const categoryId = url.searchParams.get("category_id");
  const mainCategory = url.searchParams.get("main_category");

  const result = await affListProducts({
    page: Number.isFinite(page) ? page : 1,
    per_page: Number.isFinite(perPage) ? perPage : 24,
    q,
    category_id: categoryId ? Number(categoryId) : undefined,
    main_category: mainCategory ? Number(mainCategory) : undefined,
  });

  if (!result) {
    return NextResponse.json({ ok: false, data: [], message: "aff unavailable" }, { status: 502 });
  }

  return NextResponse.json(result);
}
