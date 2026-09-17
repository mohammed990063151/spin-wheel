export type EnalaKind = "hotel" | "resort" | "hall";

export type EnalaCatalogImage = {
  id: number | string;
  url: string;
  role?: string;
};

export type EnalaCatalogRoom = {
  id: number;
  arname?: string | null;
  enname?: string | null;
  slug?: string | null;
  banner_url?: string | null;
  images: EnalaCatalogImage[];
};

export type EnalaCatalogItem = {
  id: number;
  kind: EnalaKind;
  arname: string;
  enname: string;
  slug?: string | null;
  araddress?: string | null;
  enaddress?: string | null;
  url?: string | null;
  banner_url?: string | null;
  images: EnalaCatalogImage[];
  image_count?: number;
  location?: { id: number; arname: string; enname: string } | null;
  type?: { id: number; arname: string; enname: string; kind: EnalaKind } | null;
  rooms?: EnalaCatalogRoom[];
};

export type EnalaCatalogType = {
  key: EnalaKind;
  arname: string;
  enname: string;
  count: number;
};

type CatalogListResponse = {
  success?: boolean;
  ok?: boolean;
  grouped?: boolean;
  data?:
    | EnalaCatalogItem[]
    | {
        hotel?: EnalaCatalogItem[];
        resort?: EnalaCatalogItem[];
        hall?: EnalaCatalogItem[];
      };
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    counts?: Record<string, number>;
  };
  message?: string;
};

type LegacyHotel = {
  id: number;
  arname?: string | null;
  enname?: string | null;
  slug?: string | null;
  araddress?: string | null;
  enaddress?: string | null;
  hotel_banner?: string | null;
  propertytype_id?: number | string | null;
  location?: { id: number; arname: string; enname: string } | null;
  rooms?: {
    id: number;
    arname?: string | null;
    enname?: string | null;
    slug?: string | null;
    room_banner?: string | null;
  }[];
};

type LegacyResponse = {
  success?: boolean;
  data?: LegacyHotel[];
};

const LIVE_ENALA_API = "https://enala.sa/api";

function enalaBase() {
  const fromEnv = (process.env.ENALA_API_URL ?? "").replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return LIVE_ENALA_API;
}

function enalaKey() {
  return (process.env.ENALA_API_KEY || process.env.ENALA_CATALOG_API_KEY || "").trim();
}

export function isEnalaCatalogEnabled() {
  return Boolean(enalaBase() && enalaKey());
}

const LIST_CACHE_TTL_MS = 180_000;
const listMemory = new Map<string, { at: number; data: CatalogListResponse }>();
const showMemory = new Map<string, { at: number; data: CatalogListResponse }>();

async function enalaRequest<T>(path: string): Promise<T | null> {
  if (!isEnalaCatalogEnabled()) {
    console.error("[enala] missing API URL or key");
    return null;
  }
  const url = `${enalaBase()}${path.startsWith("/") ? path : `/${path}`}`;
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-API-KEY": enalaKey(),
        "X-Enala-Catalog-Key": enalaKey(),
      },
      cache: "no-store",
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) {
      console.error("[enala] API request failed", { path, status: res.status });
      return null;
    }
    return (await res.json()) as T;
  } catch (error) {
    console.error("[enala] API request failed", { path, error });
    return null;
  }
}

async function enalaFetch(path: string): Promise<CatalogListResponse | null> {
  return enalaRequest<CatalogListResponse>(path);
}

export async function enalaCatalogTypes() {
  return enalaFetch("/v1/catalog/types");
}

export async function enalaCatalogList(params: {
  kind?: EnalaKind | "";
  q?: string;
  group?: boolean;
  with_rooms?: boolean;
  page?: number;
  per_page?: number;
} = {}) {
  const query = new URLSearchParams();
  if (params.kind) query.set("kind", params.kind);
  if (params.q) query.set("q", params.q);
  if (params.group) query.set("group", "1");
  if (params.with_rooms === false) query.set("with_rooms", "0");
  if (params.page) query.set("page", String(params.page));
  if (params.per_page) query.set("per_page", String(params.per_page));
  const cacheKey = query.toString();
  const hit = listMemory.get(cacheKey);
  if (hit && Date.now() - hit.at < LIST_CACHE_TTL_MS) return hit.data;
  const suffix = cacheKey ? `?${cacheKey}` : "";
  const data = await enalaFetch(`/v1/catalog${suffix}`);
  if (data) listMemory.set(cacheKey, { at: Date.now(), data });
  return data;
}

