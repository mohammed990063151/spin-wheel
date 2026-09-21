import type { BrandId } from "@/lib/prizes";

type AffCustomer = {
  id: number;
  name: string;
  phone: string;
  prize_id: string | null;
  prize_label: string | null;
  prize_description: string | null;
  prize_empty: boolean;
  status: string;
  source?: string;
  registered_at: string | null;
  spun_at: string | null;
};

type AffResponse = {
  ok?: boolean;
  exists?: boolean;
  is_new?: boolean;
  already_spun?: boolean;
  prize_id?: string | null;
  prize_label?: string | null;
  customer?: AffCustomer;
  message?: string;
};

const LIVE_AFF_API = "https://place.sa/api";
const LIVE_AFF_KEY = "spin-aff-local";

function affBase() {
  if (process.env.VERCEL) return LIVE_AFF_API;

  const fromEnv = (process.env.AFF_API_URL ?? "").replace(/\/$/, "");
  const isLocal = /localhost|127\.0\.0\.1/i.test(fromEnv);
  if (fromEnv && !isLocal) {
    try {
      const url = new URL(fromEnv);
      if (url.hostname === "place.sa" || url.hostname === "www.place.sa") {
        url.protocol = "https:";
        url.hostname = "place.sa";
        url.pathname = url.pathname.replace(/\/+$/, "") || "/api";
        return `${url.origin}${url.pathname}`.replace(/\/$/, "");
      }
    } catch {
      /* use as-is */
    }
    return fromEnv;
  }
  return fromEnv || LIVE_AFF_API;
}

function affUrl(path: string) {
  const base = affBase().replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}`.replace(/\/+$/, "");
}

function affKey() {
  return process.env.AFF_SPIN_API_KEY || LIVE_AFF_KEY;
}

export function isAffEnabled() {
  return Boolean(affBase() && affKey());
}

export function clientMeta(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "";
  const userAgent = request.headers.get("user-agent") || "";
  return {
    ip_address: ip || undefined,
    user_agent: userAgent || undefined,
  };
}

async function affFetch(path: string, init?: RequestInit): Promise<AffResponse | null> {
  if (!isAffEnabled()) return null;
  try {
    const res = await affRequest(affUrl(path), init);
    return (await res.json()) as AffResponse;
  } catch {
    return null;
  }
}

async function affRequest(url: string, init?: RequestInit, hops = 0): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    redirect: "manual",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Spin-Api-Key": affKey(),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const location = res.headers.get("location");
  if (location && hops < 3 && [301, 302, 303, 307, 308].includes(res.status)) {
    const next = new URL(location, url);
    next.protocol = "https:";
    return affRequest(next.toString().replace(/\/+$/, ""), init, hops + 1);
  }

  return res;
}

export async function affRegisterCustomer(input: {
  name: string;
  phone: string;
  source: BrandId;
  ip_address?: string;
  user_agent?: string;
}) {
  return affFetch("/spin/customers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function affLookupCustomer(phone: string, source: BrandId) {
  const query = new URLSearchParams({ phone, source }).toString();
  return affFetch(`/spin/customers/lookup?${query}`);
}

export function affPublicOrigin() {
  return affBase().replace(/\/api\/?$/, "").replace(/\/$/, "") || "https://place.sa";
}

export async function affPrizeStock(source: BrandId) {
  if (!isAffEnabled()) return null;
  try {
    const query = new URLSearchParams({ source }).toString();
    const res = await affRequest(affUrl(`/spin/customers/stock?${query}`));
    return (await res.json()) as {
      ok?: boolean;
      source?: string;
      counts?: Record<string, number>;
      message?: string;
    };
  } catch {
    return null;
  }
}

export async function affResetPrizeStock(source: BrandId) {
  if (!isAffEnabled()) return { ok: true, deleted: 0 };
  try {
    const res = await affRequest(affUrl("/spin/customers/reset"), {
      method: "POST",
      body: JSON.stringify({ source }),
    });
    const json = (await res.json()) as {
      ok?: boolean;
      deleted?: number;
      message?: string;
    };
    if (!res.ok || json.ok === false) return null;
    return { ok: true, deleted: json.deleted ?? 0 };
  } catch {
    return null;
  }
}

export async function affCompleteSpin(input: {
  name?: string;
  phone: string;
  source: BrandId;
  prize_id: string;
  prize_label: string;
  prize_description?: string;
  prize_empty?: boolean;
  spun_at?: string;
  ip_address?: string;
  user_agent?: string;
}) {
  return affFetch("/spin/complete", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function affSaveSofa(input: {
  name: string;
  phone: string;
  seats: number;
  arm_style: string;
  leg_style: string;
  fabric_color: string;
  fabric_color_hex: string;
  fabric_type: string;
  pillows: string;
  estimated_price: number;
  summary: string;
  style_tag: string;
  config: unknown;
  ip_address?: string;
  user_agent?: string;
}) {
  return affFetch("/place/sofa-designs", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function affSaveExhibitionLead(input: {
  name: string;
  phone: string;
  email?: string;
  region?: string;
  city?: string;
  client_type: "individuals" | "companies";
  company_name?: string;
  entity: "ehg" | "place" | "treeline";
  source?: "desk" | "qr";
  notes?: string;
  ip_address?: string;
  user_agent?: string;
}) {
  return affFetch("/place/exhibition-leads", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type AffProduct = {
  id: number;
  arname: string;
  enname: string;
  arshortdesc?: string | null;
  enshortdesc?: string | null;
  price?: number | null;
  sku?: string | null;
  photo_url?: string | null;
  photo_alt_url?: string | null;
  gallery?: { id: number; url: string | null }[];
  category?: { id: number; arname: string; enname: string } | null;
  new_arrivale?: number;
};

export type AffProductCategory = {
  id: number;
  arname: string;
  enname: string;
  photo_url?: string | null;
};

export async function affListProducts(params: {
  page?: number;
  per_page?: number;
  q?: string;
  category_id?: number;
  main_category?: number;
} = {}) {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.per_page) query.set("per_page", String(params.per_page));
  if (params.q) query.set("q", params.q);
  if (params.category_id) query.set("category_id", String(params.category_id));
  if (params.main_category) query.set("main_category", String(params.main_category));
  const suffix = query.toString() ? `?${query}` : "";
  if (!isAffEnabled()) return null;
  try {
    const res = await affRequest(affUrl(`/place/products${suffix}`));
    return (await res.json()) as {
      ok?: boolean;
      data?: AffProduct[];
      meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
      };
      message?: string;
    };
  } catch {
    return null;
  }
}

export async function affListProductCategories() {
  if (!isAffEnabled()) return null;
  try {
    const res = await affRequest(affUrl("/place/product-categories"));
    return (await res.json()) as {
      ok?: boolean;
      data?: AffProductCategory[];
      message?: string;
    };
  } catch {
    return null;
  }
}

export async function affLookupGuess(phone: string) {
  const query = new URLSearchParams({ phone }).toString();
  return affFetch(`/place/guess/lookup?${query}`);
}

export async function affGuessComplete(input: {
  name: string;
  phone: string;
  score: number;
  max_score: number;
  style_tag?: string;
  prize_id: string;
  prize_label: string;
  prize_description?: string;
  prize_empty?: boolean;
  rounds: unknown;
  ip_address?: string;
  user_agent?: string;
}) {
  return affFetch("/place/guess/complete", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
