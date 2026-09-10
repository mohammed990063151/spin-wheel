import { NextResponse } from "next/server";
import { affListProductCategories, affListProducts, type AffProduct } from "@/lib/aff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function affOrigin() {
  return (process.env.AFF_API_URL ?? "").replace(/\/api\/?$/, "").replace(/\/$/, "");
}

function fixMediaUrl(url?: string | null): string | null {
  if (!url) return null;
  const origin = affOrigin();
  if (!origin) return url;
  try {
    const parsed = new URL(url, origin);
    const target = new URL(origin);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      parsed.protocol = target.protocol;
      parsed.host = target.host;
    }
    return parsed.toString();
  } catch {
    if (url.startsWith("/")) return `${origin}${url}`;
    return url;
  }
}

function mapProduct(product: AffProduct): AffProduct {
  return {
    ...product,
    photo_url: fixMediaUrl(product.photo_url),
    photo_alt_url: fixMediaUrl(product.photo_alt_url),
    gallery: (product.gallery ?? []).map((item) => ({
      ...item,
      url: fixMediaUrl(item.url),
    })),
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (url.searchParams.get("categories") === "1") {
    const result = await affListProductCategories();
    if (!result) {
      return NextResponse.json({ ok: false, data: [], message: "aff unavailable" }, { status: 502 });
    }
    return NextResponse.json({
      ...result,
      data: (result.data ?? []).map((category) => ({
        ...category,
        photo_url: fixMediaUrl(category.photo_url),
      })),
    });
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

  return NextResponse.json({
    ...result,
    data: (result.data ?? []).map(mapProduct),
  });
}