export async function enalaCatalogShow(id: number) {
  const key = String(id);
  const hit = showMemory.get(key);
  if (hit && Date.now() - hit.at < LIST_CACHE_TTL_MS) return hit.data;
  const data = await enalaFetch(`/v1/catalog/${id}`);
  if (data) showMemory.set(key, { at: Date.now(), data });
  return data;
}

export function slimCatalogItem(item: EnalaCatalogItem): EnalaCatalogItem {
  const cover = item.banner_url || item.images?.[0]?.url || null;
  return {
    id: item.id,
    kind: item.kind,
    arname: item.arname,
    enname: item.enname,
    slug: item.slug,
    araddress: item.araddress,
    enaddress: item.enaddress,
    url: item.url,
    banner_url: cover,
    images: cover ? [{ id: `cover-${item.id}`, url: cover, role: "banner" }] : [],
    image_count: item.image_count || item.images?.length || 0,
    location: item.location ?? null,
    type: item.type ?? null,
  };
}

export async function enalaLegacyCatalogList(params: {
  kind?: EnalaKind | "";
  q?: string;
} = {}): Promise<CatalogListResponse | null> {
  const response = await enalaRequest<LegacyResponse>("/v1/hotel/location");
  if (!response?.success || !Array.isArray(response.data)) return null;

  const needle = (params.q || "").trim().toLocaleLowerCase();
  const items = response.data
    .map(mapLegacyHotel)
    .filter((item) => !params.kind || item.kind === params.kind)
    .filter((item) => {
      if (!needle) return true;
      return [
        item.arname,
        item.enname,
        item.araddress,
        item.enaddress,
        item.location?.arname,
        item.location?.enname,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase().includes(needle));
    });

  return {
    success: true,
    grouped: false,
    data: items,
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: items.length,
      total: items.length,
    },
  };
}

export function flattenCatalog(data: CatalogListResponse["data"]): EnalaCatalogItem[] {
  if (Array.isArray(data)) return data;
  if (!data) return [];
  return [...(data.hotel ?? []), ...(data.resort ?? []), ...(data.hall ?? [])];
}

function mapLegacyHotel(hotel: LegacyHotel): EnalaCatalogItem {
  const kind = legacyKind(hotel.propertytype_id);
  const rooms = (hotel.rooms ?? []).map((room) => {
    const banner = mediaUrl(room.room_banner);
    return {
      id: room.id,
      arname: room.arname,
      enname: room.enname,
      slug: room.slug,
      banner_url: banner,
      images: banner ? [{ id: `room-banner-${room.id}`, url: banner, role: "banner" }] : [],
    };
  });
  const banner = mediaUrl(hotel.hotel_banner);
  const images = uniqueImages([
    ...(banner ? [{ id: `banner-${hotel.id}`, url: banner, role: "banner" }] : []),
    ...rooms.flatMap((room) => room.images),
  ]);

  return {
    id: hotel.id,
    kind,
    arname: hotel.arname || hotel.enname || "",
    enname: hotel.enname || hotel.arname || "",
    slug: hotel.slug,
    araddress: hotel.araddress,
    enaddress: hotel.enaddress,
    url: `${publicOrigin()}/${kind}/${hotel.slug || hotel.id}`,
    banner_url: banner || images[0]?.url || null,
    images,
    image_count: images.length,
    location: hotel.location ?? null,
    type: {
      id: Number(hotel.propertytype_id || 0),
      arname: kind === "hotel" ? "فندق" : kind === "resort" ? "منتجع" : "قاعة",
      enname: kind === "hotel" ? "Hotel" : kind === "resort" ? "Resort" : "Hall",
      kind,
    },
    rooms,
  };
}

function legacyKind(typeId?: number | string | null): EnalaKind {
  const id = Number(typeId);
  if (id === 4) return "hall";
  if (id === 1) return "hotel";
  return "resort";
}

function publicOrigin() {
  try {
    return new URL(enalaBase()).origin;
  } catch {
    return "https://enala.sa";
  }
}

function mediaUrl(path?: string | null): string | null {
  const raw = String(path || "").trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const relative = raw.replace(/^\/+/, "").replace(/^images\//i, "");
  const encoded = relative.split("/").map(encodeURIComponent).join("/");
  return new URL(`/images/${encoded}`, publicOrigin()).toString();
}

function uniqueImages(images: EnalaCatalogImage[]): EnalaCatalogImage[] {
  const seen = new Set<string>();
  return images.filter((image) => {
    if (!image.url || seen.has(image.url)) return false;
    seen.add(image.url);
    return true;
  });
}
